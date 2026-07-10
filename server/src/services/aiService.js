import OpenAI from 'openai';
import { buildSystemPrompt } from '../prompts/gameMaster.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE || 'https://api.cerebras.ai/v1',
});

const MODEL = 'gemma-4-31b';

/**
 * JSON schema instructions appended to the system prompt so the model
 * returns a structured JSON response matching the old tool-use contract.
 */
const JSON_RESPONSE_INSTRUCTIONS = `

RESPONSE FORMAT — You MUST respond with a single valid JSON object (no markdown, no backticks, no extra text). The JSON must follow this exact schema:

{
  "narrative": "string — your story prose, 2-4 paragraphs, second person",
  "title": "string or null — a short evocative title (3-6 words) ONLY on the very first turn, null otherwise",
  "state_update": {
    "health_change": "number or null — amount to add/subtract from health (e.g., -10 for damage, +20 for healing)",
    "stat_changes": "object or null — key-value pairs of stat deltas (e.g., {\"mana\": -15, \"strength\": 2})",
    "inventory_add": "array of strings or null — items gained",
    "inventory_remove": "array of strings or null — items lost",
    "flags": "object or null — story flags to set/update (e.g., {\"dragon_encountered\": true})"
  },
  "suggested_actions": ["string — exactly 2-3 suggested next actions that feel meaningfully different"]
}

Rules for the JSON:
- "narrative" and "suggested_actions" are REQUIRED.
- "state_update" fields are optional — only include fields that actually changed this turn.
- "title" should only be non-null on the FIRST turn of a story.
- Do NOT wrap the JSON in markdown code fences. Return raw JSON only.`;

/**
 * Generate a story turn using Cerebras (LLaMA 3.3 70B) via OpenAI-compatible API with streaming.
 *
 * @param {object} params
 * @param {string} params.genre - The story genre
 * @param {object} params.characterState - Current character state { stats, inventory, flags }
 * @param {string} params.storySummary - Rolling summary of the story so far
 * @param {Array} params.recentTurns - Recent turns [{ playerInput, aiNarrative }]
 * @param {string} params.playerInput - The player's current input
 * @param {boolean} params.isFirstTurn - Whether this is the first turn
 * @param {function} params.onTextChunk - Callback for streaming text chunks
 * @returns {Promise<object>} - { narrative, title, stateUpdate, suggestedActions }
 */
export async function generateStoryTurn({
  genre,
  characterState,
  storySummary,
  recentTurns = [],
  playerInput,
  isFirstTurn = false,
  onTextChunk,
}) {
  const maxTokens = parseInt(process.env.MAX_TOKENS_PER_TURN) || 1024;

  // Build the system prompt with current state injected + JSON format instructions
  const systemPrompt = buildSystemPrompt(
    genre,
    JSON.stringify(characterState, null, 2),
    storySummary
  ) + JSON_RESPONSE_INSTRUCTIONS;

  // Build the messages array: system + recent history + current input
  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  for (const turn of recentTurns) {
    messages.push({ role: 'user', content: `<player_input>${turn.playerInput}</player_input>` });
    messages.push({ role: 'assistant', content: turn.aiNarrative });
  }

  // Current player input
  const currentInput = isFirstTurn
    ? 'Begin the story. Set the scene and introduce the player character to this world.'
    : `<player_input>${playerInput}</player_input>`;

  messages.push({ role: 'user', content: currentInput });

  // Call Cerebras with streaming
  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages,
    stream: true,
  });

  // Accumulate the full response while streaming narrative chunks
  let fullContent = '';
  let lastSentNarrativeLength = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (!delta) continue;

    fullContent += delta;

    // Detect repetition loop — if the model starts repeating "suggested_actions"
    // more than once, it's in a degenerate loop; abort early.
    const saCount = (fullContent.match(/"suggested_actions"/g) || []).length;
    if (saCount > 2) {
      console.warn('Repetition loop detected, aborting stream early.');
      try { stream.controller?.abort(); } catch { /* ignore */ }
      break;
    }

    // Try to extract partial narrative for streaming to the client
    if (onTextChunk) {
      try {
        const narrativeMatch = fullContent.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/);
        if (narrativeMatch) {
          const currentNarrative = narrativeMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

          if (currentNarrative.length > lastSentNarrativeLength) {
            onTextChunk(currentNarrative);
            lastSentNarrativeLength = currentNarrative.length;
          }
        }
      } catch {
        // Partial JSON, ignore parse errors
      }
    }
  }

  // Parse the complete JSON response — with repair for truncated/malformed output
  const result = parseAIResponse(fullContent);

  return {
    narrative: result.narrative || '',
    title: result.title || null,
    stateUpdate: result.state_update || null,
    suggestedActions: result.suggested_actions || [],
  };
}

/**
 * Attempt to parse AI JSON response with fallback repair for truncated output.
 * The model sometimes enters a repetition loop and exceeds max_tokens,
 * producing invalid JSON. This extracts what it can from the partial output.
 */
function parseAIResponse(raw) {
  // Strip markdown code fences if present (model sometimes wraps JSON in ```json ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    raw = fenceMatch[1].trim();
  }

  // First, try direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // Continue to repair
  }

  console.warn('AI returned malformed JSON, attempting repair. Length:', raw.length);

  // Trim any repeated keys — keep only the first occurrence of each top-level key
  // by finding the first complete JSON-like object
  const repaired = raw.replace(
    /("suggested_actions"\s*:\s*\[(?:[^\[\]]*|\[(?:[^\[\]]*|\[[^\[\]]*\])*\])*\]).*$/s,
    '$1}'
  );

  try {
    return JSON.parse(repaired);
  } catch {
    // Continue to field extraction
  }

  // Last resort: extract individual fields via regex
  const result = {};

  // Extract narrative
  const narrativeMatch = raw.match(/"narrative"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (narrativeMatch) {
    result.narrative = narrativeMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  // Extract title
  const titleMatch = raw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (titleMatch) {
    result.title = titleMatch[1];
  }

  // Extract suggested_actions — grab the first valid array
  const actionsMatch = raw.match(/"suggested_actions"\s*:\s*(\[(?:[^\[\]]*|\[(?:[^\[\]]*|\[[^\[\]]*\])*\])*\])/);
  if (actionsMatch) {
    try {
      const parsed = JSON.parse(actionsMatch[1]);
      // Flatten nested arrays (model sometimes wraps each action in its own array)
      result.suggested_actions = parsed.map(a => Array.isArray(a) ? a[0] : a).filter(Boolean);
    } catch {
      result.suggested_actions = ['Look around', 'Continue forward', 'Check inventory'];
    }
  } else {
    result.suggested_actions = ['Look around', 'Continue forward', 'Check inventory'];
  }

  if (!result.narrative) {
    throw new Error('AI returned invalid JSON and narrative could not be extracted.');
  }

  console.warn('Successfully repaired AI response via field extraction.');
  return result;
}

/**
 * Generate a rolling summary of story turns to manage context window.
 *
 * @param {string} existingSummary - Previous summary (if any)
 * @param {Array} turnsToSummarize - Turns to compress into summary
 * @returns {Promise<string>} - Updated summary
 */
export async function generateRollingSummary(existingSummary, turnsToSummarize) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a story summarizer. You produce concise, factual summaries that preserve all important plot points.',
    },
    {
      role: 'user',
      content: `Compress the following story events into a concise but complete summary that preserves all important plot points, character developments, NPC names, locations visited, and key decisions made.

${existingSummary ? `PREVIOUS SUMMARY:\n${existingSummary}\n\n` : ''}NEW EVENTS TO INCORPORATE:
${turnsToSummarize
  .map(
    (t, i) =>
      `Turn ${i + 1}:\nPlayer: ${t.playerInput}\nStory: ${t.aiNarrative}\nState: ${JSON.stringify(t.stateSnapshot)}`
  )
  .join('\n\n')}

Write an updated summary (max 500 words) that a game master could use to continue this story without access to the original turns. Focus on facts, not atmosphere.`,
    },
  ];

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 800,
    messages,
  });

  return response.choices[0].message.content;
}

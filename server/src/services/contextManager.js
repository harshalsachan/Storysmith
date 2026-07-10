/**
 * Context manager — handles rolling summaries and prompt construction
 * to keep the AI context window within budget.
 */

import { generateRollingSummary } from './aiService.js';

// Rough token estimation: ~4 chars per token for English text
function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

/**
 * Determine which turns should be included as recent context
 * and whether a summary update is needed.
 *
 * @param {object} story - The story record (with summary)
 * @param {Array} turns - All turns for this story, ordered by sequence
 * @param {number} budget - Token budget for context (default from env)
 * @returns {{ recentTurns: Array, needsSummaryUpdate: boolean, turnsToSummarize: Array }}
 */
export function prepareContext(story, turns, budget) {
  const contextBudget = budget || parseInt(process.env.CONTEXT_WINDOW_BUDGET) || 8000;
  // Reserve tokens for system prompt and new response
  const availableForHistory = contextBudget - 2000;

  if (turns.length === 0) {
    return { recentTurns: [], needsSummaryUpdate: false, turnsToSummarize: [] };
  }

  // Walk backwards from the most recent turn, accumulating token count
  const recentTurns = [];
  let tokenCount = estimateTokens(story.summary || '');

  for (let i = turns.length - 1; i >= 0; i--) {
    const turn = turns[i];
    const turnTokens =
      estimateTokens(turn.playerInput) + estimateTokens(turn.aiNarrative);

    if (tokenCount + turnTokens > availableForHistory && recentTurns.length >= 3) {
      // We've hit the budget and have at least 3 recent turns
      break;
    }

    recentTurns.unshift(turn);
    tokenCount += turnTokens;
  }

  // If there are turns not included in recent context and no summary exists
  // (or summary is stale), we need a summary update
  const turnsInRecent = new Set(recentTurns.map((t) => t.id));
  const turnsNotInRecent = turns.filter((t) => !turnsInRecent.has(t.id));

  const needsSummaryUpdate = turnsNotInRecent.length > 0 && (
    !story.summary ||
    turnsNotInRecent.length >= 5 // Re-summarize every 5 excluded turns
  );

  return {
    recentTurns,
    needsSummaryUpdate,
    turnsToSummarize: turnsNotInRecent,
  };
}

/**
 * Update the rolling summary for a story if needed.
 *
 * @param {object} prisma - Prisma client instance
 * @param {object} story - The story record
 * @param {Array} turnsToSummarize - Turns to compress
 * @returns {Promise<string>} - The updated summary
 */
export async function updateSummaryIfNeeded(prisma, story, turnsToSummarize) {
  if (turnsToSummarize.length === 0) {
    return story.summary || '';
  }

  const newSummary = await generateRollingSummary(story.summary, turnsToSummarize);

  await prisma.story.update({
    where: { id: story.id },
    data: { summary: newSummary },
  });

  return newSummary;
}

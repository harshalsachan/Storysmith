/**
 * Turns route — handles player input and AI narrative generation.
 * Uses Server-Sent Events (SSE) for streaming responses.
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateStoryTurn } from '../services/aiService.js';
import { prepareContext, updateSummaryIfNeeded } from '../services/contextManager.js';
import { applyStateUpdate } from '../services/stateExtractor.js';

const router = Router();
const prisma = new PrismaClient();

const MAX_TURNS_PER_STORY = parseInt(process.env.MAX_TURNS_PER_STORY) || 100;

/**
 * POST /api/stories/:id/turns
 * Submit player input, get AI narrative via SSE stream.
 *
 * Body: { playerInput: string }
 * Response: SSE stream with events:
 *   - data: { type: 'narrative_chunk', content: string }
 *   - data: { type: 'turn_complete', turn: object, character: object, suggestedActions: string[] }
 *   - data: { type: 'error', message: string }
 */
router.post('/:id/turns', async (req, res, next) => {
  try {
    const storyId = req.params.id;
    const { playerInput } = req.body;

    // Fetch story with character and turns
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        character: true,
        turns: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (!story.character) {
      return res.status(500).json({ error: 'Story has no character data' });
    }

    // Check turn limit
    if (story.turns.length >= MAX_TURNS_PER_STORY) {
      return res.status(429).json({
        error: `This story has reached the maximum of ${MAX_TURNS_PER_STORY} turns.`,
      });
    }

    const isFirstTurn = story.turns.length === 0;

    if (!isFirstTurn && !playerInput) {
      return res.status(400).json({ error: 'playerInput is required after the first turn' });
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Prepare context (determine which turns to include, if summary needed)
      const { recentTurns, needsSummaryUpdate, turnsToSummarize } = prepareContext(
        story,
        story.turns
      );

      // Update summary if needed
      let currentSummary = story.summary || '';
      if (needsSummaryUpdate) {
        currentSummary = await updateSummaryIfNeeded(prisma, story, turnsToSummarize);
      }

      const currentState = {
        stats: story.character.stats,
        inventory: story.character.inventory,
        flags: story.character.flags,
      };

      // Track what we've already sent for deduplication
      let lastSentLength = 0;

      // Generate AI response
      const result = await generateStoryTurn({
        genre: story.genre,
        characterState: currentState,
        storySummary: currentSummary,
        recentTurns: recentTurns.map((t) => ({
          playerInput: t.playerInput,
          aiNarrative: t.aiNarrative,
        })),
        playerInput: playerInput || '',
        isFirstTurn,
        onTextChunk: (fullNarrativeSoFar) => {
          if (fullNarrativeSoFar.length > lastSentLength) {
            const newContent = fullNarrativeSoFar.slice(lastSentLength);
            lastSentLength = fullNarrativeSoFar.length;
            sendEvent({ type: 'narrative_chunk', content: newContent });
          }
        },
      });

      // Apply state updates
      const updatedState = applyStateUpdate(currentState, result.stateUpdate);

      // Determine next sequence number
      const nextSequence = story.turns.length + 1;

      // Persist turn and update character in a transaction
      const [turn, updatedCharacter] = await prisma.$transaction([
        prisma.turn.create({
          data: {
            storyId,
            sequence: nextSequence,
            playerInput: playerInput || '[story begins]',
            aiNarrative: result.narrative,
            stateSnapshot: updatedState,
          },
        }),
        prisma.character.update({
          where: { storyId },
          data: {
            stats: updatedState.stats,
            inventory: updatedState.inventory,
            flags: updatedState.flags,
            name: story.character.name,
          },
        }),
      ]);

      // Update story title if provided (first turn)
      if (result.title && !story.title) {
        await prisma.story.update({
          where: { id: storyId },
          data: { title: result.title },
        });
      }

      // Send the complete turn data
      sendEvent({
        type: 'turn_complete',
        turn: {
          id: turn.id,
          sequence: turn.sequence,
          playerInput: turn.playerInput,
          aiNarrative: result.narrative,
        },
        character: updatedCharacter,
        suggestedActions: result.suggestedActions,
        title: result.title || story.title,
      });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      sendEvent({
        type: 'error',
        message: 'Failed to generate story response. Please try again.',
        retryable: true,
      });
    }

    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;

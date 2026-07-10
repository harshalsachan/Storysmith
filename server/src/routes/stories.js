/**
 * Stories route — CRUD for stories.
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getGenreList, getStartingStats } from '../prompts/gameMaster.js';

const router = Router();
const prisma = new PrismaClient();

const MAX_STORIES_PER_USER = parseInt(process.env.MAX_STORIES_PER_USER) || 10;

/**
 * GET /api/stories
 * List all stories for a user (identified by x-user-id header).
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const stories = await prisma.story.findMany({
      where: { userId },
      include: {
        character: true,
        _count: { select: { turns: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      stories: stories.map((s) => ({
        id: s.id,
        genre: s.genre,
        setting: s.setting,
        title: s.title,
        status: s.status,
        turnCount: s._count.turns,
        character: s.character,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stories/genres
 * List available genres.
 */
router.get('/genres', (_req, res) => {
  res.json({ genres: getGenreList() });
});

/**
 * POST /api/stories
 * Create a new story.
 * Body: { genre: string, setting?: string }
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { genre, setting } = req.body;
    if (!genre) {
      return res.status(400).json({ error: 'genre is required' });
    }

    // Validate genre
    const validGenres = getGenreList().map((g) => g.id);
    if (!validGenres.includes(genre)) {
      return res.status(400).json({ error: `Invalid genre. Choose from: ${validGenres.join(', ')}` });
    }

    // Check story limit
    const storyCount = await prisma.story.count({ where: { userId } });
    if (storyCount >= MAX_STORIES_PER_USER) {
      return res.status(429).json({
        error: `Maximum ${MAX_STORIES_PER_USER} stories allowed. Delete an old story to create a new one.`,
      });
    }

    // Get starting stats for genre
    const startingState = getStartingStats(genre);

    // Create story + character in a transaction
    const story = await prisma.story.create({
      data: {
        userId,
        genre,
        setting: setting || null,
        character: {
          create: {
            stats: startingState.stats,
            inventory: startingState.inventory,
            flags: startingState.flags,
          },
        },
      },
      include: { character: true },
    });

    res.status(201).json({ story });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stories/:id
 * Get a single story with its turns and character.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const story = await prisma.story.findUnique({
      where: { id: req.params.id },
      include: {
        character: true,
        turns: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ story });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/stories/:id
 * Delete a story and all its data.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const story = await prisma.story.findUnique({ where: { id: req.params.id } });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }

    await prisma.story.delete({ where: { id: req.params.id } });

    res.json({ message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;

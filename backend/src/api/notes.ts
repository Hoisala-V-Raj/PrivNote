import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { createNote, viewNote, summarizeNote } from '../services/noteService';
import { validateNote } from '../middleware/validation';

const summarizeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 summarizations per minute per IP
  message: 'Too many summarization requests, please try again later',
});

const router = Router();

// Create a new note
router.post('/', validateNote, async (req: Request, res: Response) => {
  try {
    const { note } = req.body;
    // In development, skip baseUrl construction to use FRONTEND_URL from env
    let baseUrl: string | undefined;
    if (process.env.NODE_ENV !== 'development') {
      const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
      const host = req.get('Host') || req.hostname;
      baseUrl = `${protocol}://${host}`;
    }
    const result = await createNote(note, baseUrl);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Get note by ID
router.get('/:noteId', async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const { password } = req.query;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const note = await viewNote(noteId, password as string);
    res.json(note);
  } catch (error) {
    if ((error as any).message === 'Note not found') {
      return res.status(404).json({ error: 'Note not found' });
    }
    if ((error as any).message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

// Summarize note
router.post('/:noteId/summarize', summarizeLimiter, async (req: Request, res: Response) => {
  console.log('🔥 SUMMARIZE ENDPOINT CALLED!', { noteId: req.params.noteId, body: req.body });
  
  try {
    const { noteId } = req.params;
    const { password } = req.body;

    console.log('🔍 Request data:', { noteId, hasPassword: !!password });

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    console.log('📝 Calling summarizeNote service...');
    const summary = await summarizeNote(noteId, password);
    console.log('✅ Summary generated:', summary);
    
    res.json(summary);
  } catch (error) {
    console.error('❌ Summarization error:', error);
    
    if ((error as any).message === 'Note not found') {
      return res.status(404).json({ error: 'Note not found' });
    }
    if ((error as any).message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid password' });
    }
    if ((error as any).message.includes('OpenAI API key not configured')) {
      return res.status(503).json({ error: 'Summarization service not available' });
    }
    res.status(500).json({ error: 'Failed to summarize note' });
  }
});

export default router;

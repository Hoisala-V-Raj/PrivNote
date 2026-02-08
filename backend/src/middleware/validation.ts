import { Request, Response, NextFunction } from 'express';

export function validateNote(req: Request, res: Response, next: NextFunction) {
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Note cannot be empty' });
  }

  if (typeof note !== 'string') {
    return res.status(400).json({ error: 'Note must be a string' });
  }

  if (note.length > 500) {
    return res.status(400).json({ error: 'Note must be under 500 characters' });
  }

  next();
}

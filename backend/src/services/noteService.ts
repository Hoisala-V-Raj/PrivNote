import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../database';
import { Note } from '../models/Note';
import { LlmService } from './llmService';

const noteRepository = AppDataSource.getRepository(Note);
const llmService = LlmService.getInstance();

export async function createNote(noteText: string, baseUrl?: string) {
  const noteId = uuidv4();
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const note = noteRepository.create({
    id: noteId,
    text: noteText,
    passwordHash,
    summary: null,
    summaryGeneratedAt: null,
  });

  await noteRepository.save(note);

  const fallbackBaseUrl = process.env.FRONTEND_URL || 'https://localhost:3000';
  const resolvedBaseUrl = baseUrl || fallbackBaseUrl;

  return {
    noteId,
    password,
    shareUrl: `${resolvedBaseUrl}/note/${noteId}`,
  };
}

export async function viewNote(noteId: string, password: string) {
  const note = await noteRepository.findOne({ where: { id: noteId } });

  if (!note) {
    throw new Error('Note not found');
  }

  const isPasswordValid = await bcrypt.compare(password, note.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  return {
    id: note.id,
    text: note.text,
    createdAt: note.createdAt,
  };
}

export async function summarizeNote(noteId: string, password: string) {
  console.log(' SUMMARIZE NOTE SERVICE CALLED:', { noteId, hasPassword: !!password });

  const note = await noteRepository.findOne({ where: { id: noteId } });

  if (!note) {
    throw new Error('Note not found');
  }

  const isPasswordValid = await bcrypt.compare(password, note.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  console.log(' NOTE DATA:', {
    hasExistingSummary: !!note.summary,
    hasSummaryGeneratedAt: !!note.summaryGeneratedAt,
    existingSummary: note.summary
  });

  // Temporarily disable caching to test new summarization logic
  // if (note.summary && note.summaryGeneratedAt) {
  //   return {
  //     noteId,
  //     summary: note.summary,
  //     cached: true,
  //   };
  // }

  try {
    console.log(' CALLING LLM SERVICE...');
    // Generate new summary
    const summary = await llmService.summarizeNote(note.text);

    console.log(' SUMMARY GENERATED:', summary);

    // Cache the summary
    note.summary = summary;
    note.summaryGeneratedAt = new Date();
    await noteRepository.save(note);

    return {
      noteId,
      summary,
      cached: false,
    };
  } catch (error) {
    console.error(' SUMMARY GENERATION FAILED:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate summary: ${message}`);
  }
}

function generatePassword(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

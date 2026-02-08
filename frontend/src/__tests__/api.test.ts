import { describe, it, expect, vi } from 'vitest';
import { noteService } from '../services/api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('API Service', () => {
  it('should have createNote method', () => {
    expect(noteService.createNote).toBeDefined();
    expect(typeof noteService.createNote).toBe('function');
  });

  it('should have getNote method', () => {
    expect(noteService.getNote).toBeDefined();
    expect(typeof noteService.getNote).toBe('function');
  });

  it('should have summarizeNote method', () => {
    expect(noteService.summarizeNote).toBeDefined();
    expect(typeof noteService.summarizeNote).toBe('function');
  });
});

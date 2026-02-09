import React, { useState } from 'react';
import { noteService } from '../services/api';

interface CreateNoteResponse {
  noteId: string;
  password: string;
  shareUrl: string;
}

function CreateNoteForm() {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateNoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyText = async (text: string, successMessage: string) => {
    if (!text) {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert(successMessage);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const succeeded = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (!succeeded) {
        throw new Error('copy failed');
      }

      alert(successMessage);
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await noteService.createNote(note);
      setResult(response);
      setNote('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (result?.shareUrl) {
      void copyText(result.shareUrl, 'URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">PrivNote</h1>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Note (max 500 characters)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                placeholder="Write your private note here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">{note.length}/500</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Creating...' : 'Create Note'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">✓ Note created successfully!</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={result.password}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={() => void copyText(result.password, 'Password copied to clipboard!')}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Share this password with others</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={result.shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setNote('');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
            >
              Create Another Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateNoteForm;

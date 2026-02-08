import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { noteService } from '../services/api';

interface NoteData {
  id: string;
  text: string;
  createdAt: string;
}

function ViewNote() {
  const { noteId } = useParams<{ noteId: string }>();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<NoteData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const noteData = await noteService.getNote(noteId!, password);
      setNote(noteData);
      setUnlocked(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to unlock note');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setError(null);

    try {
      const result = await noteService.summarizeNote(noteId!, password);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to summarize note');
    } finally {
      setSummarizing(false);
    }
  };

  if (!noteId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Invalid note link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">PrivNote</h1>

        {!unlocked ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Password to Unlock Note
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the password..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Unlocking...' : 'Unlock Note'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ Note unlocked</p>
            </div>

            {note && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{note.text}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!summary ? (
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {summarizing ? 'Summarizing...' : 'Summarize this Note'}
              </button>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewNote;

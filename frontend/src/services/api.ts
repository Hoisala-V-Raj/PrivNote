import axios from 'axios';

const API_BASE_URL = '/api';

export const noteService = {
  createNote: async (noteText: string) => {
    const response = await axios.post(`${API_BASE_URL}/notes`, {
      note: noteText,
    });
    return response.data;
  },

  getNote: async (noteId: string, password: string) => {
    const response = await axios.get(`${API_BASE_URL}/notes/${noteId}`, {
      params: { password },
    });
    return response.data;
  },

  summarizeNote: async (noteId: string, password: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/notes/${noteId}/summarize`,
      { password }
    );
    return response.data;
  },
};

import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export const noteService = {
  createNote: async (noteText: string) => {
    const response = await axios.post(`${API_BASE_URL}/notes`, { note: noteText });
    return response.data;
  },

  getNote: async (noteId: string, password: string) => {
    const response = await axios.get(`${API_BASE_URL}/notes/${noteId}`, {
      params: { password },
    });
    return response.data;
  },

  summarizeNote: async (noteId: string, password: string) => {
    console.log('🚀 FRONTEND: Making summarize API call', { noteId, hasPassword: !!password });
    try {
      const response = await axios.post(`${API_BASE_URL}/notes/${noteId}/summarize`, {
        password,
      });
      console.log('✅ FRONTEND: Summarize API response', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ FRONTEND: Summarize API error', error);
      throw error;
    }
  },
};

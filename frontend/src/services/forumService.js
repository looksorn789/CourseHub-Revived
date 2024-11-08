import api from './api';

export const forumService = {
  getForumBySlug: async (slug) => {
    try {
      console.log('Fetching forum with slug:', slug);
      const response = await api.get(`/api/forums/${slug}`);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getForumBySlug:', error);
      throw error;
    }
  },

  updateMembership: async (forumId, action) => {
    try {
      const response = await api.post(`/api/forums/${forumId}/members`, { action });
      return response.data;
    } catch (error) {
      console.error('Error in updateMembership:', error);
      throw error;
    }
  },
};
import api from './api';

export const createProfile = async (profileData) => {
  try {
    const response = await api.post('/api/profile', profileData);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Profile creation error:', error);
    return { 
      data: null, 
      error: error.response?.data?.error || error.message 
    };
  }
};
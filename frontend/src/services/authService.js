import api from './api';

export const signup = async (userData) => {
  try {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmailCode = async (email, code) => {
  try {
    const response = await api.post("/auth/verify-email", {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const signin = async (email, password) => {
  try {
    const response = await api.post("/auth/signin", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const requestResetPassword = async (email) => {
  try {
    const response = await api.post("/auth/request-reset-password", {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
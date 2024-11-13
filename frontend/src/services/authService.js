import api from "./api";

export const signup = async (userData) => {
  try {
    const response = await api.post("/api/auth/signup", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyEmailCode = async (email, code) => {
  try {
    const response = await api.post("/api/auth/verify-email", {
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
    const response = await api.post("/api/auth/signin", {
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
    const response = await api.post("/api/auth/request-reset-password", {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/api/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async (email) => {
  try {
    const response = await axios.delete("/auth/delete_account", {
      data: { email },  // Pass email as payload for the delete request
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: "Network Error" };
  }
};



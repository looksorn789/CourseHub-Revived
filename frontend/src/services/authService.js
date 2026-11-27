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

/**
 * Store the session returned by /api/auth/signin so PrivateRoute and the
 * rest of the app see the user as signed in.
 */
export const saveSession = (data) => {
  localStorage.setItem("jwt_token", data.jwt_token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      user_id: data.user_id,
      username: data.username,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      profile_completed: data.profile_completed,
      avatar: data.avatar,
    }),
  );
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
    const response = await api.delete("/api/auth/delete_account", {
      data: { email }, // Include email in the request payload
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Network Error" };
  }
};



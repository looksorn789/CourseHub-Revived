import api from "./api";

export const createProfile = async (profileData) => {
  try {
    const response = await api.post("/api/profile", profileData);
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Profile creation error:", error);
    return {
      data: null,
      error: error.response?.data?.error || error.message,
    };
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get("/api/profile/user");
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { data: null, error: error.response?.data?.error || error.message };
  }
};

export const getOtherUserProfile = async (userId) => {
  try {
    const token = localStorage.getItem("token");
    const url = userId ? `/api/profile/user/${userId}` : `/api/profile/user`;
    const response = await api.get(url, {
      headers: {
        Authorization: `Bearer ${token}`, // Attach token to each request
      },
    });
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { data: null, error: error.response?.data?.error || error.message };
  }
};


// Use PUT to fully save or replace the user profile
export const saveUserProfile = async (profileData, email, username) => {
  try {
    const response = await api.put("/api/profile/user", {
      profile: profileData,
      email,
      username,
    });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    console.error("Error saving user profile:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

// PATCH user profile with profile data from the frontend
export const editUserProfile = async (profileData) => {
  try {
    const response = await api.patch("/api/profile/user", { profile: profileData });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};
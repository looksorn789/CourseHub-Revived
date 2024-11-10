import api from "./api";

export const createProfile = async (profileData) => {
  try {
    const response = await api.post("/api/profile/", profileData);
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
    const response = await api.get("api/profile/user");
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { data: null, error: error.response?.data?.error || error.message };
  }
};

export const getUserById = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const response = await api.get(`/api/profile/user/${userId}`);
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { 
      data: null, 
      error: error.response?.data?.error || 'Error fetching user profile' 
    };
  }
};

// Use PUT to fully save or replace the user profile
export const saveUserProfile = async (profileData, email, username) => {
  try {
    const response = await api.put("/api/user", {
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
    const response = await api.patch("/api/user", { profile: profileData });
    return { success: true, data: response.data, error: null };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

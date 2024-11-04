import api from "./api";

export const createForum = async (forumData) => {
  try {
    const response = await api.post("/api/forums", forumData);
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Profile creation error:", error);
    return {
      data: null,
      error: error.response?.data?.error || error.message,
    };
  }
};

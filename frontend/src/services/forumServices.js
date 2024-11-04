import api from "./api";

export const createForum = async (forumData) => {
  try {
    const response = await api.post("/api/forums/", forumData);
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Forum creation error:", error);
    return {
      data: null,
      error: error.response?.data?.error || error.message,
    };
  }
};

export const getAllForums = async () => {
  try {
    const response = await api.get("/api/forums/"); 
    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error fetching forums:", error);
    return { data: null, error: error.response?.data?.error || error.message };
  }
};
export const joinForum = async (forumId) => {
    try {
      const response = await api.post(`/api/forums/${forumId}/members`, {
        action: "join",
      });
      return { data: response.data, error: null };
    } catch (error) {
      console.error("Error joining forum:", error);
      return {
        data: null,
        error: error.response?.data?.error || error.message,
      };
    }
  };
  export const leaveForum = async (forumId) => {
    try {
      const response = await api.post(`/api/forums/${forumId}/members`, {
        action: "leave",
      });
      return { data: response.data, error: null };
    } catch (error) {
      console.error("Error leaving forum:", error);
      return {
        data: null,
        error: error.response?.data?.error || error.message,
      };
    }
  };
  
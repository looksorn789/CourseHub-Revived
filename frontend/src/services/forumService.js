import api from "./api";

export const forumService = {
    getForumBySlug: async (slug) => {
      try {
        const response = await api.get(`/api/forums/${slug}`);
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
    getAllForums: async () => {
        try {
          const response = await api.get("/api/forums/"); 
          return { data: response.data, error: null };
        } catch (error) {
          console.error("Error fetching forums:", error);
          return { data: null, error: error.response?.data?.error || error.message };
        }
      },
      createForum : async (forumData) => {
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
      },
      joinForum : async (forumId) => {
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
      },
      leaveForum : async (forumId) => {
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
      },
  };


  
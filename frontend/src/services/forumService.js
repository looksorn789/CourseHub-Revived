import api from "./api";

// Fired after joining, leaving or creating a forum so the sidebar's
// "My Channels" list can refresh itself.
export const FORUMS_CHANGED_EVENT = "coursehub:forums-changed";
const notifyForumsChanged = () => window.dispatchEvent(new Event(FORUMS_CHANGED_EVENT));

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
        notifyForumsChanged();
        return response.data;
      } catch (error) {
        console.error('Error in updateMembership:', error);
        throw error;
      }
    },
    getMyForums: async () => {
      try {
        const response = await api.get("/api/forums/mine");
        return { data: response.data.forums || [], error: null };
      } catch (error) {
        console.error("Error fetching your forums:", error);
        return { data: [], error: error.response?.data?.error || error.message };
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
          notifyForumsChanged();
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
          notifyForumsChanged();
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
          notifyForumsChanged();
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


  
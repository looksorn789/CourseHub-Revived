import api from "./api";
import { invalidateCached } from "../utils/queryCache";

// Fired after joining, leaving or creating a forum so the sidebar's
// "My Channels" list can refresh itself.
export const FORUMS_CHANGED_EVENT = "coursehub:forums-changed";
const notifyForumsChanged = () => {
  // Channel data changed (join/leave/pin/edit/create): drop cached copies.
  invalidateCached("forums:", "channel:", "search:");
  window.dispatchEvent(new Event(FORUMS_CHANGED_EVENT));
};

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
    updateForum: async (forumId, updates) => {
      try {
        const response = await api.patch(`/api/forums/${forumId}`, updates);
        notifyForumsChanged();
        return { data: response.data.forum, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data?.error || error.message };
      }
    },
    // kind: "avatar" (channel icon) or "banner". Owner only (enforced by the API).
    uploadForumImage: async (forumId, kind, file) => {
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await api.post(`/api/forums/${forumId}/images/${kind}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        });
        notifyForumsChanged();
        return { data: response.data, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data?.error || error.message };
      }
    },
    removeForumImage: async (forumId, kind) => {
      try {
        const response = await api.delete(`/api/forums/${forumId}/images/${kind}`);
        notifyForumsChanged();
        return { data: response.data, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data?.error || error.message };
      }
    },
    getPinnedForums: async () => {
      try {
        const response = await api.get("/api/forums/pinned");
        return { data: response.data.forums || [], error: null };
      } catch (error) {
        return { data: [], error: error.response?.data?.error || error.message };
      }
    },
    setPinned: async (forumId, pinned) => {
      try {
        const response = pinned
          ? await api.put(`/api/forums/${forumId}/pin`)
          : await api.delete(`/api/forums/${forumId}/pin`);
        notifyForumsChanged();
        return { data: response.data, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data?.error || error.message };
      }
    },
    // Popular public channels the user hasn't joined.
    getSuggestedForums: async (limit = 5) => {
      try {
        const response = await api.get("/api/forums/suggestions", { params: { limit } });
        return { data: response.data.forums || [], error: null };
      } catch (error) {
        return { data: [], error: error.response?.data?.error || error.message };
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


  
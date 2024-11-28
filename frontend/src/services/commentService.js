import api from './api';

class CommentService {
  static async createComment(postId, commentData) {
    try {
      const response = await api.post(`/api/comments/post/${postId}/comments`, {
        content: commentData.content,
        parent_id: commentData.parentId || null,
        mentioned_user: commentData.mentionedUser || null
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getComments(postId, page = 1, perPage = 20) {
    try {
      const response = await api.get(`/api/comments/post/${postId}/comments`, {
        params: { page, per_page: perPage }
      });
      console.log('Fetched comments from getComments:', response.data.comments);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createReply(commentId, replyData) {
    try {
      const response = await api.post(`/api/comments/${commentId}/replies`, {
        content: replyData.content,
        mentioned_user: replyData.mentionedUser || null
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateComment(commentId, content) {
    try {
      const response = await api.patch(`/api/comments/${commentId}`, {
        content
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteComment(commentId) {
    try {
      const response = await api.delete(`/api/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async toggleLike(commentId) {
    try {
      const response = await api.post(`/api/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}


export default CommentService;
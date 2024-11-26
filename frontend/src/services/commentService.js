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
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updateComment(commentId, content) {
    try {
      const response = await api.patch(`/api/comments/comments/${commentId}`, {
        content
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteComment(commentId) {
    try {
      const response = await api.delete(`/api/comments/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default CommentService;
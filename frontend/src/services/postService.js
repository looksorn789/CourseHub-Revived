import api from './api';

class PostService {
  static async createPost(forumId, postData) {
    if (!forumId) {
      throw new Error('Forum ID is required');
    }

    try {
      if (postData.tags && postData.tags.length > 5) {
        throw new Error('Maximum 5 tags allowed');
      }
      
      const response = await api.post(`/api/posts/forum/${forumId}`, {
        title: postData.title,
        content: postData.content,
        type: postData.type,
        tags: postData.tags || []
      });

      if (response.data.error) {
        throw new Error(response.data.details || response.data.error);
      }

      return response;
    } catch (error) {
      if (error.response?.data?.details) {
        throw new Error(error.response.data.details);
      }
      throw error;
    }
  }

  static async getPost(postId) {
    try {
      const response = await api.get(`/api/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async getForumPosts(forumId, page = 1, perPage = 20, type = null) {
    try {
      let url = `/api/posts/forum/${forumId}?page=${page}&per_page=${perPage}`;
      if (type) {
        url += `&type=${type}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async updatePost(postId, updateData) {
    try {
      const response = await api.put(`/api/posts/${postId}`, {
        title: updateData.title,
        content: updateData.content,
        type: updateData.type
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deletePost(postId) {
    try {
      const response = await api.delete(`/api/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default PostService;
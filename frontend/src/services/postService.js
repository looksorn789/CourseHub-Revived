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

  // Photos: author only (enforced by the API). Return { data, error }.
  static async uploadPostImage(postId, file) {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post(`/api/posts/${postId}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.error || error.message };
    }
  }

  static async removePostImage(postId, url) {
    try {
      const response = await api.delete(`/api/posts/${postId}/images`, { data: { url } });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.error || error.message };
    }
  }

  // Home feed: joined channels + friends + own posts, newest first.
  static async getFeed(page = 1, perPage = 20) {
    const response = await api.get('/api/posts/feed', { params: { page, per_page: perPage } });
    return response.data;
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
        title: updateData?.title || '',
        content: updateData?.content || '',
        type: updateData?.type || 'discussion',
        tags: updateData.tags || []
      });

      return response.data;
    } catch (error) {
      console.error('Error updating post:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update post');
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
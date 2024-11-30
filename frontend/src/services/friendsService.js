import api from './api';

export const sendFriendRequest = async (receiverId) => {
  try {
    const response = await api.post('/api/friend-request/send', { receiver_id: receiverId });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error sending friend request',
    };
  }
};

export const getPendingRequests = async () => {
  try {
    const response = await api.get('/api/friend-request/pending');
    const transformedRequests = response.data.requests.map((req) => ({
      id: req.request_id,
      sender: {
        id: req.sender.id,
        name: `${req.sender.profile.first_name} ${req.sender.profile.last_name}`,
        username: req.sender.username,
        avatar: `https://api.dicebear.com/6.x/${
          req.sender.profile.avatar_config?.style || 'adventurer'
        }/svg?seed=${req.sender.profile.avatar_config?.seed || req.sender.username}`,
        profile: req.sender.profile,
      },
      created_at: req.created_at,
    }));
    return { data: transformedRequests, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.error || 'Error getting pending requests',
    };
  }
};

export const getSentRequests = async () => {
  try {
    const response = await api.get('/api/friend-request/sent');
    const transformedRequests = response.data.requests.map((req) => ({
      id: req.request_id,
      receiver: {
        id: req.receiver.id,
        name: `${req.receiver.profile.first_name} ${req.receiver.profile.last_name}`,
        username: req.receiver.username,
        avatar: `https://api.dicebear.com/6.x/${
          req.receiver.profile.avatar_config?.style || 'adventurer'
        }/svg?seed=${req.receiver.profile.avatar_config?.seed || req.receiver.username}`,
        profile: req.receiver.profile,
      },
      created_at: req.created_at,
    }));
    return { data: transformedRequests, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.error || 'Error getting sent requests',
    };
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.post('/api/friend-request/respond', {
      request_id: requestId,
      accept: true,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error accepting friend request',
    };
  }
};

export const declineFriendRequest = async (requestId) => {
  try {
    const response = await api.post('/api/friend-request/respond', {
      request_id: requestId,
      accept: false,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error declining friend request',
    };
  }
};

export const cancelFriendRequest = async (requestId) => {
  try {
    const response = await api.post('/api/friend-request/cancel', { request_id: requestId });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error cancelling friend request',
    };
  }
};

export const getFriends = async () => {
  try {
    const response = await api.get('/api/friends');
    const transformedFriends = response.data.friends.map((friend) => ({
      id: friend._id,
      name: `${friend.profile.first_name} ${friend.profile.last_name}`,
      username: friend.username,
      avatar: `https://api.dicebear.com/6.x/${
        friend.profile.avatar_config?.style || 'adventurer'
      }/svg?seed=${friend.profile.avatar_config?.seed || friend.username}`,
      profile: friend.profile,
    }));
    return { data: transformedFriends, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.error || 'Error getting friends',
    };
  }
};

export const unfriendUser = async (userId) => {
  try {
    const response = await api.post('/api/friends/unfriend', { user_id: userId });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error unfriending user',
    };
  }
};

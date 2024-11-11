import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus, Check, ChevronDown, Hash } from 'lucide-react';
import { Post } from '../posts/Post';
import { CreatePostModal } from '../posts/CreatePostModal';
import { FullPostModal } from '../posts/FullPostModal';
import { ChannelSidebar } from './ChannelSidebar';
import { forumService } from '../../services/forumService';
import PostService from '../../services/postService';
import { getUserById } from '../../services/profileService';
import { getUserProfile } from '../../services/profileService';
import { generateAvatarSvg } from '../../utils/avatarUtils';


const LoadingState = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="animate-pulse">
      <div className="w-full h-80 bg-gray-200 rounded-3xl mb-16"></div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-36 h-36 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const tempImage = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=400&q=80';

const transformPost = async (post, forumName = 'Unknown Channel') => {
  // Default author object
  const defaultAuthor = {
    name: 'Anonymous',
    image: tempImage,
    username: 'anonymous',
    channel: forumName
  };

  // Base post structure with defaults
  const basePost = {
    id: post._id,
    title: post.title || 'Untitled Post',
    content: post.content || '',
    tags: post.tags || [],
    timestamp: new Date(post.created_at || Date.now()),
    likes: 0,
    comments: [],
    type: post.type || 'discussion',
    metadata: post.metadata || {},
    view_count: post.view_count || 0
  };

  try {
    const { data: userData, error } = await getUserById(post.user_id);
    
    // If no user data, return post with default author
    if (error || !userData) {
      console.warn(`Could not fetch user data for post ${post._id}:`, error);
      return {
        ...basePost,
        author: defaultAuthor
      };
    }

    // Generate avatar URL from avatar_config
    let avatarUrl = tempImage;
    if (userData.profile?.avatar_config) {
      const { style, seed, options } = userData.profile.avatar_config;
      const svg = generateAvatarSvg(style, seed, options);
      avatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    const firstName = userData.profile?.first_name || '';
    const lastName = userData.profile?.last_name || '';

    return {
      ...basePost,
      author: {
        name: userData.profile ? `${firstName} ${lastName}` : userData.username || 'Anonymous',
        image: avatarUrl,
        username: userData.username || 'anonymous',
        channel: forumName
      }
    };
  } catch (error) {
    console.error('Error transforming post:', error);
    return {
      ...basePost,
      author: defaultAuthor
    };
  }
};

export function ChannelProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [isJoined, setIsJoined] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [channelPosts, setChannelPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "",
    username: "",
    avatarUrl: "",
    initials: ""
  });

  const transformForumData = (forumData) => {
    if (!forumData) return null;
    
    return {
      _id: forumData._id || '',
      name: forumData.name || 'Untitled Channel',
      description: forumData.description || '',
      member_count: forumData.member_count || 0,
      category: forumData.category || '',
      visibility: forumData.visibility || 'public',
      creator_id: forumData.creator_id || '',
      members: forumData.members || [],
      tags: Array.isArray(forumData.tags) ? forumData.tags : [],
      rules: forumData.rules ? forumData.rules.split('\n').filter(rule => rule.trim()) : [],
      bannerImage: forumData.banner_url || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=400&q=80',
      profileImage: forumData.avatar_url || 'https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=200&h=200&q=80',
      created_at: forumData.created_at || new Date().toISOString(),
      updated_at: forumData.updated_at || new Date().toISOString(),
      metadata: forumData.metadata || { views: 0, trending_score: 0 }
    };
  };

  const fetchPostsWithUserData = async (forumId, forumName, page = 1) => {
    try {
      const postsResponse = await PostService.getForumPosts(forumId, page);
      
      if (!postsResponse.data?.posts) {
        throw new Error('Invalid posts response');
      }

      const transformedPosts = await Promise.all(
        postsResponse.data.posts.map(post => transformPost(post, forumName))
      );

      return {
        posts: transformedPosts,
        total: postsResponse.data.total || 0,
        page: postsResponse.data.page || 1,
        total_pages: postsResponse.data.total_pages || 1,
        per_page: postsResponse.data.per_page || 20
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        posts: [],
        total: 0,
        page: 1,
        total_pages: 1,
        per_page: 20
      };
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data, error } = await getUserProfile();
        if (data && data.profile) {
          const { first_name, last_name, avatar_config } = data.profile;
          const fullName = `${first_name} ${last_name}`;
          const username = data.username;
          let avatarUrl = "";

          if (avatar_config) {
            const { style, seed, options } = avatar_config;
            const svg = generateAvatarSvg(style, seed, options);
            avatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          }

          setCurrentUser({
            name: fullName,
            username: username,
            avatarUrl: avatarUrl,
            initials: `${first_name?.[0] || ''}${last_name?.[0] || ''}`
          });
        } else if (error) {
          console.error("Failed to fetch user data:", error);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchChannelData = async () => {
      setLoading(true);
      try {
        const response = await forumService.getForumBySlug(slug);
        const transformedData = transformForumData(response);
        
        if (!transformedData) {
          throw new Error('Invalid channel data received');
        }

        setChannelData(transformedData);

        const postsData = await fetchPostsWithUserData(transformedData._id, 1);
        setChannelPosts(postsData.posts);
        setTotalPages(Math.ceil(postsData.total / postsData.per_page));
        setHasMore(postsData.page < postsData.total_pages);

        const isUserMember = transformedData.members.some(
          member => member.user_id === 'current-user-id'
        );
        setIsJoined(isUserMember);

      } catch (err) {
        console.error('Error fetching channel:', err);
        setError(err.message || 'Failed to load channel');
        if (err.response?.status === 404) {
          navigate('/404');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchChannelData();
    }
  }, [slug, navigate]);

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || !channelData) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const postsData = await fetchPostsWithUserData(channelData._id, nextPage);
      
      setChannelPosts(prevPosts => [...prevPosts, ...postsData.posts]);
      setCurrentPage(nextPage);
      setHasMore(postsData.page < postsData.total_pages);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreatePost = async (postData) => {
    if (!channelData?._id) return;

    try {
      console.log('Creating post with data:', postData);
      const response = await PostService.createPost(channelData._id, postData);
      
      if (response.data.success === false) {
        throw new Error(response.data.details || 'Failed to create post');
      }
      console.log('Post creation response:', response.data);
      const transformedPost = await transformPost(response.data.data, channelData.name);
      setChannelPosts(prevPosts => [transformedPost, ...prevPosts]);
      setIsCreatePostModalOpen(false);
    } catch (err) {
      throw new Error(err.response?.data?.details || err.message || 'Failed to create post');
    }
  };

  const handleJoinChannel = async () => {
    if (!channelData?._id) return;

    try {
      const action = isJoined ? 'leave' : 'join';
      await forumService.updateMembership(channelData._id, action);
      setIsJoined(!isJoined);
      setChannelData(prevData => ({
        ...prevData,
        member_count: isJoined ? prevData.member_count - 1 : prevData.member_count + 1
      }));
    } catch (err) {
      console.error('Error updating membership:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  if (!channelData) return <div className="text-center py-8">Channel not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative mb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={channelData.bannerImage}
            alt={`${channelData.name} Banner`}
            className="w-full h-80 object-cover rounded-3xl shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-3xl"></div>
        </motion.div>
        <motion.div 
          className="absolute -bottom-12 left-8 flex items-end space-x-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Avatar className="h-36 w-36 border-4 border-white shadow-lg rounded-full">
            <AvatarImage src={channelData.profileImage} alt={channelData.name} />
            <AvatarFallback>{channelData.name[0]}</AvatarFallback>
          </Avatar>
          <div className="mb-4">
            <h1 className="text-5xl font-bold text-white shadow-sm mb-2">{channelData.name}</h1>
            <div className="flex items-center text-sm text-white/80">
              <Hash className="h-4 w-4 mr-1" />
              <span>{channelData.category}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end items-start mt-20 mb-8">
        <Button
          className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
            isJoined
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          onClick={handleJoinChannel}
        >
          {isJoined ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              <span>Joined</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              <span>Join</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-8">
        <div className="flex-grow max-w-3xl">
          <div className="flex items-center space-x-4 mb-6 bg-white rounded-full shadow-md p-2 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback>{currentUser.initials || '?'}</AvatarFallback>
            </Avatar>
            <Input
              placeholder="Let's share what's going on your mind..."
              className="flex-grow bg-transparent border-none text-sm focus:ring-0 focus:outline-none"
              onClick={() => setIsCreatePostModalOpen(true)}
            />
            <Button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="bg-green-600 text-white hover:bg-green-700 rounded-full px-6 py-2 font-semibold transition-colors duration-300"
            >
              Post
            </Button>
          </div>
          
          <AnimatePresence>
            {channelPosts.map((post) => (
              <Post 
                key={post.id} 
                post={post} 
                onClick={() => setSelectedPost(post)}
                showChannelHash={false}
              />
            ))}
          </AnimatePresence>

          {hasMore && (
            <div className="text-center mt-4">
              <Button
                onClick={loadMorePosts}
                disabled={loadingMore}
                className="bg-green-50 text-green-600 hover:bg-green-100"
              >
                {loadingMore ? 'Loading...' : 'Load More Posts'}
              </Button>
            </div>
          )}
        </div>
        <ChannelSidebar channelData={channelData} />
      </div>

      <AnimatePresence>
        {selectedPost && (
          <FullPostModal
            post={selectedPost}
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onCreatePost={handleCreatePost}
      />

      <motion.div 
        className={`fixed bottom-8 right-8 transition-all duration-300 ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        initial={{ y: 100 }}
        animate={{ y: scrolled ? 0 : 100 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 p-3"
        >
          <ChevronDown className="h-6 w-6 transform rotate-180" />
        </Button>
      </motion.div>
    </div>
  );
}
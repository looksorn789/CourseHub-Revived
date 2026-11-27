import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Compass, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Post } from "../components/posts/Post";
import { FullPostModal } from "../components/posts/FullPostModal";
import { applyPostImageChanges } from "../components/posts/PostImages";
import PostService from "../services/postService";
import { getUserProfile } from "../services/profileService";
import { transformPost } from "../utils/postTransform";

const PER_PAGE = 20;

function EmptyFeed() {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-16 text-center sm:py-24">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
        <Compass className="h-7 w-7 text-green-700" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Your feed is empty</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
        Join a channel or add friends, and their posts will show up here.
      </p>
      <button
        type="button"
        onClick={() => navigate("/explore")}
        className="mt-6 inline-flex items-center rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        Explore channels
      </button>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading your feed">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
          <div className="mb-2 h-5 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/** Home feed: posts from joined channels, friends, and the user's own posts. */
export function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const loadPage = useCallback(async (pageNumber) => {
    const res = await PostService.getFeed(pageNumber, PER_PAGE);
    const data = res.data || {};
    const transformed = await Promise.all((data.posts || []).map((p) => transformPost(p)));
    return { posts: transformed, hasMore: (data.page || 1) < (data.total_pages || 1) };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUserProfile().then(({ data }) => {
      if (!cancelled && data?._id) setCurrentUserId(data._id);
    });
    loadPage(1)
      .then((result) => {
        if (cancelled) return;
        setPosts(result.posts);
        setHasMore(result.hasMore);
      })
      .catch((err) => !cancelled && setError(err.message || "Couldn't load your feed."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const result = await loadPage(next);
      setPosts((prev) => [...prev, ...result.posts.filter((p) => !prev.some((q) => q.id === p.id))]);
      setHasMore(result.hasMore);
      setPage(next);
    } catch (err) {
      toast.error(err.message || "Couldn't load more posts.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleEditPost = async (postId, updatedData) => {
    const response = await PostService.updatePost(postId, updatedData);
    if (!response.success) throw new Error(response.details || "Failed to update post");
    const updated = response.data;
    const { images, errors } = await applyPostImageChanges(postId, updatedData.imageChanges);
    if (images) updated.images = images;
    errors.forEach((msg) => toast.error(`Photo change failed: ${msg}`));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updatedFields(updated), images: updated.images || p.images } : p)),
    );
  };

  const handleDeletePost = async (postId) => {
    const response = await PostService.deletePost(postId);
    if (!response.success) throw new Error(response.error || "Failed to delete post");
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted");
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:py-8">
        <FeedSkeleton />
      </div>
    );
  }
  if (error) {
    return <p className="px-4 py-16 text-center text-sm text-red-600">{error}</p>;
  }
  if (!posts.length) return <EmptyFeed />;

  return (
    <div className="w-full px-4 py-6 sm:py-8">
      <AnimatePresence>
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onClick={() => setSelectedPost(post)}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            currentUserId={currentUserId}
          />
        ))}
      </AnimatePresence>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center rounded-full bg-green-50 px-5 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more posts
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedPost && (
          <FullPostModal
            post={selectedPost}
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
            currentUserId={currentUserId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Fields an edit can change (author/forum info stays as loaded).
function updatedFields(post) {
  return {
    title: post.title,
    content: post.content,
    tags: post.tags || [],
    type: post.type,
  };
}

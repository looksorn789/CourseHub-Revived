import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Post } from "./Post";
import { FullPostModal } from "./FullPostModal";
import { applyPostImageChanges } from "./PostImages";
import PostService from "../../services/postService";
import { getUserProfile } from "../../services/profileService";
import { transformPost } from "../../utils/postTransform";

const PER_PAGE = 20;
export { PER_PAGE };

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

/**
 * A paginated list of post cards with the full post view, edit/delete for
 * the author and "Load more". `loadPage(page)` returns the API's
 * { posts, page, total_pages }.
 */
export default function PostStream({ loadPage: fetchPage, empty = null, header = null, onTotal }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  // ?post=<id> (shared links) opens that post once the list has loaded.
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedPostId = searchParams.get("post");

  const loadPage = useCallback(async (pageNumber) => {
    const data = (await fetchPage(pageNumber)) || {};
    onTotal?.(data.total || 0);
    const transformed = await Promise.all((data.posts || []).map((p) => transformPost(p)));
    return { posts: transformed, hasMore: (data.page || 1) < (data.total_pages || 1) };
  }, [fetchPage, onTotal]);

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
        setPage(1);
      })
      .catch((err) => !cancelled && setError(err.message || "Couldn't load your feed."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  useEffect(() => {
    if (!linkedPostId || loading) return undefined;
    let cancelled = false;
    (async () => {
      let post = posts.find((p) => p.id === linkedPostId);
      if (!post) {
        try {
          const res = await PostService.getPost(linkedPostId);
          if (res?.data) post = await transformPost(res.data);
        } catch {
          toast.error("That post is no longer available.");
        }
      }
      if (cancelled) return;
      if (post) setSelectedPost(post);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("post");
        return next;
      }, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [linkedPostId, loading, posts, setSearchParams]);

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
        {header}
        <FeedSkeleton />
      </div>
    );
  }
  if (error) {
    return <p className="px-4 py-16 text-center text-sm text-red-600">{error}</p>;
  }
  if (!posts.length) {
    return (
      <div className="w-full px-4 py-6 sm:py-8">
        {header}
        {empty}
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:py-8">
      {header}
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

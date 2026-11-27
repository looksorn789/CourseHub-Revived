import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import PostStream, { PER_PAGE } from "../components/posts/PostStream";
import PostService from "../services/postService";

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

/** Home feed: posts from joined channels, friends, and the user's own posts. */
export function Feed() {
  const loadPage = useCallback(
    async (page) => (await PostService.getFeed(page, PER_PAGE)).data,
    [],
  );
  return <PostStream loadPage={loadPage} empty={<EmptyFeed />} />;
}

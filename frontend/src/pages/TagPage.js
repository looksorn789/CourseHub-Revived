import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { Hash } from "lucide-react";
import { MainLayout } from "../components/layout/MainLayout";
import PostStream, { PER_PAGE } from "../components/posts/PostStream";
import PostService from "../services/postService";

/** /tags/:tag - every post (you can see) with this tag. */
function TagPage() {
  const { tag } = useParams();
  const [total, setTotal] = useState(null);
  const loadPage = useCallback(
    async (page) => (await PostService.getTagPosts(tag, page, PER_PAGE)).data,
    [tag],
  );

  const header = (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Hash className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
        <p className="text-sm text-gray-500">
          {total === null ? "Loading posts…" : `${total} post${total === 1 ? "" : "s"} tagged #${tag}`}
        </p>
      </div>
    </div>
  );

  return (
    <MainLayout>
      {/* key: start fresh when the tag changes */}
      <PostStream
        key={tag}
        loadPage={loadPage}
        onTotal={setTotal}
        header={header}
        empty={
          <p className="rounded-2xl border border-dashed border-green-200 bg-green-50/50 px-6 py-10 text-center text-sm text-gray-500">
            No posts with #{tag} yet.
          </p>
        }
      />
    </MainLayout>
  );
}

export default TagPage;

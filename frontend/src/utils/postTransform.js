import { getUserById } from "../services/profileService";
import { avatarDataUrl } from "./avatarUtils";

const anonymousAvatar = avatarDataUrl(null, "anonymous");

function authorFrom(user, post, channelName) {
  if (!user) {
    return {
      name: "Anonymous",
      image: anonymousAvatar,
      username: "anonymous",
      channel: channelName,
      id: post.user_id,
    };
  }
  const first = user.profile?.first_name || "";
  const last = user.profile?.last_name || "";
  return {
    name: `${first} ${last}`.trim() || user.username || "Anonymous",
    image: avatarDataUrl(user.profile?.avatar_config, user.username),
    username: user.username || "anonymous",
    channel: channelName,
    id: post.user_id,
  };
}

/** Link to a post's channel (prefers the real slug over one guessed from the name). */
export function channelPathFor(post) {
  const slug =
    post.forumSlug ||
    (post.author?.channel || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return slug ? `/channel/${slug}` : null;
}

/**
 * API post -> shape used by <Post> / <FullPostModal>.
 * Uses the author (and forum) the API embeds in the post; only falls back to
 * fetching the author when it's missing (e.g. a freshly created post).
 */
export async function transformPost(post, channelName, channelSlug) {
  const forumName = channelName || post.forum?.name || "Unknown Channel";
  let user = post.author;
  if (!user && post.user_id) {
    try {
      const { data } = await getUserById(post.user_id);
      user = data || null;
    } catch {
      user = null;
    }
  }
  return {
    // The create endpoint returns "id"; list/update return "_id".
    id: post._id || post.id,
    userId: post.user_id,
    images: post.images || [],
    title: post.title || "Untitled Post",
    content: post.content || "",
    tags: post.tags || [],
    timestamp: new Date(post.created_at || Date.now()),
    likes: 0,
    comments: [],
    type: post.type || "discussion",
    metadata: post.metadata || {},
    view_count: post.view_count || 0,
    forumSlug: channelSlug || post.forum?.slug,
    author: authorFrom(user, post, forumName),
  };
}

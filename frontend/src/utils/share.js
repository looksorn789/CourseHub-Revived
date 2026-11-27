/**
 * Links and default text for sharing a post.
 * - From a profile page: /profile/<author>?post=<id>
 * - Everywhere else:     /channel/<channel>?post=<id>
 * Both pages open the post on load.
 */
export function postShareUrl(post, pathname = window.location.pathname) {
  const origin = window.location.origin;
  const id = encodeURIComponent(post.id);
  if (pathname.startsWith("/profile/") && post.author?.username) {
    return `${origin}/profile/${encodeURIComponent(post.author.username)}?post=${id}`;
  }
  if (post.forumSlug) return `${origin}/channel/${encodeURIComponent(post.forumSlug)}?post=${id}`;
  return `${origin}/home`;
}

export function defaultShareMessage(post, url) {
  const where = post.author?.channel ? ` in ${post.author.channel}` : "";
  return `Check out "${post.title}"${where} on CourseHub:\n${url}`;
}

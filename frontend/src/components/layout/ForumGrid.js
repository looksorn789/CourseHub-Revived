import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Check, Crown, Loader2, Plus, Users } from "lucide-react";
import { forumService } from "../../services/forumService";
import {
  DEFAULT_CHANNEL_BANNER,
  DEFAULT_CHANNEL_ICON,
} from "../channel/ChannelImagePicker";

function ForumCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="h-32 bg-gray-200" />
      <div className="space-y-2 p-4 pt-8">
        <div className="h-5 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

/** Explore: every public channel as a clickable card with join/leave. */
function ForumGrid() {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const fetchForums = async () => {
      const { data, error: fetchError } = await forumService.getAllForums();
      if (fetchError) setError(fetchError);
      else setForums(data.forums || []);
      setLoading(false);
    };
    fetchForums();
  }, []);

  const toggleMembership = async (e, forum) => {
    // The button sits inside the card link: don't navigate.
    e.preventDefault();
    e.stopPropagation();
    setBusyId(forum._id);
    const leaving = forum.is_member;
    const { error: actionError } = leaving
      ? await forumService.leaveForum(forum._id)
      : await forumService.joinForum(forum._id);
    setBusyId(null);
    if (actionError) {
      toast.error(actionError);
      return;
    }
    setForums((prev) =>
      prev.map((f) =>
        f._id === forum._id
          ? {
              ...f,
              is_member: !leaving,
              member_count: Math.max(0, (f.member_count || 0) + (leaving ? -1 : 1)),
            }
          : f,
      ),
    );
    toast.success(leaving ? `You left ${forum.name}` : `Welcome to ${forum.name}!`);
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <ForumCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="px-4 py-16 text-center text-sm text-red-600">Couldn't load channels: {error}</p>;
  }

  if (!forums.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-800">No channels yet</p>
        <p className="mt-2 text-sm text-gray-500">
          Be the first to start one with "Create Channel" in the menu.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-2">
      {forums.map((forum) => (
        <Link
          key={forum._id}
          to={`/channel/${forum.slug}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <div className="relative h-32 bg-green-100">
            <img
              src={forum.banner_url || DEFAULT_CHANNEL_BANNER}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <img
              src={forum.avatar_url || DEFAULT_CHANNEL_ICON}
              alt=""
              loading="lazy"
              className="absolute -bottom-6 left-4 h-14 w-14 rounded-full border-4 border-white bg-white object-cover shadow"
            />
          </div>

          <div className="flex flex-1 flex-col p-4 pt-8">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700">{forum.name}</h3>
              {forum.is_owner && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              )}
            </div>
            {forum.category && <p className="text-xs text-green-700">{forum.category}</p>}
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{forum.description}</p>

            {forum.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {forum.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                {forum.member_count || 0} member{forum.member_count === 1 ? "" : "s"}
              </span>
              {!forum.is_owner && (
                <button
                  type="button"
                  disabled={busyId === forum._id}
                  onClick={(e) => toggleMembership(e, forum)}
                  className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
                    forum.is_member
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {busyId === forum._id ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : forum.is_member ? (
                    <Check className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Plus className="mr-1.5 h-4 w-4" />
                  )}
                  {forum.is_member ? "Joined" : "Join"}
                </button>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default ForumGrid;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Hash, Loader2, Pin, TrendingUp, X } from "lucide-react";
import { forumService, FORUMS_CHANGED_EVENT } from "../../services/forumService";
import Button from "../ui/Button";
import { Card } from "../ui/Card";
import Badge from "../ui/Badge";

const popularTags = [
  "react",
  "javascript",
  "python",
  "machinelearning",
  "webdev",
  "css",
  "html",
  "nodejs",
  "design",
  "programming",
];

function ChannelIcon({ channel, className = "h-9 w-9" }) {
  return channel.avatar_url ? (
    <img src={channel.avatar_url} alt="" className={`${className} shrink-0 rounded-lg object-cover`} />
  ) : (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-green-700`}>
      {channel.name?.[0]?.toUpperCase() || "#"}
    </span>
  );
}

function RightSidebar() {
  const navigate = useNavigate();
  const [suggested, setSuggested] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [joining, setJoining] = useState(null);

  // Real data; refreshes when the user joins/leaves/pins/creates a channel.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [s, p] = await Promise.all([forumService.getSuggestedForums(5), forumService.getPinnedForums()]);
      if (!cancelled) {
        setSuggested(s.data);
        setPinned(p.data);
      }
    };
    load();
    window.addEventListener(FORUMS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(FORUMS_CHANGED_EVENT, load);
    };
  }, []);

  const join = async (channel) => {
    setJoining(channel._id);
    const { error } = await forumService.joinForum(channel._id);
    setJoining(null);
    if (error) toast.error(error);
    else toast.success(`Welcome to ${channel.name}!`);
  };

  const unpin = async (channel) => {
    setPinned((prev) => prev.filter((c) => c._id !== channel._id));
    const { error } = await forumService.setPinned(channel._id, false);
    if (error) toast.error(error);
  };

  return (
    <div className="w-full border-l border-gray-200 p-4 space-y-6">
      {/* Suggested Channels (popular ones you haven't joined) */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-md">
        <div className="p-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Suggested Channels</h2>
        </div>
        <div className="p-4 pt-0">
          {suggested === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-white/70" />
              ))}
            </div>
          ) : suggested.length === 0 ? (
            <p className="text-sm text-gray-500">You've joined every channel. Nice!</p>
          ) : (
            <ul className="space-y-3">
              {suggested.map((channel) => (
                <li key={channel._id} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/channel/${channel.slug}`)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <ChannelIcon channel={channel} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800 hover:text-green-700">
                        {channel.name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {(channel.member_count || 0).toLocaleString()} member{channel.member_count === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="outline"
                    disabled={joining === channel._id}
                    onClick={() => join(channel)}
                    className="h-8 shrink-0 bg-white px-3 text-xs hover:bg-green-50 hover:text-green-600"
                  >
                    {joining === channel._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Pinned Channels */}
      <Card>
        <div className="p-4 pb-2">
          <h2 className="text-sm font-medium flex items-center text-gray-700">
            <Pin className="w-4 h-4 mr-2" />
            Pinned Channels
          </h2>
        </div>
        <div className="p-4 pt-0">
          {pinned === null ? (
            <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
          ) : pinned.length === 0 ? (
            <p className="text-sm text-gray-500">
              Pin a channel from its page and it will show up here.
            </p>
          ) : (
            <ul className="flex flex-col space-y-1">
              {pinned.map((channel) => (
                <li key={channel._id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/channel/${channel.slug}`)}
                    className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left hover:bg-gray-100"
                  >
                    <ChannelIcon channel={channel} className="h-6 w-6" />
                    <span className="truncate text-sm font-medium">{channel.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => unpin(channel)}
                    aria-label={`Unpin ${channel.name}`}
                    className="rounded p-1.5 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-700 focus:opacity-100 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Popular Tags */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md">
        <div className="p-4 pb-2">
          <h2 className="text-sm font-medium flex items-center text-gray-800">
            <TrendingUp className="w-4 h-4 mr-2" />
            Popular Tags
          </h2>
        </div>
        <div className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-white hover:bg-gray-100 text-gray-800 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
              >
                <Hash className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RightSidebar;
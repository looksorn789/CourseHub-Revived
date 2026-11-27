import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  ChevronDown,
  Compass,
  Loader2,
} from "lucide-react";
import Button from "../ui/Button";
import { cn } from "../../lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/Collapsible";
import { Separator } from "../ui/Separator";
import { CreateChannelModal } from "../channel/CreateChannelModal";
import { forumService, FORUMS_CHANGED_EVENT } from "../../services/forumService";

const navItems = [
  { name: "Home", icon: Home, path: "/home" },
  { name: "Explore", icon: TrendingUp, path: "/explore" },
  { name: "Friends", icon: Users, path: "/friends" },
];

/**
 * Main navigation. Rendered as the desktop left column by MainLayout and
 * inside the mobile menu sheet by Header (which passes onNavigate to close it).
 */
function Sidebar({ onNavigate, className }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [myChannels, setMyChannels] = useState([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await forumService.getMyForums();
      if (!cancelled) {
        setMyChannels(data);
        setIsLoadingChannels(false);
      }
    };
    load();
    window.addEventListener(FORUMS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(FORUMS_CHANGED_EVENT, load);
    };
  }, []);

  const go = (path) => {
    navigate(path);
    onNavigate?.();
  };

  const itemClass = (active) =>
    cn(
      "w-full justify-start",
      active ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100",
    );

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Button
                variant="ghost"
                className={itemClass(location.pathname === item.path)}
                onClick={() => go(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </li>
          ))}
        </ul>

        {/* My Channels */}
        <Separator className="my-4" />
        <Collapsible open={isChannelsOpen} onOpenChange={setIsChannelsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-full justify-between px-4 font-medium text-gray-700 hover:bg-gray-100"
            >
              <span className="text-sm">My Channels</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-500 transition-transform duration-300",
                  isChannelsOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-2 py-2">
              <CreateChannelModal />
            </div>

            {isLoadingChannels ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : myChannels.length === 0 ? (
              <div className="mx-2 rounded-lg border border-dashed border-green-200 bg-green-50/50 px-3 py-4 text-center">
                <p className="text-sm text-gray-600">
                  You haven't joined any channels yet.
                </p>
                <Button
                  variant="ghost"
                  className="mt-2 h-8 text-sm text-green-700 hover:bg-green-100"
                  onClick={() => go("/explore")}
                >
                  <Compass className="mr-1.5 h-4 w-4" />
                  Explore channels
                </Button>
              </div>
            ) : (
              <ul className="space-y-1">
                {myChannels.map((channel) => {
                  const path = `/channel/${channel.slug}`;
                  return (
                    <li key={channel._id}>
                      <Button
                        variant="ghost"
                        className={cn(itemClass(location.pathname === path), "h-10 px-4")}
                        onClick={() => go(path)}
                      >
                        {channel.avatar_url ? (
                          <img
                            src={channel.avatar_url}
                            alt=""
                            className="mr-3 h-6 w-6 rounded-md object-cover"
                          />
                        ) : (
                          <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-100 text-xs font-semibold text-green-700">
                            {channel.name?.[0]?.toUpperCase() || "#"}
                          </span>
                        )}
                        <span className="truncate text-sm">{channel.name}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* Settings Section */}
      <div className="px-4 pb-4">
        <Separator className="mb-4" />
        <ul className="space-y-1">
          <li>
            <Button
              variant="ghost"
              className={itemClass(location.pathname === "/settings")}
              onClick={() => go("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Help Center
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;

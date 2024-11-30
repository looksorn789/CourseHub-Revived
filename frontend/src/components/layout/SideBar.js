import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Users,
  Bookmark,
  Settings,
  HelpCircle,
  ChevronDown,
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

const channels = [
  { name: "Web Development", icon: "💻" },
  { name: "Data Science", icon: "📊" },
  { name: "Machine Learning", icon: "🤖" },
  { name: "UI/UX Design", icon: "🎨" },
  { name: "Mobile Development", icon: "📱" },
  { name: "DevOps", icon: "🛠️" },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState("auto");

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(isChannelsOpen ? `${height}px` : "0px");
    }
  }, [isChannelsOpen]);

  const navItems = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "Explore", icon: TrendingUp, path: "/explore" },
    { name: "Friends", icon: Users, path: "/friends" },
  ];

  return (
    <div className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    location.pathname === item.path
                      ? "bg-green-100 text-green-800"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </li>
            ))}
          </ul>

          {/* Channels Section */}
          <div className="mt-6">
            <Separator className="my-4" />
            <div className="flex flex-col">
              <Collapsible
                open={isChannelsOpen}
                onOpenChange={setIsChannelsOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 h-10 text-gray-700 hover:bg-gray-100 font-medium transition-all duration-300 ease-in-out"
                  >
                    <span className="text-sm">My Channels</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-gray-500 transition-transform duration-300 ease-in-out",
                        isChannelsOpen ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div
                    ref={contentRef}
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                  >
                    <div className="transform transition-all duration-300 ease-in-out">
                      <div className="px-2 py-2">
                        <CreateChannelModal />
                      </div>
                      <div className="space-y-1">
                        {channels.map((channel, index) => (
                          <Button
                            key={`${channel.name}-${index}`}
                            variant="ghost"
                            className="w-full justify-start h-10 px-6 text-gray-700 hover:bg-gray-100 transition-all duration-300 ease-in-out"
                            style={{
                              opacity: isChannelsOpen ? 1 : 0,
                              transform: `translateY(${isChannelsOpen ? 0 : -10}px)`,
                              transitionDelay: `${index * 30}ms`,
                            }}
                          >
                            <span className="mr-3 text-lg">{channel.icon}</span>
                            <span className="text-sm">{channel.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </nav>
      </div>

      {/* Settings Section */}
      <div className="mt-auto">
        <div className="px-4 py-4">
          <Separator className="my-4" />
          <ul className="space-y-1">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-100"
                onClick={() => navigate("/settings")}
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
    </div>
  );
}

export default Sidebar;

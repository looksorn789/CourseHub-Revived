import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const savedPosts = [
  { name: "How to train ML model" },
  { name: "What is the correct way to solve Q4?" },
  { name: "Understanding UI/UX Principles" },
];

function Sidebar() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("Home");
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isSavedPostsOpen, setIsSavedPostsOpen] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState("auto");

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(isChannelsOpen ? `${height}px` : "0px");
    }
  }, [isChannelsOpen]);

  const handleNavigation = (itemName) => {
    setActiveItem(itemName);
    if (itemName === "Home") {
      navigate("/home");
    }
  };

  return (
    <div className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {[
              { name: "Home", icon: Home },
              { name: "Explore", icon: TrendingUp },
              { name: "Friends", icon: Users },
            ].map((item) => (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeItem === item.name
                      ? "bg-green-100 text-green-800"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => {
                    setActiveItem(item.name);
                    if (item.name === "Explore") {
                      navigate("/explore");
                    }
                    else if(item.name === "Home"){
                      navigate("/home")
                    }
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </li>
            ))}
          </ul>

          {/* Saved Posts Section */}
          <div className="mt-6">
            <Separator className="my-4" />
            <div className="flex flex-col">
              <Collapsible
                open={isSavedPostsOpen}
                onOpenChange={setIsSavedPostsOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-4 h-10 text-gray-700 hover:bg-gray-100 font-medium"
                  >
                    <span className="text-sm">Saved Posts</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-gray-500 transition-transform",
                        isSavedPostsOpen ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="overflow-hidden">
                    <div className="space-y-1">
                      {savedPosts.map((post, index) => (
                        <Button
                          key={post.name}
                          variant="ghost"
                          className="w-full justify-start h-10 px-6 text-gray-700 hover:bg-gray-100"
                          style={{
                            opacity: isSavedPostsOpen ? 1 : 0,
                            transform: `translateY(${isSavedPostsOpen ? 0 : -10}px)`,
                            transitionDelay: `${index * 30}ms`,
                          }}
                        >
                          <span className="text-sm">{post.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

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
                      {/* Create Channel Button */}
                      <div className="px-2 py-2">
                        <CreateChannelModal />
                      </div>
                      {/* Channel List */}
                      <div className="space-y-1">
                        {/* {channels.map((channel, index) => (
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
                        ))} */}
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
        <div
          className={cn(
            "px-4 py-4 transition-all duration-300 ease-in-out",
            isChannelsOpen ? "translate-y-0" : "translate-y-0"
          )}
        >
          <Separator className="my-4" />
          <ul className="space-y-1">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-100"
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
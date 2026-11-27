import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  MessageSquare,
  Bell,
  Moon,
  User,
  Menu,
  LogOut,
} from "lucide-react";
import Button from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/DropdownMenu";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/Sheet";
import Sidebar from "./SideBar";
import SearchBar from "./SearchBar";
import ChatPanel from "../chat/ChatPanel";
import ChatService, {
  getChatSocket,
  disconnectChatSocket,
  OPEN_CHAT_EVENT,
} from "../../services/chatService";
import { getUserProfile } from "../../services/profileService";
import { generateAvatarSvg } from "../../utils/avatarUtils";

function Header() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatStartWith, setChatStartWith] = useState(null);
  const [conversations, setConversations] = useState(null);
  const unreadMessages = (conversations || []).reduce((n, c) => n + (c.unread || 0), 0);

  const refreshConversations = useCallback(async () => {
    const { data } = await ChatService.listConversations();
    if (data) setConversations(data.conversations);
  }, []);

  // Live unread count: refetch when the server says a conversation changed.
  useEffect(() => {
    if (!localStorage.getItem("jwt_token")) return undefined;
    refreshConversations();
    const socket = getChatSocket();
    let timer;
    const onUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(refreshConversations, 300);
    };
    socket?.on("conversation_updated", onUpdate);
    socket?.on("connect", onUpdate);
    const onOpenChat = (e) => {
      setIsChatOpen(true);
      if (e.detail?.userId) setChatStartWith(e.detail.userId);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpenChat);
    return () => {
      clearTimeout(timer);
      socket?.off("conversation_updated", onUpdate);
      socket?.off("connect", onUpdate);
      window.removeEventListener(OPEN_CHAT_EVENT, onOpenChat);
    };
  }, [refreshConversations]);
  const [user, setUser] = useState({
    name: "",
    username: "",
    avatarUrl: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
          navigate("/signin");
          return;
        }

        const { data, error } = await getUserProfile();
        if (data && data.profile) {
          const { first_name, last_name, avatar_config } = data.profile;
          const fullName = `${first_name} ${last_name}`;
          const username = data.username;
          let avatarUrl = "";

          if (avatar_config) {
            const { style, seed, options } = avatar_config;
            const svg = generateAvatarSvg(style, seed, options);
            avatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          }

          setUser({
            name: fullName,
            username: username,
            avatarUrl: avatarUrl,
          });
        } else if (error) {
          console.error("Failed to fetch user data:", error);
          if (error.status === 401) {
            navigate("/signin");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/signin");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      disconnectChatSocket();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const ProfileContent = ({ inMenu = false }) => (
    <div
      className={`flex ${inMenu ? "flex-row items-center" : "flex-col items-center"} ${!inMenu && "space-y-2"} mb-4`}
    >
      <Avatar className={inMenu ? "h-10 w-10 mr-3" : "h-16 w-16"}>
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={`${user.name}'s Avatar`} />
        ) : (
          <AvatarFallback>
            {user.name ? user.name.charAt(0) : "U"}
          </AvatarFallback>
        )}
      </Avatar>
      <div className={inMenu ? "" : "text-center"}>
        <p className="font-semibold text-base">{user.name || "User"}</p>
        <p className="text-sm text-gray-500">{user.username || "No Email"}</p>
      </div>
    </div>
  );


  return (
    <header className="sticky top-0 z-10 bg-white border-b border-green-100">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/home" className="flex items-center space-x-2">
            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-green-600">CourseHub</h1>
          </Link>
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <SearchBar onNavigate={() => setIsMenuOpen(false)} />
          </div>
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label={unreadMessages ? `Messages, ${unreadMessages} unread` : "Messages"}
              onClick={() => setIsChatOpen((o) => !o)}
              className={`relative flex text-green-600 hover:bg-green-100 transition-colors duration-200 h-10 w-10 p-2 ${isChatOpen ? "bg-green-100" : ""}`}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-green-600 hover:bg-green-100 transition-colors duration-200 h-10 w-10 p-2"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-1 hidden sm:flex items-center space-x-2"
                >
                  <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-110">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt="User Avatar" />
                    ) : (
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0) : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-4">
                <ProfileContent />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  >
                  View Profile
                </Button>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-green-50 rounded-md transition-colors duration-200"
                onClick={() => navigate("/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-green-50 rounded-md transition-colors duration-200">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer py-2 hover:bg-red-50 rounded-md transition-colors duration-200"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="lg:hidden text-green-600 hover:bg-green-100 transition-colors duration-200"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[85vw] max-w-xs flex-col gap-0 overflow-y-auto p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="border-b border-gray-100 px-4 pb-4 pt-6">
                  <ProfileContent inMenu={true} />
                  <SearchBar onNavigate={() => setIsMenuOpen(false)} />
                </div>
                <Sidebar
                  className="h-auto flex-1"
                  onNavigate={() => setIsMenuOpen(false)}
                />
                <div className="border-t border-gray-100 p-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-100 transition-colors duration-200"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <ChatPanel
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conversations={conversations}
        refresh={refreshConversations}
        startWith={chatStartWith}
        onStartHandled={() => setChatStartWith(null)}
      />
    </header>
  );
}

export default Header;

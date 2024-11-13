import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  MessageSquare,
  Bell,
  Moon,
  User,
  Menu,
  Home,
  TrendingUp,
  Users,
  Bookmark,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
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
  SheetClose,
} from "../ui/Sheet";
import { Separator } from "../ui/Separator";
import { getUserProfile } from "../../services/profileService";
import { generateAvatarSvg } from "../../utils/avatarUtils";

function Header() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const navigationItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Popular", icon: TrendingUp, path: "/popular" },
    { name: "Friends", icon: Users, path: "/friends" },
    { name: "Bookmarks", icon: Bookmark, path: "/bookmarks" },
    { name: "Messages", icon: MessageSquare, path: "/messages" },
    { name: "Notifications", icon: Bell, path: "/notifications" },
  ];

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-green-100">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/home" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-600">CourseHub</h1>
          </Link>
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search CourseHub"
                className="pl-10 w-full rounded-full bg-gray-100 border-transparent focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-green-600 hover:bg-green-100 transition-colors duration-200 h-10 w-10 p-2"
            >
              <MessageSquare className="h-5 w-5" />
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
                  className="p-1 hidden md:flex items-center space-x-2"
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
                  onClick={() => navigate("/profile")}
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
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-green-600 hover:bg-green-100 transition-colors duration-200"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-4">
                  <ProfileContent inMenu={true} />
                  <Separator />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search CourseHub"
                      className="pl-10 w-full rounded-full bg-gray-100 border-transparent focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <nav className="flex flex-col space-y-1">
                    {navigationItems.map((item) => (
                      <SheetClose asChild key={item.name}>
                        <Link to={item.path}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-green-600 hover:bg-green-100 transition-colors duration-200"
                          >
                            <item.icon className="mr-2 h-5 w-5" />
                            {item.name}
                          </Button>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Help Center
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="justify-start text-red-600 hover:bg-red-100 transition-colors duration-200"
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
    </header>
  );
}

export default Header;

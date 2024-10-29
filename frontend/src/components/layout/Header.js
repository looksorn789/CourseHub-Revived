import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Search, MessageSquare, Bell, Moon, User, Menu, Home, TrendingUp, Users, Bookmark, Settings, HelpCircle, LogOut } from 'lucide-react'
import Button from "../ui/Button";
import Input from "../ui/Input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
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

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const defaultItemHoverClasses =
    "hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
        localStorage.removeItem("jwt_token");  
        localStorage.removeItem("user");
        navigate("/signin");
  };
    const [isDarkMode, setIsDarkMode] = useState(false)

  const ProfileContent = ({ inMenu = false }) => (
    <div className={`flex ${inMenu ? 'flex-row items-center' : 'flex-col items-center'} space-y-2 mb-4`}>
      <Avatar className={inMenu ? "h-10 w-10 mr-3" : "h-16 w-16"}>
        <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Elias Woldie" />
        <AvatarFallback>EW</AvatarFallback>
      </Avatar>
      <div className={inMenu ? "" : "text-center"}>
        <p className="font-semibold text-base">Elias Woldie</p>
        <p className="text-sm text-gray-500">elias@gmail.com</p>
      </div>
    </div>
  )
    return (
      <header className="sticky top-0 z-10 bg-white border-b border-green-100">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-600">CourseHub</h1>
          </Link>
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="mx-auto absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search CourseHub" className="pl-10 w-full rounded-full bg-gray-100 border-transparent focus:border-green-500 focus:ring-green-500" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden sm:flex text-green-600 hover:bg-green-100 transition-colors duration-200 h-10 w-10 p-2">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex text-green-600 hover:bg-green-100 transition-colors duration-200 h-10 w-10 p-2">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 hidden md:flex items-center space-x-2">
                  <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-110">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Elias Woldie" />
                    <AvatarFallback>EW</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-4">
                <ProfileContent />
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Profile
                </Button>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-green-50 rounded-md transition-colors duration-200">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2 px-3 hover:bg-green-50 rounded-md transition-colors duration-200">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </div>
                    {/* <Switch
                      checked={isDarkMode}
                      onCheckedChange={setIsDarkMode}
                    /> */}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-2 hover:bg-red-50 rounded-md transition-colors duration-200">
                  <div className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-green-600 hover:bg-green-100 transition-colors duration-200">
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
                    <Input placeholder="Search CourseHub" className="pl-10 w-full rounded-full bg-gray-100 border-transparent focus:border-green-500 focus:ring-green-500" />
                  </div>
                  <nav className="flex flex-col space-y-1">
                    {[
                      { name: 'Home', icon: Home },
                      { name: 'Popular', icon: TrendingUp },
                      { name: 'Friends', icon: Users },
                      { name: 'Bookmarks', icon: Bookmark },
                      { name: 'Messages', icon: MessageSquare },
                      { name: 'Notifications', icon: Bell },
                    ].map((item) => (
                      <SheetClose asChild key={item.name}>
                        <Button variant="ghost" className="justify-start text-green-600 hover:bg-green-100 transition-colors duration-200">
                          <item.icon className="mr-2 h-5 w-5" />
                          {item.name}
                        </Button>
                      </SheetClose>
                    ))}
                  </nav>
                  <Separator />
                  <Button variant="ghost" className="justify-start text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <User className="mr-2 h-5 w-5" />
                    Account
                  </Button>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                    <div className="flex items-center text-gray-600">
                      <Moon className="mr-2 h-5 w-5" />
                      Dark Mode
                    </div>
                    {/* <Switch
                      checked={isDarkMode}
                      onCheckedChange={setIsDarkMode}
                    /> */}
                  </div>
                  <Button variant="ghost" className="justify-start text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="justify-start text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Help Center
                  </Button>
                  <Separator />
                  <Button variant="ghost" className="justify-start text-red-600 hover:bg-red-100 transition-colors duration-200">
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
  )
}

export default Header;

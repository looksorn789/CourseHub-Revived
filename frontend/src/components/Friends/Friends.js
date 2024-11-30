import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { searchUsers } from "../../services/profileService";
import Button from "../ui/Button"
import Input from "../ui/Input"
import Badge from "../ui/Badge"
import ScrollArea from "../ui/ScrollArea"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { Card, CardContent} from "../ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/Tooltip"
import { AnimatePresence, motion } from "framer-motion"
import { Users, Clock, Search, UserPlus, UserCheck, UserMinus, CheckCircle2, X } from 'lucide-react'


export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      const { data, error } = await searchUsers(searchQuery);
      setIsLoading(false);

      if (error) {
        setError(error);
        return;
      }

      const transformedUsers = data.map(user => ({
        id: user._id,
        name: `${user.profile.first_name} ${user.profile.last_name}`,
        username: user.username,
        avatar: `https://api.dicebear.com/6.x/${user.profile.avatar_config?.style || 'adventurer'}/svg?seed=${user.profile.avatar_config?.seed || user.username}`,
        profile: user.profile
      }));

      setSearchResults(transformedUsers);
    };

    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleProfileClick = (username) => {
    navigate(`/profile/${username}`);
  };

  const handleSendRequest = (user) => {
    setPendingRequests(prev => [...prev, user])
  }

  const handleCancelRequest = (userId) => {
    setPendingRequests(prev => prev.filter(user => user.id !== userId))
  }

  const handleAcceptRequest = (user) => {
    setFriends(prev => [...prev, user])
    setPendingRequests(prev => prev.filter(req => req.id !== user.id))
  }

  const handleUnfriend = (userId) => {
    setFriends(prev => prev.filter(friend => friend.id !== userId))
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
        <Card className="max-w-6xl mx-auto bg-white shadow-xl rounded-3xl overflow-hidden border-0">
          <CardContent className="p-0">
            <Tabs defaultValue="friends" className="w-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-800">Your Network</h1>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    {friends.length} Friends
                  </Badge>
                </div>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-2xl p-1 gap-1">
                  <TabsTrigger value="friends" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
                    <Users className="mr-2 h-4 w-4" />
                    Friends
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
                    <Clock className="mr-2 h-4 w-4" />
                    Requests
                  </TabsTrigger>
                  <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
                    <Search className="mr-2 h-4 w-4" />
                    Find Friends
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="friends" className="p-6">
                <ScrollArea className="h-[600px] rounded-md -mx-2 px-2">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {friends.map(friend => (
                        <motion.div
                          key={friend.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm cursor-pointer"
                        >
                          <div 
                            className="flex items-center gap-4 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => handleProfileClick(friend.username)}
                          >
                            <Avatar className="h-12 w-12 border-2 border-green-100 rounded-full">
                              <AvatarImage src={friend.avatar} alt={friend.name} />
                              <AvatarFallback>{friend.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-800">{friend.name}</p>
                              <p className="text-sm text-gray-500">@{friend.username}</p>
                              <p className="text-xs text-gray-400">{friend.profile?.school}</p>
                            </div>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnfriend(friend.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                              >
                                <UserMinus className="h-5 w-5" />
                                <span className="sr-only">Unfriend</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Unfriend</p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {friends.length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-xl font-semibold mb-2">No friends yet</p>
                        <p className="text-sm max-w-md mx-auto">Start by searching for friends in the "Find Friends" tab and connect with people you know.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="requests" className="p-6">
                <ScrollArea className="h-[600px] rounded-md -mx-2 px-2">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {pendingRequests.map(request => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm"
                        >
                        <div 
                            className="flex items-center gap-4 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => handleProfileClick(request.username)}
                        >
                            <Avatar className="h-12 w-12 border-2 border-yellow-100 rounded-full">
                              <AvatarImage src={request.avatar} alt={request.name} />
                              <AvatarFallback>{request.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-800">{request.name}</p>
                              <p className="text-sm text-gray-500">@{request.username}</p>
                              <p className="text-xs text-gray-400">{request.profile?.school}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleAcceptRequest(request)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors duration-200"
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="sr-only">Accept</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Accept Request</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCancelRequest(request.id)}
                                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                                >
                                  <X className="h-5 w-5" />
                                  <span className="sr-only">Decline</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Decline Request</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {pendingRequests.length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        <Clock className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-xl font-semibold mb-2">No pending requests</p>
                        <p className="text-sm max-w-md mx-auto">When someone sends you a friend request, it will appear here for you to accept or decline.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="search" className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search by name or username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full pl-10 focus:ring-green-500 focus:border-green-500 block transition-all duration-200 ease-in-out hover:bg-white focus:bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-[500px] rounded-xl border border-gray-200">
                  <div className="p-4 space-y-4">
                    {isLoading ? (
                      <div className="text-center py-10 text-gray-500">
                        <div className="animate-spin mx-auto h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mb-4" />
                        <p>Searching...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-10 text-gray-500">
                        <p className="text-red-500">{error}</p>
                      </div>
                    ) : searchResults.length === 0 && searchQuery ? (
                      <div className="text-center py-10 text-gray-500">
                        <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-xl font-semibold mb-2">No results found</p>
                        <p className="text-sm max-w-md mx-auto">Try adjusting your search terms or explore different keywords to find friends.</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {searchResults.map(user => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm"
                          >
                            <div 
                                className="flex items-center gap-4 cursor-pointer hover:opacity-75 transition-opacity"
                                onClick={() => handleProfileClick(user.username)}
                            >
                              <Avatar className="h-12 w-12 border-2 border-gray-200 rounded-full">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-gray-800">{user.name}</p>
                                <p className="text-sm text-gray-500">@{user.username}</p>
                                <p className="text-xs text-gray-400">{user.profile?.school}</p>
                              </div>
                            </div>
                            {friends.some(friend => friend.id === user.id) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 cursor-not-allowed rounded-full"
                                disabled
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Friends
                              </Button>
                            ) : pendingRequests.some(request => request.id === user.id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-full"
                                onClick={() => handleCancelRequest(user.id)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Pending
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                                onClick={() => handleSendRequest(user)}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Friend
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
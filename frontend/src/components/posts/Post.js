import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Bookmark,
  Hash,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { motion } from "framer-motion";
import Badge from "../ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

export function Post({ post, onClick, showChannelHash = true }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const getChannelSlug = (channelName) => {
    return channelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleChannelClick = (e) => {
    e.stopPropagation();
    const channelSlug =
      post.author.slug ||
      post.author.channelSlug ||
      getChannelSlug(post.author.channel);

    console.log("Channel data:", {
      authorSlug: post.author.slug,
      channelSlug: post.author.channelSlug,
      channelName: post.author.channel,
      generatedSlug: getChannelSlug(post.author.channel),
      finalSlug: channelSlug,
    });

    if (channelSlug) {
      navigate(`/channel/${channelSlug}`);
    } else {
      console.error("No valid channel slug found:", post.author);
    }
  };

  const toggleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const toggleSave = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className="mb-6 bg-gradient-to-br from-white to-green-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden border-none cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center space-x-4">
            <div className="p-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={post.author.image} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {post.author.name}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                {showChannelHash && <Hash className="h-3 w-3 mr-1" />}
                <button
                  onClick={handleChannelClick}
                  className="hover:text-green-600 transition-colors duration-200"
                >
                  {post.author.channel}
                </button>
                <span className="mx-1">•</span>
                <span>
                  {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full transition-colors duration-200 ${
                isSaved
                  ? "text-green-600 hover:text-green-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={toggleSave}
            >
              <Bookmark className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>Report</DropdownMenuItem>
                <DropdownMenuItem>Block user</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <p className={`text-gray-700 ${!isExpanded ? "line-clamp-3" : ""}`}>
            {post.content}
          </p>
          {post.content.length > 150 && (
            <Button
              variant="link"
              className="p-0 h-auto text-green-600 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? "See less" : "See more"}
            </Button>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch pt-2">
          <div className="flex justify-between items-center mb-3">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full transition-colors duration-200 ${
                isLiked
                  ? "text-green-600 hover:text-green-700"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={toggleLike}
            >
              <Heart className="mr-1 h-4 w-4" />
              <span>{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-gray-600 hover:text-green-600"
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              <span>{post.comments.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-gray-600 hover:text-green-600"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add a comment..."
              className="flex-grow bg-white border border-gray-200 text-sm rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="icon"
              className="rounded-full bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

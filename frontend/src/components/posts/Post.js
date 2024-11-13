import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  Hash,
  Edit,
  Flag,
  UserX,
} from "lucide-react";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import { Card, CardFooter, CardHeader } from "../ui/Card";
import Button from "../ui/Button";
import { motion } from "framer-motion";
import Badge from "../ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";
import { PostModal } from "./PostModal";

export function Post({ post, onClick, showChannelHash = true, onEdit, currentUserId }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isEditMode, setIsEditMode] = useState(false);
  const isAuthor = currentUserId === post.author.id;


  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditMode(true);
  };

  const handleEditComplete = async (updatedData) => {
    try {
      await onEdit(post.id, updatedData);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const getChannelSlug = (channelName) => {
    return channelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChannelClick = (e) => {
    e.stopPropagation();
    const channelSlug = post.author.slug || 
                       post.author.channelSlug || 
                       getChannelSlug(post.author.channel);

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
      className="w-full"
    >
      <Card 
        className="mb-6 bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border-none cursor-pointer"
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
              <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
              <div className="flex items-center text-xs text-gray-500">
                {showChannelHash && <Hash className="h-3 w-3 mr-1" />}
                <button
                  onClick={handleChannelClick}
                  className="hover:text-green-600 transition-colors duration-200"
                >
                  {post.author.channel}
                </button>
                <span className="mx-1">•</span>
                <span>{formatDistanceToNow(post.timestamp, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {isAuthor && (
                    <>
                      <DropdownMenuItem onClick={handleEdit}
                        className="flex items-center text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center text-gray-600 hover:text-gray-700"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        <div className="px-6 py-2">
          <h2 className="text-lg font-semibold text-gray-900 leading-tight mb-2 transition-colors duration-200 hover:text-green-600">
            {post.title}
          </h2>
          <p className={`text-sm text-gray-700 ${!isExpanded ? 'line-clamp-3' : ''}`}>
            {post.content}
          </p>
          {post.content.length > 150 && (
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-green-600 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? 'See less' : 'See more'}
            </Button>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <CardFooter className="flex justify-between items-center pt-2 px-6 pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 h-auto transition-colors duration-200 hover:text-green-600 ${
                isLiked ? 'text-green-600' : 'text-gray-600'
              }`}
              onClick={toggleLike}
            >
              <Heart className="mr-1 h-4 w-4" />
              <span className="text-xs">{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              <span className="text-xs">{post.comments.length}</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full transition-colors duration-200 hover:text-green-600 ${
                isSaved ? 'text-green-600' : 'text-gray-600'
              }`}
              onClick={toggleSave}
            >
              <Bookmark className="h-4 w-4" />
              <span className="sr-only">Save post</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
      <PostModal
        isOpen={isEditMode}
        onClose={() => setIsEditMode(false)}
        onSubmit={handleEditComplete}
        initialData={{
          type: post.type,
          title: post.title,
          content: post.content,
          tags: post.tags
        }}
      />
    </motion.div>
  );
}
import { Dialog, DialogContent } from "../ui/Dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Separator } from "../ui/Separator";
import { Comment } from "./Comment";
import ScrollArea from "../ui/ScrollArea";
import { Heart, MessageCircle, Share2, X, Send, Hash } from "lucide-react";

export function FullPostModal({ post, isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50">
        <div className="sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={post.author.image} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.author.name}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Hash className="h-3 w-3 mr-1" />
                <span>{post.author.channel}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <p className="text-gray-700 mb-4 text-lg">{post.content}</p>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600"
                >
                  <Heart className="mr-1 h-4 w-4" />
                  <span>{post.likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600"
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  <span>{post.comments.length}</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-green-600"
              >
                <Share2 className="h-4 w-4" />
                <span className="ml-1">Share</span>
              </Button>
            </div>
            <Separator className="my-6" />
            <h3 className="font-semibold text-lg mb-4">Comments</h3>
            {post.comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
        </ScrollArea>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <Input
              placeholder="Add a comment..."
              className="flex-grow bg-gray-100 border-none text-sm rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Button
              size="icon"
              className="rounded-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent } from "../ui/Dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Separator } from "../ui/Separator";
import { Comment } from "./Comment";
import ScrollArea from "../ui/ScrollArea";
import { Heart, MessageCircle, Share2, X, Send, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function FullPostModal({ post, isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] h-[80vh] p-0 overflow-hidden rounded-lg bg-white">
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.image} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">{post.author.name}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Hash className="h-3 w-3 mr-1" />
                  <span>{post.author.channel}</span>
                  <span className="mx-1">•</span>
                  <span>{formatDistanceToNow(post.timestamp, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h2>
              <p className="text-gray-700 mb-6 text-lg">{post.content}</p>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                    <Heart className="mr-1 h-4 w-4" />
                    <span>{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                    <MessageCircle className="mr-1 h-4 w-4" />
                    <span>{post.comments.length}</span>
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                  <Share2 className="h-4 w-4" />
                  <span className="ml-1">Share</span>
                </Button>
              </div>
              <Separator className="my-6" />
              <h3 className="font-semibold text-lg mb-4">Comments</h3>
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <Comment key={comment.id} comment={comment} />
                ))}
              </div>
            </div>
          </ScrollArea>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2 max-w-3xl mx-auto">
              <Avatar className="h-8 w-8">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <Input
                placeholder="Add a comment..."
                className="flex-grow bg-gray-100 border-none text-sm rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button size="icon" className="rounded-full bg-green-600 hover:bg-green-700 text-white">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send comment</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
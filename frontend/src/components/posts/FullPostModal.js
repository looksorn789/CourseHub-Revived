import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/Dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import Button from "../ui/Button";
import Input from "../ui/Input";
import ScrollArea from "../ui/ScrollArea";
import { Separator } from "../ui/Separator";
import { formatDistanceToNow } from 'date-fns';
import { X, Hash, MessageCircle, Share2, Send } from 'lucide-react';
import { ReactionPicker } from "./ReactionPicker";
import CommentService from '../../services/commentService';
import { Comment } from '../comments/Comment';
import { toast } from 'react-toastify';

export function FullPostModal({ post, isOpen, onClose, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postReactions, setPostReactions] = useState(post?.reactions || {});
  const [currentReaction, setCurrentReaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen && post?.id) {
      fetchComments();
    }
  }, [isOpen, post?.id]);

  const fetchComments = async () => {
    try {
      const response = await CommentService.getComments(post.id, page);
      const newComments = response.data.comments;
      
      setComments(prev => page === 1 ? newComments : [...prev, ...newComments]);
      setHasMore(response.data.page < response.data.total_pages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await CommentService.createComment(post.id, {
        content: newComment
      });
      
      setComments(prev => [response.data.data, ...prev]);
      setNewComment("");
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleReply = async (commentId, content, mentionedUser) => {
    try {
      const response = await CommentService.createComment(post.id, {
        content,
        parentId: commentId,
        mentionedUser
      });
      
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data.data]
            };
          }
          return comment;
        });
      });
      
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      const response = await CommentService.updateComment(commentId, content);
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? response.data.data : comment
        )
      );
      
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await CommentService.deleteComment(commentId);
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleReact = (reactionName) => {
    setPostReactions((prev) => ({
      ...prev,
      [reactionName]: (prev[reactionName] || 0) + 1,
    }));
    setCurrentReaction(reactionName);
  };

  const loadMoreComments = () => {
    setPage(prev => prev + 1);
    fetchComments();
  };

  const totalReactions = Object.values(postReactions).reduce((a, b) => a + b, 0);

  if (!post) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] h-[90vh] p-0 overflow-hidden rounded-2xl bg-gradient-to-br from-white via-green-50 to-blue-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 p-4 flex justify-between items-center">
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
                <span className="mx-1">•</span>
                <span>
                  {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                </span>
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
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <DialogTitle className="sr-only">{post.title}</DialogTitle>

        {/* Content */}
        <ScrollArea className="flex-grow overflow-auto">
          <div className="px-6 py-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
                {post.title}
              </h2>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 mb-6">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="prose prose-green max-w-none mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Reactions */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ReactionPicker
                      onReact={handleReact}
                      currentReaction={currentReaction}
                    />
                    <span className="text-xs text-gray-500">{totalReactions}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-green-600 transition-colors duration-200"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>{comments.length}</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600 transition-colors duration-200"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                </Button>
              </div>

              <Separator className="my-8" />   
              {/* Comments Section */}
              <div className="space-y-6">
                <h3 className="font-semibold text-xl mb-6">Comments</h3>
                
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {comments.map((comment) => (
                      <Comment
                        key={comment.id}
                        comment={comment}
                        currentUserId={currentUserId}
                        onReply={handleReply}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                      />
                    ))}
                    
                    {hasMore && (
                      <div className="text-center mt-6">
                        <Button
                          variant="ghost"
                          onClick={loadMoreComments}
                          className="text-green-600 hover:text-green-700"
                        >
                          Load More Comments
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex-shrink-0 sticky bottom-0 bg-white bg-opacity-90 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 max-w-2xl mx-auto">
            <Avatar className="h-8 w-8">
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-grow relative">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-gray-100 border-none text-sm rounded-full pr-12 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send comment</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
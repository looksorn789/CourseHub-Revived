import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import Button from "../ui/Button";
import Input from "../ui/Input";
import ScrollArea from "../ui/ScrollArea";
import { Separator } from "../ui/Separator";
import { formatDistanceToNow } from 'date-fns';
import { X, Hash, MessageCircle, Share2, Send, Heart } from 'lucide-react';
import { ReactionPicker } from "./ReactionPicker";
import CommentService from '../../services/commentService';
import { Comment } from '../comments/Comment';
import { toast } from 'react-toastify';
import TextareaAutosize from 'react-textarea-autosize';
import { generateAvatarSvg } from '../../utils/avatarUtils';
import { getUserProfile } from '../../services/profileService';


export function FullPostModal({ post, isOpen, onClose, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postReactions, setPostReactions] = useState(post?.reactions || {});
  const [currentReaction, setCurrentReaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState({
      name: "",
      username: "",
      avatarUrl: "",
      initials: ""
    });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
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

          setCurrentUser({
            name: fullName,
            username: username,
            avatarUrl: avatarUrl,
            initials: `${first_name?.[0] || ''}${last_name?.[0] || ''}`,
            id: data._id
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);
  
  useEffect(() => {
    if (isOpen && post?.id) {
      fetchComments();
    }
  }, [isOpen, post?.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await CommentService.getComments(post.id, page);
      console.log('Fetched comments from fetchComments:', response.data);
      
      const newComments = response.data.comments;
      
      setComments(prev =>
        page === 1 ? newComments : [...prev, ...newComments]
      );
      setHasMore(response.data.page < response.data.total_pages);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await CommentService.createComment(post.id, {
        content: newComment
      });

      console.log('New comment response:', response.data);

      setComments(prev => [response.data, ...prev]);
      setNewComment("");
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleEditComment = async (commentId, content) => {
    if (!commentId) {
      console.error('Cannot edit comment: commentId is undefined');
      return;
    }
    try {
      const response = await CommentService.updateComment(commentId, content);

      setComments(prev =>
        prev.map(comment =>
          comment._id === commentId ? response.data : comment
        )
      );

      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) {
      console.error('Cannot delete comment: commentId is undefined');
      return;
    }
    try {
      await CommentService.deleteComment(commentId);

      setComments(prev => prev.filter(comment => comment._id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };


  const handleAddReply = async (commentId, content, mentionedUser) => {
    try {
      const response = await CommentService.createReply(commentId, {
        content,
        mentionedUser
      });

      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data],
            reply_count: (comment.reply_count || 0) + 1
          };
        }
        return comment;
      }));

      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleEditReply = async (replyId, content) => {
    try {
      const response = await CommentService.updateComment(replyId, content);

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.replies && comment.replies.length > 0) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply._id === replyId) {
                return response.data;
              }
              return reply;
            });
            return {
              ...comment,
              replies: updatedReplies
            };
          }
          return comment;
        })
      );

      toast.success('Reply updated successfully');
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('Failed to update reply');
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await CommentService.deleteComment(replyId);

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.replies && comment.replies.length > 0) {
            const updatedReplies = comment.replies.filter(reply => reply._id !== replyId);
            return {
              ...comment,
              replies: updatedReplies
            };
          }
          return comment;
        })
      );

      toast.success('Reply deleted successfully');
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
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
      <DialogContent 
        className="sm:max-w-[800px] w-[95vw] h-[95vh] p-0 overflow-hidden rounded-3xl bg-gradient-to-br from-white via-green-50 to-blue-50 flex flex-col shadow-xl"
      >
      <DialogTitle className="sr-only">Post Details</DialogTitle>
      <DialogDescription className="sr-only">
        Full view of post and comments
      </DialogDescription>
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 px-6">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-sm opacity-50" />
                <Avatar className="h-12 w-12 border-2 border-white relative">
                  <AvatarImage src={post.author.image} />
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                    {post.author.name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.author.name}</p>
                <div className="flex items-center text-sm text-gray-500 mt-0.5">
                  <Hash className="h-4 w-4 mr-1 text-green-500" />
                  <span className="font-medium">{post.author.channel}</span>
                  <span className="mx-2">•</span>
                  <time className="text-gray-400">
                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </time>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {post.title}
                </h1>
                
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="px-3 py-1 bg-gradient-to-r from-green-50 to-green-100 text-green-700 text-sm font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose prose-lg prose-green">
                  <p className="text-gray-700 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-6">
                  <Button variant="ghost" className="rounded-full hover:bg-gray-100">
                    <Heart className="h-5 w-5 mr-2 text-green-600" />
                    <span className="text-gray-600">{totalReactions}</span>
                  </Button>
                  <Button variant="ghost" className="rounded-full hover:bg-gray-100">
                    <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                    <span className="text-gray-600">{comments.length}</span>
                  </Button>
                </div>
                <Button variant="ghost" className="rounded-full hover:bg-gray-100">
                  <Share2 className="h-5 w-5 text-green-600" />
                </Button>
              </div>

              <Separator className="my-8" />

              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-gray-900">Comments</h2>
                
                {loading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div key={`skeleton-${index}`} className="animate-pulse flex gap-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="space-y-6">
                      {comments.map((comment, index) => (
                        comment && comment._id ? (
                          <Comment
                            key={comment._id}
                            comment={comment}
                            currentUserId={currentUserId}
                            onAddReply={handleAddReply}
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
                            onEditReply={handleEditReply}
                            onDeleteReply={handleDeleteReply}
                          />
                        ) : (
                          <div key={`comment-placeholder-${index}`}>
                            <p className="text-gray-500 italic">Invalid comment data</p>
                          </div>
                        )
                      ))}
                    
                    {hasMore && (
                      <Button
                        variant="outline"
                        onClick={loadMoreComments}
                        className="w-full rounded-xl border-gray-200 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        Load More Comments
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 sticky bottom-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 py-4 px-6">
          <div className="flex items-start gap-4 max-w-3xl mx-auto">
            <Avatar className="h-12 w-12 border-2 border-white relative">
              {currentUser.avatarUrl ? (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                  {currentUser.initials || currentUser.name?.[0] || '?'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-green-300 transition-all duration-200">
                <TextareaAutosize
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  minRows={1}
                  maxRows={5}
                  className="w-full py-3 px-4 text-gray-700 text-sm rounded-2xl resize-none focus:outline-none focus:ring-0 pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className={`absolute right-2 bottom-2 rounded-full w-8 h-8 p-0 transition-all duration-200 
                    ${newComment.trim() 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
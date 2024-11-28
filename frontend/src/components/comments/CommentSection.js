import { useState, useEffect } from 'react';
import { Comment } from './Comment';
import { Button } from '../ui/Button';
import CommentService from '../../services/commentService';
import { toast } from 'react-toastify';

export function CommentSection({ postId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await CommentService.getComments(postId, page);
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

  const handleCreateComment = async () => {
    try {
      const response = await CommentService.createComment(postId, {
        content: newComment
      });
      
      setComments(prev => [response.data.data, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleReply = async (commentId, content, mentionedUser) => {
    try {
      const response = await CommentService.createComment(postId, {
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

  const handleEdit = async (commentId, content) => {
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

  const handleDelete = async (commentId) => {
    try {
      await CommentService.deleteComment(commentId);
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLike = async (commentId) => {
    try {
      const response = await CommentService.toggleLike(commentId);
      
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: response.data.likes, liked: !comment.liked }
            : comment
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like comment');
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchComments();
  };

  if (loading) return <div className="animate-pulse">Loading comments...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-3 border rounded-lg"
          rows="3"
        />
        <Button
          onClick={handleCreateComment}
          disabled={!newComment.trim()}
        >
          Post Comment
        </Button>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLike={handleLike}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button variant="ghost" onClick={loadMore}>
            Load More Comments
          </Button>
        </div>
      )}
    </div>
  );
}
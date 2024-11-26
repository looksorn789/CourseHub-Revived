import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
  MoreHorizontal,
  MessageCircle,
  Heart,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { formatDistanceToNow } from 'date-fns';
import { generateAvatarSvg } from '../../utils/avatarUtils';

export function Comment({ 
  comment, 
  currentUserId, 
  onReply, 
  onEdit, 
  onDelete,
  depth = 0 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  const isAuthor = currentUserId === comment.user_id;
  const maxDepth = 3; // Maximum nesting level
  const marginClass = depth > 0 ? `ml-${Math.min(depth * 8, 24)}` : '';

  const handleSubmitEdit = async () => {
    try {
      await onEdit(comment.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleSubmitReply = async () => {
    try {
      await onReply(comment.id, replyContent, comment.user_info?.username);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const getAvatarUrl = (userInfo) => {
    if (userInfo?.avatar_url) return userInfo.avatar_url;
    if (userInfo?.avatar_config) {
      const { style, seed, options } = userInfo.avatar_config;
      return `data:image/svg+xml;utf8,${encodeURIComponent(generateAvatarSvg(style, seed, options))}`;
    }
    return null;
  };

  return (
    <div className={`${marginClass} mb-6`}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={getAvatarUrl(comment.user_info)} 
            alt={comment.user_info?.username || 'User'} 
          />
          <AvatarFallback>
            {(comment.user_info?.username || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {comment.user_info?.username || 'Unknown User'}
                </span>
                <span className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mb-2"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSubmitEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800">{comment.content}</p>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Heart className="h-4 w-4 mr-1" />
              {comment.likes || 0}
            </Button>
            
            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to @${comment.user_info?.username}...`}
                    className="mb-2"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSubmitReply}>
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsReplying(false);
                        setReplyContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="text-gray-500 hover:text-gray-700 mb-2"
          >
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
          </Button>
          
          {showReplies && (
            <div className="space-y-4">
              {comment.replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
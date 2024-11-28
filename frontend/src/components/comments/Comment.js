import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import TextareaAutosize from 'react-textarea-autosize';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
  MoreHorizontal,
  Heart,
  Edit2,
  Trash2,
  Reply,
  Send,
  ChevronUp,
  ChevronDown,
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
  onAddReply, 
  onEditComment, 
  onDeleteComment,
  onEditReply,
  onDeleteReply,
  depth = 0 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const isAuthor = currentUserId === comment.user_id;
  const maxDepth = 3;
  const isReply = comment.parent_id !== null;

  const handleSubmitEdit = async () => {
    try {
      const commentId = comment._id || comment.id;
      console.log('Editing', isReply ? 'reply' : 'comment', 'with ID:', commentId);

      if (isReply) {
        await onEditReply(commentId, editContent);
      } else {
        await onEditComment(commentId, editContent);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment/reply:', error);
    }
  };

  const handleDeleteClick = () => {
    const commentId = comment._id || comment.id;
    console.log('Deleting', isReply ? 'reply' : 'comment', 'with ID:', commentId);

    if (isReply) {
      onDeleteReply(commentId);
    } else {
      onDeleteComment(commentId);
    }
  };

  const handleSubmitReply = async () => {
    try {
      const commentId = comment._id || comment.id;
      console.log('Replying to comment with ID:', commentId);
      await onAddReply(commentId, replyContent, comment.user_info?.username);
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
    <div className={`${depth > 0 ? `ml-${Math.min(depth * 8, 24)}` : ''} mb-8`}>
        <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10 rounded-full border-2 border-white ring-2 ring-gray-100">
            <AvatarImage src={getAvatarUrl(comment.user_info)} />
            <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
            {(comment.user_info?.username || 'U')[0].toUpperCase()}
            </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{comment.user_info?.username}</span>
                <span className="text-xs text-gray-400 font-medium">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                </div>

                {isAuthor && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl p-1">
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="flex items-center text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteClick} className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer w-full px-2 py-1.5">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>
            
            {isEditing ? (
                <div className="space-y-3">
                    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-200 hover:border-green-200">
                    <TextareaAutosize
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full py-3 px-4 text-sm rounded-2xl resize-none focus:outline-none focus:ring-0 pr-12"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitEdit();
                            }
                        }}
                        minRows={2}
                        maxRows={5}
                    />
                    </div>
                    <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={handleSubmitEdit}
                        className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        Save
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                        }}
                        className="rounded-full"
                    >
                        Cancel
                    </Button>
                    </div>
                </div>
                ) : (
                <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                )}


            <div className="flex items-center gap-4 mt-3">
                <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                <Heart className="h-4 w-4 mr-1.5" />
                <span className="text-sm">{comment.likes || 0}</span>
                </Button>

                {depth < maxDepth && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReplying(!isReplying)}
                    className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                    <Reply className="h-4 w-4 mr-1.5" />
                    <span className="text-sm">Reply</span>
                </Button>
                )}
            </div>
            </div>

            {isReplying && (
            <div className="flex items-start gap-4 pl-2">
                <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white">You</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 transition-all duration-200 hover:border-green-200">
                    <TextareaAutosize
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to @${comment.user_info?.username}...`}
                    className="w-full py-3 px-4 text-sm rounded-2xl resize-none focus:outline-none focus:ring-0 pr-12"
                    onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply();
                    }
                  }}
                    minRows={1}
                    maxRows={5}
                    />
                    <Button
                    size="sm"
                    className={`absolute right-2 bottom-2 rounded-full w-8 h-8 p-0 transition-all duration-200
                        ${replyContent.trim() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim()}
                    >
                    <Send className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                    }}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                    Cancel
                </Button>
                </div>
            </div>
            )}

            {comment.replies?.length > 0 && (
            <div>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="rounded-full text-gray-500 hover:text-gray-700"
                >
                {showReplies ? <ChevronUp className="h-3 w-3 mr-1.5" /> : <ChevronDown className="h-3 w-3 mr-1.5" />}
                <span className="text-sm">
                    {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                    {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
                </Button>

                {showReplies && (
                <div className="mt-4 space-y-4">
                    {comment.replies.map((reply) => (
                    <Comment
                        key={reply._id || reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        onAddReply={onAddReply}
                        onEditComment={onEditComment}
                        onDeleteComment={onDeleteComment}
                        onEditReply={onEditReply}
                        onDeleteReply={onDeleteReply}
                        depth={depth + 1}
                    />
                    ))}
                </div>
                )}
            </div>
            )}
        </div>
        </div>
    </div>
    );
}
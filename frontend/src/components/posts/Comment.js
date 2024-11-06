import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import Button from '../ui/Button';
import { ThumbsUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


export function Comment({ comment }) {
  return (
    <div className="flex space-x-3 mb-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author.image} alt={comment.author.name} />
        <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="font-semibold text-sm">{comment.author.name}</p>
          <p className="text-sm text-gray-700">{comment.content}</p>
        </div>
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <span>{formatDistanceToNow(comment.timestamp, { addSuffix: true })}</span>
          <Button variant="ghost" size="sm" className="ml-2 text-gray-500 hover:text-green-600">
            <ThumbsUp className="h-3 w-3 mr-1" />
            {comment.likes}
          </Button>
          <Button variant="ghost" size="sm" className="ml-2 text-gray-500 hover:text-green-600">
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
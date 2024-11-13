import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Badge from '../ui/Badge';
import { X } from 'lucide-react';


export function CreatePostModal({ isOpen, onClose, onCreatePost }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onCreatePost({
        id: Date.now(),
        author: {
          name: 'You',
          image: '/',
          channel: 'Machine Learning Enthusiasts',
        },
        timestamp: new Date(),
        content: content.trim(),
        likes: 0,
        comments: [],
        tags: tags,
      });
      setContent('');
      setTags([]);
      onClose();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() !== '' && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create a New Post</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share what's going on your mind with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Textarea
            placeholder="What's on your mind?"
            className="w-full h-40 p-3 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm group"
              >
                {tag}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-1 p-0 h-auto opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              className="flex-grow p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button onClick={handleAddTag} className="bg-green-600 text-white hover:bg-green-700">
              Add Tag
            </Button>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 text-white hover:bg-green-700">
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
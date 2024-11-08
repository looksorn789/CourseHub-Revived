import { useState } from 'react';
import { HelpCircle, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import Button from "../ui/Button";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Textarea from "../ui/Textarea";
import Badge from '../ui/Badge';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';


export function CreatePostModal({ isOpen, onClose, onCreatePost }) {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')

  const handleSubmit = () => {
    if (category && title.trim() && content.trim()) {
      onCreatePost({
        id: Date.now(),
        author: {
          name: 'You',
          image: '/placeholder.svg?height=50&width=50',
          channel: 'Machine Learning Enthusiasts',
        },
        timestamp: new Date(),
        category,
        title: title.trim(),
        content: content.trim(),
        likes: 0,
        comments: [],
        tags: tags,
      })
      resetForm()
      onClose()
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() !== '' && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const resetForm = () => {
    setCategory('')
    setTitle('')
    setContent('')
    setTags([])
    setNewTag('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleCategoryChange = (value) => {
    setCategory(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl bg-white overflow-hidden border border-green-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create a New Post</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share your question or start a discussion with the community.
          </DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {!category ? (
            <motion.div
              key="category-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              <Label className="block text-sm font-medium text-gray-700 mb-2">What would you like to do?</Label>
              <RadioGroup value={category} onValueChange={handleCategoryChange}>
                <div className="flex space-x-4">
                  <div>
                    <RadioGroupItem value="question" id="question" className="peer sr-only" />
                    <Label
                      htmlFor="question"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-green-100 bg-white p-4 hover:bg-green-50 hover:border-green-200 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 [&:has([data-state=checked])]:border-green-500 [&:has([data-state=checked])]:bg-green-50 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      <HelpCircle className="mb-3 h-6 w-6 text-green-600" />
                      Question
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="discussion" id="discussion" className="peer sr-only" />
                    <Label
                      htmlFor="discussion"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-green-100 bg-white p-4 hover:bg-green-50 hover:border-green-200 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 [&:has([data-state=checked])]:border-green-500 [&:has([data-state=checked])]:bg-green-50 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      <MessageSquare className="mb-3 h-6 w-6 text-green-600" />
                      Discussion
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </motion.div>
          ) : (
            <motion.div
              key="post-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              <motion.div
                key="post-title"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-1">Title</Label>
                <Input
                  id="post-title"
                  placeholder="Enter post title"
                  className="w-full p-2 text-gray-700 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div
                key="post-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="post-content" className="block text-sm font-medium text-gray-700 mb-1">Content</Label>
                <Textarea
                  id="post-content"
                  placeholder={category === 'question' ? "What's your question?" : "What's on your mind?"}
                  className="w-full h-40 p-2 text-gray-700 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div
                key="post-tags"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.3 }}
              >
                <Label className="block text-sm font-medium text-gray-700 mb-2">Tags</Label>
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
                        <span className="sr-only">Remove tag</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    className="flex-grow p-2 text-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button onClick={handleAddTag} className="bg-green-600 text-white hover:bg-green-700 transition-colors">
                    Add Tag
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <DialogFooter className="mt-6">
          {category && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-between w-full"
            >
              <Button 
                variant="outline" 
                onClick={() => setCategory('')} 
                className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 transition-colors"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-green-600 text-white hover:bg-green-700 transition-colors"
                disabled={!title.trim() || !content.trim()}
              >
                Post {category === 'question' ? 'Question' : 'Discussion'}
              </Button>
            </motion.div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
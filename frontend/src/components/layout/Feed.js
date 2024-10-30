import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, X, ThumbsUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import Button from "../ui/Button"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/Card"
import Input from "../ui/Input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu"
import { Separator } from "../ui/Separator"
import { Dialog, DialogContent } from "../ui/Dialog"
import ScrollArea from "../ui/ScrollArea"
import { motion, AnimatePresence } from "framer-motion"

const posts = [
  {
    id: 1,
    author: {
      name: 'Elias Woldie',
      image: '',
      channel: 'Data Structures and Algorithms',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    content: "I'm currently diving deep into graph algorithms, and it's fascinating how they're used in real-world applications like social networks and recommendation systems. Does anyone have recommendations for resources or exercises to practice these concepts?",
    likes: 25,
    comments: [
      {
        id: 1,
        author: { name: 'Patrick Bootchot', image: '' },
        content: "Check out LeetCode! They have some great graph algorithm problems, especially for interview prep.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        likes: 8,
      },
    ],
  },
  {
    id: 2,
    author: {
      name: 'Zachary Sanchez',
      image: '',
      channel: 'Artificial Intelligence',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    content: "Started working on a project using neural networks to detect anomalies in datasets. It’s amazing how much potential AI has in automating tasks we thought were impossible before. Anyone here working on something similar?",
    likes: 40,
    comments: [
      {
        id: 2,
        author: { name: 'Jenna Itani', image: '' },
        content: "That's awesome! I'm working on image classification using CNNs. What framework are you using for your project?",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        likes: 12,
      },
    ],
  },
  {
    id: 3,
    author: {
      name: 'Patrick Bootchot',
      image: '',
      channel: 'Machine Learning',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    content: "After weeks of training and tweaking, I finally achieved 95% accuracy on my machine learning model! It was quite a journey, but persistence pays off. Anyone else have tips for improving model accuracy?",
    likes: 65,
    comments: [
      {
        id: 3,
        author: { name: 'Randolf Pangilin', image: '' },
        content: "Congrats, Patrick! Have you tried experimenting with hyperparameter tuning? It can make a big difference.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        likes: 9,
      },
      {
        id: 4,
        author: { name: 'Ethan Andrews', image: '' },
        content: "Great job! I found that using a more complex ensemble model can also help improve accuracy.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
        likes: 11,
      },
    ],
  },
  {
    id: 4,
    author: {
      name: 'Ethan Andrews',
      image: '',
      channel: 'Operating Systems',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9),
    content: "Just finished a project on process synchronization in operating systems. It’s pretty cool learning how critical sections and deadlock avoidance work under the hood. Any advice for resources on advanced OS topics?",
    likes: 22,
    comments: [
      {
        id: 5,
        author: { name: 'Zachary Sanchez', image: '' },
        content: "You should check out 'Operating Systems: Three Easy Pieces.' It's a great resource for diving deeper into OS concepts.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        likes: 6,
      },
    ],
  },
  {
    id: 5,
    author: {
      name: 'Jenna Itani',
      image: '',
      channel: 'Web Development',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 11),
    content: "I'm building my first full-stack application using React and Node.js. The backend setup was more complicated than I expected. Does anyone have any tips for managing API routes efficiently?",
    likes: 34,
    comments: [
      {
        id: 6,
        author: { name: 'Elias Woldie', image: '' },
        content: "It can be tricky at first! I recommend using Express.js and structuring your routes by resource type. Also, middleware can really help keep things clean.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        likes: 10,
      },
    ],
  },
  {
    id: 6,
    author: {
      name: 'Randolf Pangilin',
      image: '',
      channel: 'Cybersecurity',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
    content: "I'm researching the impact of quantum computing on modern encryption techniques. It’s a bit daunting, but I’m fascinated by how encryption as we know it could change in the next decade. Anyone have recommendations for papers on this?",
    likes: 50,
    comments: [
      {
        id: 7,
        author: { name: 'Patrick Bootchot', image: '' },
        content: "There's a great paper by Shor on quantum algorithms that you might find interesting. It explains how certain encryption techniques could be vulnerable.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15),
        likes: 15,
      },
    ],
  },
  {
    id: 7,
    author: {
      name: 'Elias Woldie',
      image: '',
      channel: 'Database Systems',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    content: "I've been working with NoSQL databases, and it's quite different from traditional SQL. Anyone here have experience with MongoDB? I'd love to hear your thoughts on how it compares to PostgreSQL for large-scale applications.",
    likes: 27,
    comments: [
      {
        id: 8,
        author: { name: 'Zachary Sanchez', image: '' },
        content: "MongoDB is great for unstructured data, but you may run into challenges with complex queries. PostgreSQL offers more in terms of relational integrity.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        likes: 7,
      },
    ],
  },
  {
    id: 8,
    author: {
      name: 'Zachary Sanchez',
      image: '',
      channel: 'Cloud Computing',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    content: "Just deployed my first application using AWS Lambda. It’s incredible how serverless architecture can streamline deployment, but there’s definitely a learning curve. Any tips on optimizing cold starts?",
    likes: 38,
    comments: [
      {
        id: 9,
        author: { name: 'Ethan Andrews', image: '' },
        content: "One trick is to pre-warm your Lambda functions by sending scheduled requests. It helps reduce cold start times significantly.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
        likes: 12,
      },
    ],
  },
  {
    id: 9,
    author: {
      name: 'Jenna Itani',
      image: '',
      channel: 'DevOps',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    content: "I've been diving into CI/CD pipelines, and I’m amazed at how they can improve development workflow. Jenkins and Docker are powerful tools, but I’m curious if anyone has experience with alternatives like GitLab CI?",
    likes: 45,
    comments: [
      {
        id: 10,
        author: { name: 'Randolf Pangilin', image: '' },
        content: "I’ve used GitLab CI on a few projects, and it's solid! The built-in integration with GitLab repositories makes it really easy to set up pipelines.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7),
        likes: 13,
      },
    ],
  },
  {
    id: 10,
    author: {
      name: 'Patrick Bootchot',
      image: '',
      channel: 'Software Engineering',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9),
    content: "Finally wrapping up my capstone project! Building a real-time collaboration tool was both exciting and challenging. I had to handle concurrency issues and ensure smooth performance across multiple users. Anyone else working on large-scale projects?",
    likes: 52,
    comments: [
      {
        id: 11,
        author: { name: 'Zachary Sanchez', image: '' },
        content: "Congrats on finishing! I’m working on a real-time chat app, and concurrency has definitely been tricky. Any tips?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        likes: 18,
      },
    ],
  },
];


function PostCard({ post, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

  const toggleLike = (e) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
  }

  const toggleSave = (e) => {
    e.stopPropagation()
    setIsSaved(!isSaved)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className="mb-6 bg-gradient-to-br from-white to-green-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden border-none cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center space-x-4">
            <div className="p-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={post.author.image} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span>{post.author.channel}</span>
                <span className="mx-1">•</span>
                <span>{formatDistanceToNow(post.timestamp, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full transition-colors duration-200 ${
                isSaved ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={toggleSave}
            >
              <Bookmark className="h-5 w-5" />
              <span className="sr-only">Save post</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40"> 
                <DropdownMenuItem>Unfollow User</DropdownMenuItem>
                <DropdownMenuItem>Block user</DropdownMenuItem>
                <DropdownMenuItem>Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <p className={`text-gray-700 ${!isExpanded ? 'line-clamp-3' : ''}`}>
            {post.content}
          </p>
          {post.content.length > 150 && (
            <Button
              variant="link"
              className="p-0 h-auto text-green-600 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? 'See less' : 'See more'}
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch pt-2">
          <div className="flex justify-between items-center mb-3">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full transition-colors duration-200 ${
                isLiked ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={toggleLike}
            >
              <Heart className="mr-1 h-4 w-4" />
              <span>{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <MessageCircle className="mr-1 h-4 w-4" />
              <span>{post.comments.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add a comment..."
              className="flex-grow bg-white border border-gray-200 text-sm rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
            <Button 
              size="icon" 
              className="rounded-full bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send comment</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

function Comment({ comment }) {
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
  )
}

function FullPostModal({ post, isOpen, onClose }) {
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
              <p className="text-xs text-gray-500">{post.author.channel}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <p className="text-gray-700 mb-4 text-lg">{post.content}</p>
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
            <Button size="icon" className="rounded-full bg-green-600 hover:bg-green-700 text-white">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send comment</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Feed() {
  const [selectedPost, setSelectedPost] = useState(null)

  return (
    <div className="px-4 py-8">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onClick={() => setSelectedPost(post)}
        />
      ))}
      <AnimatePresence>
        {selectedPost && (
          <FullPostModal
            post={selectedPost}
            isOpen={!!selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Feed
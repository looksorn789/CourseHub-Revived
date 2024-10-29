import { Hash, Pin, TrendingUp } from 'lucide-react'
import Button from "../ui/Button"
import {Card, } from "../ui/Card"
import Badge from "../ui/Badge"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"

const channelSuggestions = [
  { name: 'Web Development', image: '/placeholder.svg?height=40&width=40', followers: 15234 },
  { name: 'Data Science', image: '/placeholder.svg?height=40&width=40', followers: 12456 },
  { name: 'UX/UI Design', image: '/placeholder.svg?height=40&width=40', followers: 9876 },
  { name: 'Machine Learning', image: '/placeholder.svg?height=40&width=40', followers: 8765 },
]

const pinnedChannels = [
  { name: 'JavaScript', image: '/placeholder.svg?height=32&width=32' },
  { name: 'Python', image: '/placeholder.svg?height=32&width=32' },
  { name: 'React', image: '/placeholder.svg?height=32&width=32' },
]

const popularTags = ['react', 'javascript', 'python', 'machinelearning', 'webdev', 'css', 'html', 'nodejs', 'design', 'programming']

function RightSidebar() {
  return (
    <div className="w-80 border-l border-gray-200 p-4 space-y-6">
      {/* Channel Suggestions */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-md">
        <div className="p-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Suggested Channels</h2>
        </div>
        <div className="p-4 pt-0">
          <div className="space-y-4">
            {channelSuggestions.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={channel.image} alt={channel.name} />
                    <AvatarFallback>{channel.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm text-gray-800">{channel.name}</h3>
                    <p className="text-xs text-gray-500">{channel.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="text-xs h-8 px-3 bg-white hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-md">
        <div className="p-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Suggested Channels</h2>
        </div>
        <div className="p-4 pt-0">
          <div className="space-y-4">
            {channelSuggestions.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={channel.image} alt={channel.name} />
                    <AvatarFallback>{channel.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm text-gray-800">{channel.name}</h3>
                    <p className="text-xs text-gray-500">{channel.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="text-xs h-8 px-3 bg-white hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Pinned Channels */}
      <Card>
        <div className="p-4 pb-2">
          <h2 className="text-sm font-medium flex items-center text-gray-700">
            <Pin className="w-4 h-4 mr-2" />
            Pinned Channels
          </h2>
        </div>
        <div className="p-4 pt-0">
          <div className="flex flex-col space-y-1">
            {pinnedChannels.map((channel) => (
              <Button 
                key={channel.name} 
                variant="ghost" 
                className="w-full justify-start h-10 hover:bg-gray-100 transition-colors duration-200"
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={channel.image} alt={channel.name} />
                  <AvatarFallback>{channel.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{channel.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Popular Tags */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md">
        <div className="p-4 pb-2">
          <h2 className="text-sm font-medium flex items-center text-gray-800">
            <TrendingUp className="w-4 h-4 mr-2" />
            Popular Tags
          </h2>
        </div>
        <div className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="bg-white hover:bg-gray-100 text-gray-800 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
              >
                <Hash className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RightSidebar
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getUserByUsername } from "../../services/profileService";
import { avatarDataUrl } from "../../utils/avatarUtils";
import Button from "../ui/Button"
import Textarea from "../ui/Textarea"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import ScrollArea from "../ui/ScrollArea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog"
import Badge from "../ui/Badge"
import { Separator } from "../ui/Separator"
import ProfileSkeleton from "./ProfileSkeleton"
import { School, GraduationCap, Award, MessageSquare, UserPlus, Users, Calendar as CalendarIcon, Send } from "lucide-react"

export default function ProfileView() {
  const { username } = useParams() 
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageContent, setMessageContent] = useState('')

  // Temporary data for posts and connections
  const [followers] = useState(245)
  const [following] = useState(178)
  const [isFollowing, setIsFollowing] = useState(false)
  const [posts] = useState([
    { id: "1", content: "Just finished my machine learning project! 🎉 #AI #MachineLearning", likes: 42, comments: 7, date: "2023-11-25T14:30:00Z" },
    { id: "2", content: "Excited to attend the tech conference next week! Anyone else going? #TechConf2023", likes: 31, comments: 5, date: "2023-11-22T09:15:00Z" },
    { id: "3", content: "Study group for Advanced Algorithms tonight at the library. Join us! 📚 #CS #StudyGroup", likes: 18, comments: 3, date: "2023-11-20T18:45:00Z" },
  ])

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      const { data, error } = await getUserByUsername(username)
      if (data) {
        setUserData(data)
      } else {
        setError(error)
      }
      setIsLoading(false)
    }

    if (username) {
      fetchUserData()
    }
  }, [username])

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const handleSendMessage = () => {
    console.log("Sending message:", messageContent)
    setMessageContent('')
    setIsMessageModalOpen(false)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getGraduationYear = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).getFullYear();
  };

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>No user data found</div>;

  return (
    <div className="min-h-screen to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-32 h-32 border-4 border-green-500">
                <AvatarImage 
                  src={avatarDataUrl(userData.profile.avatar_config, userData.username)} 
                  alt={`${userData.profile.first_name} ${userData.profile.last_name}`} 
                />
                <AvatarFallback>{userData.profile.first_name[0]}{userData.profile.last_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  {userData.profile.first_name} {userData.profile.last_name}
                </h1>
                <p className="text-xl text-gray-600 mb-2">@{userData.username}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <School className="w-4 h-4 mr-1" />
                    {userData.profile.school}
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {userData.profile.major}
                  </Badge>
                  {userData.profile.graduation_date && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Class of {getGraduationYear(userData.profile.graduation_date)}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{userData.profile.bio}</p>
                <div className="flex justify-center md:justify-start space-x-4">
                  <Button onClick={handleFollow} className={isFollowing ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-green-600 text-white hover:bg-green-700"}>
                    {isFollowing ? (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setIsMessageModalOpen(true)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                {posts.map((post) => (
                  <div key={post.id} className="mb-6 last:mb-0">
                    <p className="text-gray-800 mb-2">{post.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{formatDate(post.date)}</span>
                      <div className="flex space-x-4">
                        <span>{post.likes} likes</span>
                        <span>{post.comments} comments</span>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userData.profile.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {userData.profile.awards && userData.profile.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Awards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userData.profile.awards.map((award, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        <Award className="w-4 h-4 mr-1" />
                        {award}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{followers}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{following}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Message to {userData.profile.first_name}</DialogTitle>
            <DialogDescription>
              Your message will be sent directly to {userData.profile.first_name}. Be respectful and follow community guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsMessageModalOpen(false)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              Cancel
            </Button>
            <Button onClick={handleSendMessage} className="bg-green-600 text-white hover:bg-green-700">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
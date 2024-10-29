import { useState } from 'react'
import { PlusCircle, Check, Upload } from 'lucide-react'
import Button from "../ui/Button"
import { Dialog, DialogContent } from "../ui/Dialog"
import Input from "../ui/Input"
import Label from "../ui/Label"
import Textarea from "../ui/Textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select"

const tags = ['Q&A', 'Lecture Notes', 'Homework Help', 'Study Group', 'Exam Prep', 'Career']

const steps = [
  { title: "Basics", description: "Enter channel name and description" },
  { title: "Category", description: "Select a category for your channel" },
  { title: "Images", description: "Upload profile icon and banner" },
]

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const FileUpload = ({ id, label, file, onFileChange, accept = "image/*" }) => {
  const handleChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileChange(selectedFile)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <input
            id={id}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={accept}
          />
          <Button
            type="button"
            onClick={() => document.getElementById(id).click()}
            className="w-full bg-white border-2 border-dashed border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 flex items-center justify-center py-4"
          >
            <Upload className="mr-2 h-4 w-4" />
            <span>Choose {label}</span>
          </Button>
        </div>
        {file && (
          <div className={cn(
            "bg-gray-200 flex items-center justify-center overflow-hidden",
            id === "profileIcon" ? "w-12 h-12 rounded-full" : "w-24 h-12 rounded"
          )}>
            <img
              src={URL.createObjectURL(file)}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      {file && (
        <p className="text-sm text-gray-500 truncate">
          {file.name}
        </p>
      )}
    </div>
  )
}

function CreateChannelModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [channelName, setChannelName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [profileIcon, setProfileIcon] = useState(null)
  const [bannerCover, setBannerCover] = useState(null)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (currentStep < steps.length - 1) {
      handleNext()
    } else {
      console.log({ channelName, description, selectedTag, profileIcon, bannerCover })
      setIsOpen(false)
      setChannelName('')
      setDescription('')
      setSelectedTag('')
      setProfileIcon(null)
      setBannerCover(null)
      setCurrentStep(0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        className="w-full bg-green-600 hover:bg-green-700 text-white h-10 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105"
        onClick={() => setIsOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">Create Channel</span>
      </Button>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <div>
          <h2 className="text-2xl font-bold text-green-600">Create New Channel</h2>
          <p className="text-gray-500">
            Follow the steps to create your new channel
          </p>
        </div>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2",
                  index <= currentStep ? "bg-green-600" : "bg-gray-300"
                )}>
                  {index < currentStep ? <Check className="w-6 h-6" /> : index + 1}
                </div>
                <div className="text-xs text-center">
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-green-600 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="channelName">Channel Name</Label>
                <Input
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter channel name"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z0-9\s]+"
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the channel"
                  required
                  maxLength={200}
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </>
          )}
          {currentStep === 1 && (
            <div className="space-y-2">
              <Label htmlFor="tag">Category</Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="border-green-300 focus:border-green-500 focus:ring-green-500">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {currentStep === 2 && (
            <>
              <FileUpload
                id="profileIcon"
                label="Profile Icon"
                file={profileIcon}
                onFileChange={setProfileIcon}
              />
              <FileUpload
                id="bannerCover"
                label="Banner Cover"
                file={bannerCover}
                onFileChange={setBannerCover}
              />
            </>
          )}
          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <Button 
                type="button" 
                onClick={handlePrevious}
                className="bg-white text-green-600 border-green-600 hover:bg-green-50"
              >
                Previous
              </Button>
            )}
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 text-white ml-auto"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateChannelModal
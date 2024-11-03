import { useState } from 'react'
import { PlusCircle, Check, Upload } from 'lucide-react'
import axios from 'axios'
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
} from "../ui/Select";

const tags = ['Q&A', 'Lecture Notes', 'Homework Help', 'Study Group', 'Exam Prep', 'Career'];
const steps = [
  { title: "Basics", description: "Enter channel name and description" },
  { title: "Category", description: "Select a category and add tags" },
  { title: "Images", description: "Upload profile icon and banner" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const FileUpload = ({ id, label, file, onFileChange, accept = "image/*" }) => {
  const handleChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

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
          <div
            className={cn(
              "bg-gray-200 flex items-center justify-center overflow-hidden",
              id === "profileIcon" ? "w-12 h-12 rounded-full" : "w-24 h-12 rounded"
            )}
          >
            <img
              src={URL.createObjectURL(file)}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      {file && <p className="text-sm text-gray-500 truncate">{file.name}</p>}
    </div>
  );
};

function CreateChannelModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [profileIcon, setProfileIcon] = useState(null);
  const [bannerCover, setBannerCover] = useState(null);
  const [newForum, setNewForum] = useState({ title: "", description: "", category: "", tags: [] });
  const [currentTag, setCurrentTag] = useState("");
  const [loading, setLoading] = useState(false);

  const addTag = () => {
    if (currentTag && !newForum.tags.includes(currentTag)) {
      setNewForum((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag(""); // Reset current tag input
    }
  };

  const handleTagRemove = (index) => {
    setNewForum((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index) // Correctly filter tags
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      handleNext();
    } else {
      setLoading(true);
      const forumData = {
        name: newForum.title,
        description: newForum.description,
        category: newForum.category,
        tags: newForum.tags,
      };
      if (profileIcon) forumData.append("profile_icon", profileIcon);
      if (bannerCover) forumData.append("banner_cover", bannerCover);
      try {
        const response = await axios.post("/api/forums/", forumData);
        console.log("Forum created successfully:", response.data);
        setNewForum({ title: "", description: "", category: "", tags: [] });
        setCurrentTag("");
        setIsOpen(false);
        setProfileIcon(null);
        setBannerCover(null);
        setCurrentStep(0);
      } catch (error) {
        console.error("Error creating channel:", error);
      } finally {
        setLoading(false);
      }
    }
  };

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
          <h2 className="text-2xl font-bold text-green-600">
            Create New Channel
          </h2>
          <p className="text-gray-500">
            Follow the steps to create your new channel
          </p>
        </div>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2",
                    index <= currentStep ? "bg-green-600" : "bg-gray-300"
                  )}
                >
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
                  value={newForum.title}
                  onChange={(e) => setNewForum(prev => ({...prev, title: e.target.value}))}
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
                  value={newForum.description}
                  onChange={(e) => setNewForum(prev => ({...prev, description: e.target.value}))}
                  placeholder="Brief description of the channel"
                  required
                  maxLength={200}
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </>
          )}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tag">Category</Label>
                <Select value={newForum.category} onValueChange={(value) => setNewForum(prev => ({...prev, category: value}))}>
                  <SelectTrigger className="border-green-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">Tags</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Enter tag"
                    maxLength={20}
                    className="flex-1 border-green-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <Button type="button" onClick={addTag} className="bg-green-600 text-white hover:bg-green-700">
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newForum.tags.map((tag, index) => (
                    <div key={index} className="bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center space-x-2">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleTagRemove(index)}
                        className="text-red-500 hover:text-red-600 focus:outline-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
          <div className="flex justify-end space-x-2">
            {currentStep > 0 && (
              <Button type="button" onClick={handlePrevious} className="bg-gray-300 text-gray-700 hover:bg-gray-400">
                Previous
              </Button>
            )}
            <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">
              {currentStep === steps.length - 1 ? "Submit" : "Next"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateChannelModal;

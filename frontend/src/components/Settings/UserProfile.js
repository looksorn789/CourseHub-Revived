import { useState, useEffect, useRef } from 'react';
import Button from "../ui/Button";
import { Check, Pencil, X, ImagePlus } from "lucide-react";
import { User, Calendar as CalendarIcon, GraduationCap, Award, Users, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Textarea from "../ui/Textarea";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/Popover";
import Calendar from "../ui/Calendar";
import { format } from "date-fns";
import Accordion from "../ui/Accordion";
import { cn } from "../../lib/utils";
import { avatarDataUrl, DEFAULT_AVATAR_STYLE } from "../../utils/avatarUtils";
import AvatarPicker from "../Profile/AvatarPicker";
import { getUserProfile, saveUserProfile } from "../../services/profileService";

function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
      school: '',
      major: '',
      graduationDate: null,
      gpa: '',
      interests: [],
      awards: [],
      clubs: [],
      certifications: [],
      avatar: null,
    },
    username: '',
  });
  const [newItem, setNewItem] = useState({ interests: '', awards: '', clubs: '', certifications: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // avatarConfig: what's picked right now; savedAvatar: what's in the database
  // (restored on Cancel).
  const [avatarConfig, setAvatarConfig] = useState(null);
  const [savedAvatar, setSavedAvatar] = useState({ config: null, url: null });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await getUserProfile();
        if (data) {
          const normalizedData = {
            profile: {
              firstName: data.profile.first_name || '',
              lastName: data.profile.last_name || '',
              email: data.email || '',
              bio: data.profile.bio || '',
              school: data.profile.school || '',
              major: data.profile.major || '',
              graduationDate: data.profile.graduation_date || null,
              gpa: data.profile.gpa || '',
              interests: data.profile.interests || [],
              awards: data.profile.awards || [],
              clubs: data.profile.clubs || [],
              certifications: data.profile.certifications || [],
            },
            username: data.username || '',
          };
  
          if (data.profile.avatar_config) {
            const { style, seed } = data.profile.avatar_config;
            const url = avatarDataUrl({ style, seed }, data.username);
            normalizedData.profile.avatar = url;
            setAvatarConfig({ style, seed });
            setSavedAvatar({ config: { style, seed }, url });
          }
  
          setUserData(normalizedData);
        } else {
          setError(error || 'Failed to load user data.');
        }
      } catch (err) {
        setError('An error occurred while fetching user data.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, []);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setAvatarConfig(savedAvatar.config);
    setUserData((prev) => ({
      ...prev,
      profile: { ...prev.profile, avatar: savedAvatar.url },
    }));
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
  
      const updatedData = {
        first_name: userData.profile.firstName,
        last_name: userData.profile.lastName,
        school: userData.profile.school,
        major: userData.profile.major,
        graduation_date: userData.profile.graduationDate,
        gpa: userData.profile.gpa,
        interests: userData.profile.interests,
        awards: userData.profile.awards,
        clubs: userData.profile.clubs,
        certifications: userData.profile.certifications,
        bio: userData.profile.bio,
        avatar_config: avatarConfig || {
          style: DEFAULT_AVATAR_STYLE,
          seed: userData.username || "default-seed",
        },
      };
  
      const { success, error } = await saveUserProfile(updatedData, userData.profile.email, userData.username);
  
      if (success) {
        const savedConfig = updatedData.avatar_config;
        const savedUrl = avatarDataUrl(savedConfig, userData.username);
        setAvatarConfig(savedConfig);
        setSavedAvatar({ config: savedConfig, url: savedUrl });
        setUserData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            ...updatedData,
            avatar: savedUrl,
          },
        }));
        setIsEditing(false);
        setError(null);
      } else {
        setError(error || "Failed to save changes. Please try again.");
      }
    } catch (err) {
      console.error("An error occurred while saving profile:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };  

  const handleChange = (field, value) => {
    if (field === 'graduationDate' && value instanceof Date) {
      value = value.toISOString();
    }
    setUserData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  const handleAddItem = (field) => {
    if (newItem[field].trim()) {
      setUserData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [field]: [...(prev.profile[field] || []), newItem[field].trim()],
        },
      }));
      setNewItem((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleRemoveItem = (field, index) => {
    setUserData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: prev.profile[field].filter((_, i) => i !== index),
      },
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Uploaded photos aren't stored yet; this only previews it.
        handleChange('avatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = ({ style, seed, url }) => {
    setAvatarConfig({ style, seed });
    setUserData((prev) => ({ ...prev, profile: { ...prev.profile, avatar: url } }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="w-full px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          {!isEditing ? (
            <Button onClick={handleEdit} className="flex items-center bg-green-600 hover:bg-green-700 text-white">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="flex-shrink-0">
                <div className="relative group">
                <Avatar className={cn(
                  "w-32 h-32 transition-all duration-300 ease-in-out",
                  userData.profile?.avatar && "ring-4 ring-green-500 ring-offset-4"
                )}>
                  {userData.profile?.avatar ? (
                    <AvatarImage src={userData.profile.avatar} alt="Profile picture" />
                  ) : (
                    <AvatarFallback>
                      {userData.profile.firstName.charAt(0)}
                      {userData.profile.lastName.charAt(0)}
                    </AvatarFallback>
                  )}
                    {isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <label
                          htmlFor="avatar-upload"
                          className="cursor-pointer p-2 bg-green-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300"
                        >
                          <ImagePlus className="w-8 h-8 text-white" />
                          <span className="sr-only">Upload profile picture</span>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          onChange={handleAvatarChange}
                          accept="image/*"
                          ref={fileInputRef}
                        />
                      </div>
                    )}
                  </Avatar>
                </div>
              </div>
              {isEditing && (
                <div className="w-full min-w-0 flex-grow">
                  <p className="text-sm text-gray-500 mb-4">Upload a photo or choose an avatar</p>
                  <AvatarPicker value={avatarConfig} onSelect={handleAvatarSelect} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                {userData.profile ? (
                  <Input
                    id="firstName"
                    value={userData.profile.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <Input
                    id="firstName"
                    value=""
                    disabled
                    className="mt-1 border-green-200 bg-gray-100"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                {userData.profile ? (
                  <Input
                    id="lastName"
                    value={userData.profile.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <Input
                    id="lastName"
                    value=""
                    disabled
                    className="mt-1 border-green-200 bg-gray-100"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userData.profile?.email || ""}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={userData.profile?.bio || ""}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={userData.profile?.school || ""} 
                    onChange={(e) => handleChange('school', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={userData.profile?.major || ""}
                    onChange={(e) => handleChange('major', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="graduationDate">Expected Graduation Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-green-200 focus:ring-green-500 focus:border-green-500",
                          !userData.profile?.graduationDate && "text-muted-foreground"
                        )}
                        disabled={!isEditing}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {userData.profile?.graduationDate
                          ? format(new Date(userData.profile.graduationDate), "PPP")
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          userData.profile?.graduationDate
                            ? new Date(userData.profile.graduationDate)
                            : undefined
                        }
                        onSelect={(date) => handleChange('graduationDate', date)}
                        disabled={!isEditing}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    value={userData.profile?.gpa || ""}
                    onChange={(e) => handleChange('gpa', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Interests and Achievements</CardTitle>
            </CardHeader>
            <CardContent>
            <Accordion.Root type="single" collapsible className="w-full">
                <Accordion.Item value="interests">
                <Accordion.Trigger>
                    <div className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Interests
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                  {isEditing && (
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add an interest"
                        value={newItem.interests}
                        onChange={(e) => setNewItem({ ...newItem, interests: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddItem('interests');
                          }
                        }}
                        className="flex-grow border-green-200 focus:ring-green-500 focus:border-green-500"
                      />
                      <Button
                        onClick={() => handleAddItem('interests')}
                        disabled={!newItem.interests.trim()}
                        className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(userData.profile?.interests || []).map((interest, index) => (
                      <div
                        key={index}
                        onClick={() => isEditing && handleRemoveItem('interests', index)}
                        className="relative inline-flex items-center text-sm py-1 pl-2 pr-6 bg-green-100 text-green-800 rounded-lg cursor-pointer transition-all hover:bg-red-100 hover:text-red-600 group"
                      >
                        <span>{interest}</span>
                        {isEditing && (
                          <span className="absolute right-2 inset-y-0 flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <X className="h-4 w-4 font-bold" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="awards">
                <Accordion.Trigger>
                    <div className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Awards
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                  {isEditing && (
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add an award"
                        value={newItem.awards}
                        onChange={(e) => setNewItem({ ...newItem, awards: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddItem('awards');
                          }
                        }}
                        className="flex-grow border-green-200 focus:ring-green-500 focus:border-green-500"
                      />
                      <Button
                        onClick={() => handleAddItem('awards')}
                        disabled={!newItem.awards.trim()}
                        className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(userData.profile?.awards || []).map((award, index) => (
                      <div
                        key={index}
                        onClick={() => isEditing && handleRemoveItem('awards', index)}
                        className="relative inline-flex items-center text-sm py-1 pl-2 pr-6 bg-green-100 text-green-800 rounded-lg cursor-pointer transition-all hover:bg-red-100 hover:text-red-600 group"
                      >
                        <Star className="inline-block h-3 w-3 text-yellow-500 mr-1" />
                        <span>{award}</span>
                        {isEditing && (
                          <span className="absolute right-2 inset-y-0 flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <X className="h-4 w-4 font-bold" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="clubs">
                <Accordion.Trigger>
                    <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Clubs & Activities
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                  {isEditing && (
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add a club or activity"
                        value={newItem.clubs}
                        onChange={(e) => setNewItem({ ...newItem, clubs: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddItem('clubs');
                          }
                        }}
                        className="flex-grow border-green-200 focus:ring-green-500 focus:border-green-500"
                      />
                      <Button
                        onClick={() => handleAddItem('clubs')}
                        disabled={!newItem.clubs.trim()}
                        className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(userData.profile?.clubs || []).map((club, index) => (
                      <div
                        key={index}
                        onClick={() => isEditing && handleRemoveItem('clubs', index)}
                        className="relative inline-flex items-center text-sm py-1 pl-2 pr-6 bg-green-100 text-green-800 rounded-lg cursor-pointer transition-all hover:bg-red-100 hover:text-red-600 group"
                      >
                        <span>{club}</span>
                        {isEditing && (
                          <span className="absolute right-2 inset-y-0 flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <X className="h-4 w-4 font-bold" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="certifications">
                <Accordion.Trigger>
                    <div className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Certifications
                    </div>
                </Accordion.Trigger>
                <Accordion.Content>
                  {isEditing && (
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add a certification"
                        value={newItem.certifications}
                        onChange={(e) => setNewItem({ ...newItem, certifications: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddItem('certifications');
                          }
                        }}
                        className="flex-grow border-green-200 focus:ring-green-500 focus:border-green-500"
                      />
                      <Button
                        onClick={() => handleAddItem('certifications')}
                        disabled={!newItem.certifications.trim()}
                        className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(userData.profile?.certifications || []).map((cert, index) => (
                      <div
                        key={index}
                        onClick={() => isEditing && handleRemoveItem('certifications', index)}
                        className="relative inline-flex items-center text-sm py-1 pl-2 pr-6 bg-green-100 text-green-800 rounded-lg cursor-pointer transition-all hover:bg-red-100 hover:text-red-600 group"
                      >
                        <BookOpen className="inline-block h-3 w-3 text-blue-500 mr-1" />
                        <span>{cert}</span>
                        {isEditing && (
                          <span className="absolute right-2 inset-y-0 flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <X className="h-4 w-4 font-bold" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
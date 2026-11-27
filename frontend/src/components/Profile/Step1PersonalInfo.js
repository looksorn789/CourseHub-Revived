import React, { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Textarea from "../ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { cn } from "../../lib/utils";
import { ImagePlus, User } from "lucide-react";
import AvatarPicker from "./AvatarPicker";

function Step1PersonalInfo({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  bio,
  setBio,
  avatar,
  setAvatar,
  avatarConfig,
  setAvatarConfig,
}) {
  const [customAvatar, setCustomAvatar] = useState(null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(file);
        setAvatar(reader.result);
        // Uploaded photos aren't stored yet; fall back to the default avatar.
        setAvatarConfig?.(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = ({ style, seed, url }) => {
    setAvatar(url);
    setCustomAvatar(null);
    setAvatarConfig?.({ style, seed });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar Preview and Upload */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <Avatar
                  className={cn(
                    "w-32 h-32 transition-all duration-300 ease-in-out",
                    (avatar || customAvatar) &&
                      "ring-4 ring-green-500 ring-offset-4",
                  )}
                >
                  {avatar ? (
                    <AvatarImage src={avatar} alt="Profile picture" />
                  ) : (
                    <AvatarFallback>
                      <User className="w-16 h-16 text-gray-400" />
                    </AvatarFallback>
                  )}
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
                </Avatar>
              </div>
            </div>
            {/* Avatar Selection */}
            <div className="w-full min-w-0 flex-grow">
              <p className="text-sm text-gray-500 mb-4">
                Upload a photo or choose an avatar
              </p>
              <AvatarPicker
                value={avatarConfig}
                onSelect={handleAvatarSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Personal Information Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First Name
          </Label>
          <Input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <Label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name
          </Label>
          <Input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
      <div>
        <Label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700"
        >
          Bio
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
          placeholder="Write your bio here e.g. your hobbies, interests ETC"
        />
      </div>
    </div>
  );
}

export default Step1PersonalInfo;

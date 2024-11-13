import React, { useState, useEffect } from "react";
import  {Link} from 'react-router-dom';
import { getUserProfile, saveUserProfile } from "../../services/profileService";
import { generateAvatarSvg } from "../../utils/avatarUtils";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import Calendar from "../ui/Calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

function AccountSettings() {
  const [profile, setProfile] = useState(null);
  const [initialProfile, setInitialProfile] = useState(null); // To store original values
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [school, setSchool] = useState("");
  const [graduationDate, setGraduationDate] = useState(null);
  const [gpa, setGpa] = useState("");
  const [major, setMajor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await getUserProfile();
      if (data) {
        const userProfile = data.profile || {};
        setProfile(userProfile);
        setInitialProfile(data); // Store original profile data
        setFirstName(userProfile.first_name || "");
        setLastName(userProfile.last_name || "");
        setEmail(data.email || "");
        setUsername(data.username || "");
        setSchool(userProfile.school || "");
        setGraduationDate(userProfile.graduation_date ? new Date(userProfile.graduation_date) : null);
        setGpa(userProfile.gpa || "");
        setMajor(userProfile.major || "");

        // Generate avatar if `avatar_config` exists
        if (userProfile.avatar_config) {
          const { style, seed } = userProfile.avatar_config;
          const svg = generateAvatarSvg(style, seed);
          setAvatarUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        }
      } else if (error) {
        console.error("Failed to load profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const updatedProfile = {
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      school,
      graduation_date: graduationDate ? graduationDate.toISOString() : null,
      gpa,
      major,
    };

    const { success, error } = await saveUserProfile(updatedProfile, email, username);
    if (success) {
      setProfile((prevProfile) => ({
        ...prevProfile,
        ...updatedProfile,
      }));
      setInitialProfile({ ...profile, ...updatedProfile }); // Update initial state with new values
      setIsEditing(false);
    } else {
      console.error("Failed to save profile:", error);
    }
  };

  const handleCancel = () => {
    // Reset fields to initial values
    if (initialProfile) {
      const userProfile = initialProfile.profile || {};
      setFirstName(userProfile.first_name || "");
      setLastName(userProfile.last_name || "");
      setEmail(initialProfile.email || "");
      setUsername(initialProfile.username || "");
      setSchool(userProfile.school || "");
      setGraduationDate(userProfile.graduation_date ? new Date(userProfile.graduation_date) : null);
      setGpa(userProfile.gpa || "");
      setMajor(userProfile.major || "");
    }
    setIsEditing(false); // Exit editing mode
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
    <h1 className="text-3xl font-bold mb-6">My Profile</h1>

    {/* Profile Card */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <Avatar className="w-24 h-24 rounded-full bg-gray-200 mr-4">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="User Avatar" />
          ) : (
            <AvatarFallback>
              {firstName.charAt(0).toUpperCase()}
              {lastName.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{`${firstName} ${lastName}`}</h2>
        </div>
      </div>
      <Link to="/profile">
        <Button 
          className="bg-blue-500 text-white px-4 py-2"
        >
          View More
        </Button>
      </Link>
    </div>

    {/* Personal Information */}
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        {isEditing ? (
          <div className="flex space-x-2">
            <Button className="bg-green-600 text-white px-4 py-2" onClick={handleSave}>
              Save
            </Button>
            <Button className="bg-red-500 text-white px-4 py-2" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="bg-blue-500 text-white px-4 py-2"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )
      }
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">First Name</p>
          {isEditing ? (
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">{firstName}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Name</p>
          {isEditing ? (
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">{lastName}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Email Address</p>
          {isEditing ? (
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">{email}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Username</p>
          {isEditing ? (
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">@{username}</p>
          )}
        </div>
      </div>
    </div>

    {/* School Information */}
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">School Information</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">School</p>
          {isEditing ? (
            <Input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">{school}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Expected Graduation Date</p>
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal mt-1 border-green-200 ${
                    !graduationDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {graduationDate ? (
                    format(graduationDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={graduationDate}
                  onSelect={setGraduationDate}
                  initialFocus
                  className="rounded-md border-green-200"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <p className="text-lg font-medium">
              {graduationDate ? format(graduationDate, "PPP") : "N/A"}
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">GPA</p>
          {isEditing ? (
            <Input
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">{gpa}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">Major</p>
          {isEditing ? (
            <Input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full"
            />
          ) : (
            <p className="text-lg font-medium">{major}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);
}

export default AccountSettings;

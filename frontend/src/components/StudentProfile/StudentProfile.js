import React, { useState } from "react";
import Step1PersonalInfo from "./Step1PersonalInfo";
import Step2Education from "./Step2Education";
import Step3Interests from "./Step3Interests";
import Step4Achievements from "./Step4Achievements";
import { steps } from "../../constants/steps";
import { Card, CardContent } from "../ui/Card";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../ui/Button";
import CustomLoader from "../ui/CustomLoader";
import { createProfile } from "../../services/profileService";
import { useNavigate } from "react-router-dom";

function StudentProfile() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [graduationDate, setGraduationDate] = useState(null);
  const [gpa, setGpa] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [awards, setAwards] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [avatarStyle] = useState("adventurer");
  const [avatarOptions] = useState({
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
  });

  const navigate = useNavigate();

  const handleNavigation = (direction) => {
    if (direction === "next") {
      setStep(step + 1);
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step !== steps.length) {
      return;
    }

    if (!firstName || !lastName || !school || !major) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const profileData = {
        firstName,
        lastName,
        bio,
        school,
        major,
        graduationDate: graduationDate ? graduationDate.toISOString() : null,
        gpa,
        selectedTopics,
        awards,
        clubs,
        certifications,
        avatarStyle,
        avatarOptions,
      };

      console.log("Submitting profile data:", profileData);

      const { data, error } = await createProfile(profileData);

      if (error) {
        throw new Error(error);
      }

      console.log("Profile created successfully:", data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Profile creation failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Step1PersonalInfo
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            bio={bio}
            setBio={setBio}
            avatar={avatar}
            setAvatar={setAvatar}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <Step2Education
            school={school}
            setSchool={setSchool}
            major={major}
            setMajor={setMajor}
            graduationDate={graduationDate}
            setGraduationDate={setGraduationDate}
            gpa={gpa}
            setGpa={setGpa}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <Step3Interests
            selectedTopics={selectedTopics}
            setSelectedTopics={setSelectedTopics}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <Step4Achievements
            awards={awards}
            setAwards={setAwards}
            clubs={clubs}
            setClubs={setClubs}
            certifications={certifications}
            setCertifications={setCertifications}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <BookOpen className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Student Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Help us personalize your student experience
          </p>
        </div>

        {isSubmitting ? (
          <CustomLoader />
        ) : (
          <Card className="bg-white shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              {/* Progress indicators */}
              <div className="flex justify-between items-center mb-8">
                {steps.map((s) => (
                  <div
                    key={s.number}
                    className={`flex flex-col items-center ${
                      step === s.number ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 ${
                        step === s.number ? "bg-green-100" : "bg-gray-100"
                      }`}
                    >
                      <s.icon className="h-6 w-6" />
                    </div>
                    <span className="mt-2 text-xs font-medium">{s.title}</span>
                  </div>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Step content */}
              <div className="space-y-6">
                {renderStepContent()}

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  {step > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleNavigation("prev")}
                      variant="outline"
                      className="flex items-center border-green-600 text-green-600 hover:bg-green-50"
                      disabled={isSubmitting}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}

                  {step < steps.length ? (
                    <Button
                      type="button"
                      onClick={() => handleNavigation("next")}
                      className="ml-auto flex items-center bg-green-600 hover:bg-green-700 text-white"
                      disabled={isSubmitting}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <Button
                        type="submit"
                        className="ml-auto bg-green-600 hover:bg-green-700 text-white"
                        disabled={isSubmitting}
                      >
                        Complete Profile
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;

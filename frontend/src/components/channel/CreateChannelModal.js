import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Check, Loader2 } from "lucide-react";
import Button from "../ui/Button";
import Label from "../ui/Label";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Dialog, DialogContent, DialogTitle } from "../ui/Dialog";
import { forumService } from "../../services/forumService";
import { CHANNEL_CATEGORIES, CREATION_STEPS } from "./constants";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function CreateChannelModal({ onCreated }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLastStep = currentStep === CREATION_STEPS.length - 1;

  const reset = () => {
    setCurrentStep(0);
    setChannelName("");
    setDescription("");
    setCategory("");
    setError("");
  };

  const handleOpenChange = (open) => {
    if (isSubmitting) return;
    setIsOpen(open);
    if (!open) reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isLastStep) {
      setCurrentStep((s) => s + 1);
      return;
    }
    if (!category) {
      setError("Pick a category for your channel.");
      return;
    }

    setIsSubmitting(true);
    const { data, error: createError } = await forumService.createForum({
      name: channelName.trim(),
      description: description.trim(),
      category,
      tags: [category.toLowerCase()],
      visibility: "public",
    });
    setIsSubmitting(false);

    if (createError || !data?.forum) {
      setError(createError || "Couldn't create the channel. Please try again.");
      return;
    }

    setIsOpen(false);
    reset();
    onCreated?.(data.forum);
    if (data.forum.slug) navigate(`/channel/${data.forum.slug}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white h-10 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105"
        onClick={() => setIsOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">Create Channel</span>
      </Button>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] bg-white">
        <DialogTitle className="text-2xl font-bold text-green-600">
          Create New Channel
        </DialogTitle>
        <p className="text-gray-500">You'll be the channel's owner and can edit it later.</p>

        {/* Steps */}
        <div className="mb-4">
          <div className="flex justify-around items-start">
            {CREATION_STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2",
                    index <= currentStep ? "bg-green-600" : "bg-gray-300",
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
              style={{ width: `${((currentStep + 1) / CREATION_STEPS.length) * 100}%` }}
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
                  placeholder="e.g. CS 101 Study Group"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z0-9 \-]+"
                  title="Letters, numbers, spaces and hyphens only"
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500">3–50 characters: letters, numbers, spaces, hyphens.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will people discuss here?"
                  required
                  minLength={10}
                  maxLength={500}
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500">{description.trim().length}/500 (at least 10)</p>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setError("");
                  setCurrentStep((s) => s - 1);
                }}
                className="bg-white text-green-600 border border-green-600 hover:bg-green-50"
              >
                Previous
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white ml-auto"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLastStep ? "Create Channel" : "Next"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Must match ForumCategory values in backend/models/forum.py.
export const CHANNEL_CATEGORIES = [
  "Study Group",
  "General",
  "Homework Help",
  "Exam Prep",
  "Q & A",
  "Project",
  "Career",
];

// Kept for older imports.
export const CHANNEL_TAGS = CHANNEL_CATEGORIES;

export const CREATION_STEPS = [
  { title: "Basics", description: "Name and description" },
  { title: "Category", description: "What the channel is for" },
  { title: "Images", description: "Icon and banner (optional)" },
];

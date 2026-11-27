// Must match REACTION_TYPES in backend/models/post_reaction.py.
export const POST_REACTIONS = [
  { type: "thumbs_up", emoji: "👍", label: "Like" },
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "laugh", emoji: "😂", label: "Haha" },
  { type: "smile", emoji: "😊", label: "Smile" },
  { type: "cry", emoji: "😢", label: "Sad" },
  { type: "thumbs_down", emoji: "👎", label: "Dislike" },
];

export const REACTION_BY_TYPE = Object.fromEntries(POST_REACTIONS.map((r) => [r.type, r]));

// Default when the react button is simply clicked.
export const DEFAULT_REACTION = "heart";

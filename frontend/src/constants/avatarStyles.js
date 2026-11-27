/**
 * Avatar categories shown in the AvatarPicker, by DiceBear style id
 * (the export name in @dicebear/collection, e.g. "bigSmile").
 *
 * To add a category: add one entry here. `label` is optional; it defaults to
 * the id split into words ("funEmoji" -> "Fun Emoji").
 *
 * Styles in @dicebear/collection that aren't listed still show up under
 * "More", so upgrading the package never hides new styles.
 */
export const AVATAR_GROUPS = ["People", "Characters", "Abstract", "More"];

export const AVATAR_STYLES = [
  // People
  { id: "adventurer", group: "People" },
  { id: "adventurerNeutral", group: "People" },
  { id: "avataaars", group: "People" },
  { id: "avataaarsNeutral", group: "People" },
  { id: "bigEars", group: "People" },
  { id: "bigEarsNeutral", group: "People" },
  { id: "dylan", group: "People" },
  { id: "lorelei", group: "People" },
  { id: "loreleiNeutral", group: "People" },
  { id: "micah", group: "People" },
  { id: "miniavs", group: "People" },
  { id: "notionists", group: "People" },
  { id: "notionistsNeutral", group: "People" },
  { id: "openPeeps", group: "People" },
  { id: "personas", group: "People" },

  // Characters
  { id: "bigSmile", group: "Characters" },
  { id: "bottts", label: "Robots", group: "Characters" },
  { id: "botttsNeutral", label: "Robots Neutral", group: "Characters" },
  { id: "croodles", group: "Characters" },
  { id: "croodlesNeutral", group: "Characters" },
  { id: "funEmoji", group: "Characters" },
  { id: "pixelArt", group: "Characters" },
  { id: "pixelArtNeutral", group: "Characters" },
  { id: "thumbs", group: "Characters" },

  // Abstract
  { id: "glass", group: "Abstract" },
  { id: "icons", group: "Abstract" },
  { id: "identicon", group: "Abstract" },
  { id: "initials", group: "Abstract" },
  { id: "rings", group: "Abstract" },
  { id: "shapes", group: "Abstract" },
];

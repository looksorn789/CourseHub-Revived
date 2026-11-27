import * as AvatarCollection from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { AVATAR_STYLES } from "../constants/avatarStyles";

/**
 * Generates an avatar SVG string.
 *
 * @param {string} styleName - The name of the avatar style.
 * @param {string} seed - The seed for the avatar.
 * @param {object} [options={}] - Additional options for the avatar.
 * @returns {string} - The avatar SVG string.
 */
export const generateAvatarSvg = (styleName, seed, options = {}) => {
  const style = AvatarCollection[toStyleKey(styleName)];
  if (!style) {
    console.error(`Avatar style "${styleName}" not found.`);
    return "";
  }
  const avatar = createAvatar(style, { seed, ...options });
  return avatar.toString();
};

export const DEFAULT_AVATAR_STYLE = "adventurer";

const labelFromId = (id) =>
  id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/**
 * The avatar categories to offer: the curated list in constants/avatarStyles,
 * minus any id the installed package doesn't have, plus any installed style
 * not listed yet (grouped under "More").
 *
 * @returns {{id: string, label: string, group: string}[]}
 */
export const getAvatarCategories = () => {
  const installed = new Set(Object.keys(AvatarCollection));
  const listed = AVATAR_STYLES.filter((s) => installed.has(s.id)).map((s) => ({
    ...s,
    label: s.label || labelFromId(s.id),
  }));
  const listedIds = new Set(listed.map((s) => s.id));
  const extra = [...installed]
    .filter((id) => !listedIds.has(id))
    .map((id) => ({ id, label: labelFromId(id), group: "More" }));
  return [...listed, ...extra];
};

// Accepts collection keys ("bigSmile") and DiceBear URL names ("big-smile").
const toStyleKey = (name = "") =>
  name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Builds an <img>-ready data URL from a profile's saved avatar_config.
 * Use this everywhere an avatar is shown so every page renders the same image.
 *
 * @param {{style?: string, seed?: string, options?: object}} [avatarConfig]
 * @param {string} [fallbackSeed] - Used when the config has no seed (e.g. username).
 * @returns {string} - A data:image/svg+xml URL.
 */
export const avatarDataUrl = (avatarConfig, fallbackSeed = "coursehub") => {
  const seed = avatarConfig?.seed || fallbackSeed;
  const options = avatarConfig?.options || {};
  const styleKey = AvatarCollection[toStyleKey(avatarConfig?.style)]
    ? avatarConfig.style
    : DEFAULT_AVATAR_STYLE;
  const svg = generateAvatarSvg(styleKey, seed, options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Returns the available avatar styles.
 *
 * @returns {string[]} - An array of available style names.
 */
export const getAvailableStyles = () => {
  return Object.keys(AvatarCollection);
};

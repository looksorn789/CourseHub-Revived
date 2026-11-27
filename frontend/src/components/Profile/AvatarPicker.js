import React, { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  avatarDataUrl,
  getAvatarCategories,
} from "../../utils/avatarUtils";

const ALL = "All";
const PREVIEW_SEED = "coursehub-preview";

// Seeds are "avatar-0", "avatar-1", ... (already saved on existing profiles).
const seedAt = (i) => `avatar-${i}`;
const indexOfSeed = (seed) => {
  const m = /^avatar-(\d+)$/.exec(seed || "");
  return m ? Number(m[1]) : -1;
};

// Generated SVGs are cached so "Load more" and switching back to a category
// only render avatars that haven't been drawn yet.
const urlCache = new Map();
const cachedUrl = (style, seed) => {
  const key = `${style}:${seed}`;
  if (!urlCache.has(key)) {
    if (urlCache.size > 3000) urlCache.clear();
    urlCache.set(key, avatarDataUrl({ style, seed }));
  }
  return urlCache.get(key);
};

/**
 * Category selector + paginated avatar grid. Shared by profile setup and
 * Settings.
 *
 * @param {{style: string, seed: string} | null} value - The saved/selected avatar.
 * @param {(avatar: {style: string, seed: string, url: string}) => void} onSelect
 * @param {number} [pageSize=15]
 */
export default function AvatarPicker({ value, onSelect, pageSize = 15 }) {
  const categories = useMemo(getAvatarCategories, []);
  const groups = useMemo(
    () => [ALL, ...new Set(categories.map((c) => c.group))],
    [categories],
  );

  // Enough pages to show the given avatar for a category (or just the first page).
  const pagesFor = (style) => {
    const idx = value?.style === style ? indexOfSeed(value.seed) : -1;
    return Math.max(1, Math.ceil((idx + 1) / pageSize));
  };

  const initialStyle = categories.some((c) => c.id === value?.style)
    ? value.style
    : categories[0]?.id;

  // Category and page live in one state object so they always change together:
  // switching category can never keep the previous category's page count.
  const [view, setView] = useState(() => ({
    style: initialStyle,
    pages: pagesFor(initialStyle),
  }));
  const [group, setGroup] = useState(ALL);
  const [query, setQuery] = useState("");
  const gridRef = useRef(null);

  const visibleCategories = categories.filter(
    (c) =>
      (group === ALL || c.group === group) &&
      c.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const switchCategory = (style) => {
    if (style === view.style) return;
    setView({ style, pages: pagesFor(style) });
    if (gridRef.current) gridRef.current.scrollTop = 0;
  };

  const avatars = Array.from({ length: view.pages * pageSize }, (_, i) => {
    const seed = seedAt(i);
    return { seed, url: cachedUrl(view.style, seed) };
  });

  const currentLabel =
    categories.find((c) => c.id === view.style)?.label || view.style;

  return (
    <div className="space-y-3">
      {/* Group tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Avatar groups">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={group === g}
            onClick={() => setGroup(g)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              group === g
                ? "bg-green-600 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search avatar styles..."
          aria-label="Search avatar styles"
          className="h-9 w-full rounded-md border border-green-200 bg-white pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* Category chips */}
      {visibleCategories.length ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {visibleCategories.map((c) => {
            const active = c.id === view.style;
            const holdsSelection = c.id === value?.style;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => switchCategory(c.id)}
                className={cn(
                  "relative flex shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 text-xs transition-all",
                  active
                    ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50/50",
                )}
              >
                <img
                  src={cachedUrl(c.id, PREVIEW_SEED)}
                  alt=""
                  className="h-9 w-9 rounded-full bg-gray-50"
                />
                <span className="max-w-[5.5rem] truncate">{c.label}</span>
                {holdsSelection && (
                  <span
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500"
                    title="Your current avatar is in this category"
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="py-3 text-center text-sm text-gray-500">
          No avatar styles match "{query}".
        </p>
      )}

      {/* Avatar grid */}
      <div
        ref={gridRef}
        className="h-56 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 p-3"
      >
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {avatars.map(({ seed, url }) => {
            const isSelected =
              value?.style === view.style && value?.seed === seed;
            return (
              <button
                key={`${view.style}:${seed}`}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${currentLabel} avatar ${indexOfSeed(seed) + 1}`}
                onClick={() => onSelect({ style: view.style, seed, url })}
                className={cn(
                  "relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white transition-all duration-200 hover:scale-110",
                  isSelected
                    ? "ring-2 ring-green-500 ring-offset-2"
                    : "hover:ring-2 hover:ring-green-300 hover:ring-offset-2",
                )}
              >
                <img src={url} alt="" className="h-12 w-12 rounded-full" />
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-green-500/50">
                    <Check className="h-6 w-6 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {currentLabel} · {avatars.length} shown
        </span>
        <button
          type="button"
          onClick={() => setView((v) => ({ ...v, pages: v.pages + 1 }))}
          className="inline-flex items-center gap-1 rounded-full border border-green-400 px-3 py-1.5 font-medium text-green-600 transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        >
          <ChevronDown className="h-4 w-4" />
          Load more
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Hash, Loader2, Search, Users } from "lucide-react";
import SearchService from "../../services/searchService";
import { fetchCached, getCached } from "../../utils/queryCache";
import { avatarDataUrl } from "../../utils/avatarUtils";

const fullName = (p) =>
  `${p.profile?.first_name || ""} ${p.profile?.last_name || ""}`.trim() || p.username;

function itemsFor(data, isQuery) {
  if (!data) return [];
  const people = (data.people || []).map((p) => ({
    key: `u-${p._id}`,
    section: isQuery ? "People" : "New people",
    to: `/profile/${p.username}`,
    title: fullName(p),
    subtitle: [`@${p.username}`, p.profile?.major].filter(Boolean).join(" · "),
    image: avatarDataUrl(p.profile?.avatar_config, p.username),
    round: true,
  }));
  const channels = (data.channels || []).map((c) => ({
    key: `c-${c._id}`,
    section: "Channels",
    to: `/channel/${c.slug}`,
    title: c.name,
    subtitle: [c.category, `${c.member_count || 0} member${c.member_count === 1 ? "" : "s"}`]
      .filter(Boolean)
      .join(" · "),
    image: c.avatar_url,
    initial: c.name?.[0]?.toUpperCase(),
  }));
  const posts = (data.posts || []).map((p) => ({
    key: `p-${p._id}`,
    section: "Posts",
    to: p.forum?.slug ? `/channel/${p.forum.slug}?post=${p._id}` : null,
    title: p.title,
    subtitle: [p.forum?.name && `in ${p.forum.name}`, p.author && `by ${fullName(p.author)}`]
      .filter(Boolean)
      .join(" · "),
    icon: FileText,
  }));
  return [...people, ...channels, ...posts].filter((i) => i.to);
}

const SECTION_ICONS = { People: Users, "New people": Users, Channels: Hash, Posts: FileText };

/**
 * Global search. Empty box: newest people + channels. Typing (2+ chars):
 * people, channels and posts.
 */
export default function SearchBar({ onNavigate, className = "" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(() => getCached("search:suggestions") ?? null);
  const [suggestError, setSuggestError] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const requestId = useRef(0);
  const rootRef = useRef(null);

  const trimmed = query.trim();
  const isQuery = trimmed.length >= 2;

  // Reload suggestions every time the box opens (new people/channels show up,
  // and a failed load is retried); the previous result stays while loading.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setSuggestError(false);
    fetchCached("search:suggestions", () => SearchService.suggestions())
      .then((data) => !cancelled && setSuggestions(data))
      .catch(() => !cancelled && setSuggestError(true));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Debounced search; only the newest request may update results.
  useEffect(() => {
    if (!isQuery) {
      setResults(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const data = await SearchService.search(trimmed);
        if (id === requestId.current) setResults(data);
      } catch {
        if (id === requestId.current) setResults({ people: [], channels: [], posts: [] });
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed, isQuery]);

  // Close when clicking outside.
  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const items = useMemo(
    () => itemsFor(isQuery ? results : suggestions, isQuery),
    [isQuery, results, suggestions],
  );
  useEffect(() => setActive(0), [items]);

  const go = (item) => {
    setOpen(false);
    setQuery("");
    navigate(item.to);
    onNavigate?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    }
  };

  const waiting = isQuery ? loading && !results : !suggestions && !suggestError;
  let lastSection = null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        aria-label="Search CourseHub"
        placeholder="Search people, channels, posts"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-full border border-transparent bg-gray-100 pl-10 pr-9 text-sm focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
      )}

      {open && (
        <div
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-xl"
        >
          {waiting ? (
            <p className="px-4 py-3 text-sm text-gray-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              {isQuery
                ? `No results for "${trimmed}"`
                : suggestError
                  ? "Couldn't load suggestions. Type to search, or try again."
                  : "No people or channels yet. Type at least 2 letters to search posts too."}
            </p>
          ) : (
            items.map((item, index) => {
              const header = item.section !== lastSection ? item.section : null;
              lastSection = item.section;
              const SectionIcon = SECTION_ICONS[item.section];
              const ItemIcon = item.icon;
              return (
                <div key={item.key}>
                  {header && (
                    <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      <SectionIcon className="h-3 w-3" />
                      {header}
                    </p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                      index === active ? "bg-green-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className={`h-8 w-8 shrink-0 object-cover ${item.round ? "rounded-full" : "rounded-md"}`}
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-100 text-xs font-semibold text-green-700">
                        {ItemIcon ? <ItemIcon className="h-4 w-4" /> : item.initial || "#"}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-gray-500">{item.subtitle}</span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

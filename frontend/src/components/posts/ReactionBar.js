import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";
import PostService from "../../services/postService";
import { DEFAULT_REACTION, POST_REACTIONS, REACTION_BY_TYPE } from "../../constants/postReactions";

// Keeps every ReactionBar for the same post (card + full view) in sync.
const REACTION_EVENT = "coursehub:post-reaction";

// Latest reaction state per post this session, so a view opened later (e.g.
// the full post after reacting on its card) doesn't start from stale data.
// Keyed by signed-in user too, so switching accounts in a tab starts fresh.
const latestMap = new Map(); // "userId:postId" -> { counts, mine }
const who = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").user_id || "anon";
  } catch {
    return "anon";
  }
};
const latest = {
  get: (id) => latestMap.get(`${who()}:${id}`),
  has: (id) => latestMap.has(`${who()}:${id}`),
  set: (id, v) => latestMap.set(`${who()}:${id}`, v),
};

const positive = (counts) => Object.fromEntries(Object.entries(counts || {}).filter(([, n]) => n > 0));

/**
 * React to a post: hover (mouse) or tap React (touch) shows 6 reactions;
 * one reaction per account (picking another switches it, picking yours
 * again removes it). With a mouse, clicking the button reacts with a heart
 * or removes yours; on touch, tapping it only opens the emojis.
 */
export default function ReactionBar({ post, size = "sm" }) {
  const [counts, setCounts] = useState(() => latest.get(post.id)?.counts ?? positive(post.reactionCounts));
  const [mine, setMine] = useState(() => (latest.has(post.id) ? latest.get(post.id).mine : post.myReaction || null));
  // The server data we started from; only *newer* server data replaces state.
  // (Compared by value: some parents rebuild the post object every render.)
  const serverSig = `${post.id}|${JSON.stringify(positive(post.reactionCounts))}|${post.myReaction || ""}`;
  const seen = useRef(serverSig);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const hoverTimer = useRef(null);
  const rootRef = useRef(null);

  // New data for this post from the server (e.g. a background refresh).
  useEffect(() => {
    if (seen.current === serverSig) return;
    seen.current = serverSig;
    const fresh = { counts: positive(post.reactionCounts), mine: post.myReaction || null };
    latest.set(post.id, fresh);
    setCounts(fresh.counts);
    setMine(fresh.mine);
  }, [serverSig]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onChange = (e) => {
      if (e.detail.postId !== post.id) return;
      setCounts(e.detail.counts);
      setMine(e.detail.mine);
    };
    window.addEventListener(REACTION_EVENT, onChange);
    return () => window.removeEventListener(REACTION_EVENT, onChange);
  }, [post.id]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const apply = async (type) => {
    if (busy) return;
    const next = type === mine ? null : type;
    // Optimistic update (shared with other views of this post), rolled back
    // everywhere if the request fails.
    const publish = (state) => {
      latest.set(post.id, state);
      setCounts(state.counts);
      setMine(state.mine);
      window.dispatchEvent(new CustomEvent(REACTION_EVENT, { detail: { postId: post.id, ...state } }));
    };
    const before = { counts, mine };
    const optimistic = { ...counts };
    if (mine) optimistic[mine] = Math.max(0, (optimistic[mine] || 0) - 1);
    if (next) optimistic[next] = (optimistic[next] || 0) + 1;
    publish({ counts: positive(optimistic), mine: next });
    setOpen(false);
    setBusy(true);
    try {
      const res = next ? await PostService.react(post.id, next) : await PostService.unreact(post.id);
      publish({ counts: positive(res.reaction_counts), mine: res.my_reaction || null });
    } catch (err) {
      publish(before);
      toast.error(err.message || "Couldn't save your reaction");
    } finally {
      setBusy(false);
    }
  };

  // Phones/tablets have no hover: a tap on React opens the emojis, a tap on
  // an emoji reacts. Uses the real pointer type, not a media query.
  const lastPointer = useRef("mouse");
  const notePointer = (e) => {
    lastPointer.current = e.pointerType || "mouse";
  };
  const touch = () => lastPointer.current !== "mouse";
  const onEnter = (e) => {
    notePointer(e);
    if (e.pointerType === "mouse") show();
  };
  const onLeave = (e) => {
    if (e.pointerType === "mouse") hide();
  };
  const show = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 250);
  };
  const hide = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 300);
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const current = mine ? REACTION_BY_TYPE[mine] : null;
  const large = size === "lg";

  return (
    <div
      ref={rootRef}
      className="relative flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={notePointer}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <button
        type="button"
        aria-label={current ? `Your reaction: ${current.label}. Click to remove` : "React to this post"}
        aria-pressed={Boolean(current)}
        onClick={() => (touch() ? setOpen((o) => !o) : apply(mine || DEFAULT_REACTION))}
        className={`inline-flex items-center gap-1.5 rounded-full transition-colors ${
          large ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs"
        } ${current ? "bg-green-50 font-semibold text-green-800" : "text-gray-600 hover:bg-gray-100 hover:text-green-700"}`}
      >
        {current ? (
          <span className={large ? "text-lg leading-none" : "text-base leading-none"}>{current.emoji}</span>
        ) : (
          <Heart className={large ? "h-5 w-5" : "h-4 w-4"} />
        )}
        <span>{current ? current.label : "React"}</span>
      </button>

      {total > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500" title={top.map(([t, n]) => `${REACTION_BY_TYPE[t]?.label}: ${n}`).join(", ")}>
          <span className="flex -space-x-1">
            {top.map(([t]) => (
              <span key={t} className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-sm ring-1 ring-gray-100">
                {REACTION_BY_TYPE[t]?.emoji}
              </span>
            ))}
          </span>
          <span aria-label={`${total} reactions`}>{total}</span>
        </span>
      )}

      {open && (
        <div
          role="toolbar"
          aria-label="Choose a reaction"
          className="absolute bottom-full left-0 z-30 mb-2 flex items-center gap-1 rounded-full border border-gray-100 bg-white px-2 py-1.5 shadow-xl"
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
        >
          {POST_REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={r.label}
              aria-label={r.label}
              aria-pressed={mine === r.type}
              onClick={() => apply(r.type)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-2xl transition-transform hover:-translate-y-1 hover:scale-125 ${
                mine === r.type ? "bg-green-100" : ""
              }`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

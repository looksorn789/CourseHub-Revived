import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Check, Copy, FileText, Mail, MessageCircle, Search, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/Dialog";
import { useChat } from "../../context/ChatContext";
import SearchService from "../../services/searchService";
import { avatarDataUrl } from "../../utils/avatarUtils";
import { defaultShareMessage, postShareUrl } from "../../utils/share";
import { Avatar, myId, nameOf, titleOf, avatarOf } from "../chat/ChatPanel";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without the async clipboard API.
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

const openWindow = (url) => window.open(url, "_blank", "noopener,noreferrer,width=640,height=640");

// Brand marks as tiny inline SVGs (lucide has no brand icons).
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.828l-5.35-6.99L4.6 22H1.34l8.02-9.17L1 2h7l4.83 6.39L18.244 2Zm-1.197 18h1.86L7.04 4H5.06l11.987 16Z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

function Target({ label, onClick, className, children }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 text-xs text-gray-700">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${className}`}>{children}</span>
      {label}
    </button>
  );
}

/** Pick a chat (recent conversations or search people) to share into. */
function ChatPicker({ onPick, onBack }) {
  const { conversations } = useChat() || {};
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const me = myId();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setPeople([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await SearchService.search(q, 8);
        if (!cancelled) setPeople((data.people || []).filter((p) => p._id !== me));
      } catch {
        if (!cancelled) setPeople([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, me]);

  const recent = (conversations || []).slice(0, 8);
  const row = "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50";

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </button>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          aria-label="Search people to share with"
          className="h-10 w-full rounded-full bg-gray-100 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>
      <div className="max-h-72 overflow-y-auto">
        {query.trim().length >= 2 ? (
          people.length ? (
            people.map((p) => (
              <button key={p._id} type="button" className={row} onClick={() => onPick({ userId: p._id })}>
                <Avatar src={avatarDataUrl(p.profile?.avatar_config, p.username)} size="h-9 w-9" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{nameOf(p)}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {[`@${p.username}`, p.profile?.major].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="px-2 py-4 text-sm text-gray-500">No people found.</p>
          )
        ) : recent.length ? (
          <>
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Recent chats</p>
            {recent.map((c) => (
              <button key={c._id} type="button" className={row} onClick={() => onPick({ conversation: c })}>
                <Avatar src={avatarOf(c, me)} label={c.type === "group" ? null : titleOf(c, me)[0]} size="h-9 w-9" />
                <span className="truncate text-sm font-medium">{titleOf(c, me)}</span>
              </button>
            ))}
          </>
        ) : (
          <p className="px-2 py-4 text-sm text-gray-500">Search for someone to send this post to.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Share a post: copy link, email, send in a CourseHub chat (with a mini post
 * card), X, Facebook, Instagram, or the device share sheet.
 */
export default function ShareModal({ post, open, onOpenChange }) {
  const { pathname } = useLocation();
  const chat = useChat();
  const url = useMemo(() => (post ? postShareUrl(post, pathname) : ""), [post, pathname]);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("main");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && post) {
      setMessage(defaultShareMessage(post, url));
      setStep("main");
      setCopied(false);
    }
  }, [open, post, url]);

  if (!post) return null;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const close = () => onOpenChange(false);

  const copyLink = async () => {
    if (await copyText(url)) {
      setCopied(true);
      toast.success("Link copied");
    } else toast.error("Couldn't copy the link");
  };

  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(message)}`;
  };

  const shareX = () => openWindow(`https://x.com/intent/post?text=${encodeURIComponent(message)}`);

  const shareFacebook = async () => {
    // Facebook ignores prefilled text; copy the message so it can be pasted.
    await copyText(message);
    toast.info("Message copied. Paste it into your Facebook post.");
    openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: post.title, text: message, url });
      return true;
    } catch {
      return false;
    }
  };

  const shareInstagram = async () => {
    // Instagram has no web share link. Phones: system share sheet (includes
    // Instagram). Otherwise copy the message and open Instagram's inbox.
    if (canNativeShare && window.matchMedia("(pointer: coarse)").matches && (await nativeShare())) return;
    await copyText(message);
    toast.info("Message copied. Paste it into Instagram.");
    openWindow("https://www.instagram.com/direct/inbox/");
  };

  const sendToChat = (target) => {
    close();
    chat?.openPanel({ ...target, draft: { text: message, post } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-white sm:max-w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle className="text-xl font-bold text-gray-900">Share post</DialogTitle>
        <DialogDescription className="sr-only">Share this post by link, email, chat or social media</DialogDescription>

        {step === "chat" ? (
          <ChatPicker onPick={sendToChat} onBack={() => setStep("main")} />
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              {post.images?.[0] ? (
                <img src={post.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <FileText className="h-6 w-6" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-semibold text-gray-900">{post.title}</span>
                <span className="block truncate text-xs text-gray-500">
                  #{post.author?.channel} · by {post.author?.name}
                </span>
              </span>
            </div>

            {/* Link */}
            <div className="flex gap-2">
              <input
                readOnly
                value={url}
                aria-label="Post link"
                onFocus={(e) => e.target.select()}
                className="h-10 min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-10 shrink-0 items-center rounded-md bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Message */}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                aria-label="Share message"
                className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </label>

            {/* Targets */}
            <div className="grid grid-cols-3 gap-y-4 sm:grid-cols-6">
              <Target label="Chat" onClick={() => setStep("chat")} className="bg-green-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </Target>
              <Target label="Email" onClick={email} className="bg-gray-100 text-gray-800">
                <Mail className="h-5 w-5" />
              </Target>
              <Target label="X" onClick={shareX} className="bg-black text-white">
                <XIcon />
              </Target>
              <Target label="Facebook" onClick={shareFacebook} className="bg-[#1877F2] text-white">
                <FacebookIcon />
              </Target>
              <Target
                label="Instagram"
                onClick={shareInstagram}
                className="bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white"
              >
                <InstagramIcon />
              </Target>
              {canNativeShare && (
                <Target label="More" onClick={nativeShare} className="bg-gray-100 text-gray-800">
                  <Share2 className="h-5 w-5" />
                </Target>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNowStrict, format, isToday } from "date-fns";
import { ArrowLeft, Check, Loader2, Plus, Search, Send, Trash2, Users, X } from "lucide-react";
import ChatService, { getChatSocket } from "../../services/chatService";
import SearchService from "../../services/searchService";
import { avatarDataUrl } from "../../utils/avatarUtils";

const myId = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").user_id || null;
  } catch {
    return null;
  }
};
const nameOf = (u) =>
  `${u?.profile?.first_name || ""} ${u?.profile?.last_name || ""}`.trim() || u?.username || "Someone";
const others = (conv, me) => (conv?.members || []).filter((m) => m._id !== me);
const titleOf = (conv, me) =>
  conv?.type === "group" && conv.name ? conv.name : others(conv, me).map(nameOf).join(", ") || "Just you";
const avatarOf = (conv, me) => {
  const o = others(conv, me);
  return o.length === 1 ? avatarDataUrl(o[0].profile?.avatar_config, o[0].username) : null;
};
const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isToday(d) ? format(d, "h:mm a") : formatDistanceToNowStrict(d, { addSuffix: true });
};

function Avatar({ src, label, size = "h-10 w-10" }) {
  return src ? (
    <img src={src} alt="" className={`${size} shrink-0 rounded-full bg-gray-100`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700`}>
      {label ? <span className="text-sm font-semibold">{label}</span> : <Users className="h-5 w-5" />}
    </span>
  );
}

/* ---------------- New message ---------------- */

function NewChat({ onBack, onStarted }) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [picked, setPicked] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = q.length >= 2 ? await SearchService.search(q, 10) : await SearchService.suggestions();
        if (!cancelled) setPeople(data.people || []);
      } catch {
        if (!cancelled) setPeople([]);
      }
    }, q ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const me = myId();
  const toggle = (p) =>
    setPicked((prev) => (prev.some((x) => x._id === p._id) ? prev.filter((x) => x._id !== p._id) : [...prev, p]));

  const start = async () => {
    setBusy(true);
    setError("");
    const { data, error: err } = await ChatService.startConversation(picked.map((p) => p._id), groupName);
    setBusy(false);
    if (err) setError(err);
    else onStarted(data);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-3">
        <button type="button" onClick={onBack} aria-label="Back" className="rounded-full p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="font-semibold">New message</h3>
      </div>
      <div className="space-y-2 border-b border-gray-100 p-3">
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {picked.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => toggle(p)}
                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-800"
              >
                {nameOf(p)} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name or major"
            aria-label="Search people"
            className="h-9 w-full rounded-full bg-gray-100 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        {picked.length > 1 && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={60}
            placeholder="Group name (optional)"
            aria-label="Group name"
            className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {people.filter((p) => p._id !== me).map((p) => {
          const on = picked.some((x) => x._id === p._id);
          return (
            <button
              key={p._id}
              type="button"
              onClick={() => toggle(p)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
            >
              <Avatar src={avatarDataUrl(p.profile?.avatar_config, p.username)} size="h-9 w-9" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{nameOf(p)}</span>
                <span className="block truncate text-xs text-gray-500">
                  {[`@${p.username}`, p.profile?.major].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  on ? "border-green-600 bg-green-600 text-white" : "border-gray-300"
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          );
        })}
        {!people.length && <p className="px-4 py-6 text-center text-sm text-gray-500">No people found.</p>}
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          disabled={!picked.length || busy}
          onClick={start}
          className="flex h-10 w-full items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {picked.length > 1 ? `Start group chat (${picked.length + 1})` : "Start chat"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Thread ---------------- */

function Thread({ conversation, onBack, onRead }) {
  const me = myId();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState({});
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const cid = conversation._id;
  const membersById = useMemo(
    () => Object.fromEntries((conversation.members || []).map((m) => [m._id, m])),
    [conversation.members],
  );

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ block: "end" }), 0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ChatService.listMessages(cid).then(({ data }) => {
      if (cancelled) return;
      setMessages(data?.messages || []);
      setHasMore(Boolean(data?.has_more));
      setLoading(false);
      scrollDown();
      ChatService.markRead(cid).then(onRead);
    });

    const socket = getChatSocket();
    const join = () => socket?.emit("join_conversation", { conversation_id: cid });
    join();
    socket?.on("connect", join); // rejoin after reconnects
    const onMessage = (m) => {
      if (m.conversation_id !== cid) return;
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
      setTyping((t) => ({ ...t, [m.sender_id]: undefined }));
      scrollDown();
      if (m.sender_id !== me) ChatService.markRead(cid).then(onRead);
    };
    const onDeleted = (m) =>
      m.conversation_id === cid &&
      setMessages((prev) => prev.map((x) => (x._id === m._id ? { ...x, deleted: true, content: "" } : x)));
    const onTyping = (t) => {
      if (t.conversation_id !== cid) return;
      setTyping((prev) => ({ ...prev, [t.user_id]: t.is_typing ? t.name : undefined }));
    };
    socket?.on("message", onMessage);
    socket?.on("message_deleted", onDeleted);
    socket?.on("typing", onTyping);
    return () => {
      cancelled = true;
      socket?.emit("leave_conversation", { conversation_id: cid });
      socket?.off("connect", join);
      socket?.off("message", onMessage);
      socket?.off("message_deleted", onDeleted);
      socket?.off("typing", onTyping);
    };
  }, [cid, me, onRead]);

  const loadEarlier = async () => {
    const { data } = await ChatService.listMessages(cid, messages[0]?._id);
    setMessages((prev) => [...(data?.messages || []), ...prev]);
    setHasMore(Boolean(data?.has_more));
  };

  const sendTyping = (isTyping) => getChatSocket()?.emit("typing", { conversation_id: cid, is_typing: isTyping });
  const onChange = (e) => {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 2000);
  };

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    const { data, error: err } = await ChatService.sendMessage(cid, content);
    setSending(false);
    if (err) {
      setError(err);
      return;
    }
    setText("");
    clearTimeout(typingTimer.current);
    sendTyping(false);
    setMessages((prev) => (prev.some((x) => x._id === data._id) ? prev : [...prev, data]));
    scrollDown();
  };

  const remove = async (id) => {
    const { error: err } = await ChatService.deleteMessage(id);
    if (!err) setMessages((prev) => prev.map((x) => (x._id === id ? { ...x, deleted: true, content: "" } : x)));
  };

  const typingNames = Object.values(typing).filter(Boolean);
  const isGroup = conversation.type === "group";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
        <button type="button" onClick={onBack} aria-label="Back to conversations" className="rounded-full p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar src={avatarOf(conversation, me)} size="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{titleOf(conversation, me)}</p>
          {isGroup && <p className="text-xs text-gray-500">{conversation.members?.length} people</p>}
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto bg-gray-50/60 px-3 py-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {hasMore && (
              <button type="button" onClick={loadEarlier} className="mx-auto mb-2 block text-xs text-green-700 hover:underline">
                Load earlier messages
              </button>
            )}
            {!messages.length && (
              <p className="py-8 text-center text-sm text-gray-500">No messages yet. Say hi!</p>
            )}
            {messages.map((m, i) => {
              const mine = m.sender_id === me;
              const showName = isGroup && !mine && messages[i - 1]?.sender_id !== m.sender_id;
              return (
                <div key={m._id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    {showName && (
                      <p className="mb-0.5 ml-2 text-[11px] text-gray-500">{nameOf(membersById[m.sender_id])}</p>
                    )}
                    <div className="flex items-center gap-1">
                      {mine && !m.deleted && (
                        <button
                          type="button"
                          onClick={() => remove(m._id)}
                          aria-label="Delete message"
                          className="rounded p-1 text-gray-400 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div
                        className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                          m.deleted
                            ? "border border-dashed border-gray-300 italic text-gray-400"
                            : mine
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-800 shadow-sm"
                        }`}
                        title={new Date(m.created_at).toLocaleString()}
                      >
                        {m.deleted ? "Message deleted" : m.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {typingNames.length > 0 && (
              <p className="px-2 text-xs italic text-gray-500">
                {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
              </p>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {error && <p className="px-3 pt-1 text-xs text-red-600">{error}</p>}
      <form
        className="flex items-end gap-2 border-t border-gray-100 p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          value={text}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-2xl bg-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

/* ---------------- Panel ---------------- */

/**
 * Floating chat (full screen on phones). Lists conversations, opens threads,
 * starts new direct/group chats. `startWith` (a user id) opens or creates a
 * direct chat with that person.
 */
export default function ChatPanel({ open, onClose, conversations, refresh, startWith, onStartHandled }) {
  const me = myId();
  const [view, setView] = useState({ name: "list" });

  const openConversation = useCallback((conv) => setView({ name: "thread", conversation: conv }), []);

  useEffect(() => {
    if (!open || !startWith) return;
    ChatService.startConversation([startWith]).then(({ data }) => {
      if (data) {
        openConversation(data);
        refresh();
      }
      onStartHandled?.();
    });
  }, [open, startWith, openConversation, refresh, onStartHandled]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Messages"
      className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[560px] sm:max-h-[calc(100vh-6rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl"
    >
      {view.name === "thread" ? (
        <Thread
          conversation={view.conversation}
          onBack={() => {
            setView({ name: "list" });
            refresh();
          }}
          onRead={refresh}
        />
      ) : view.name === "new" ? (
        <NewChat
          onBack={() => setView({ name: "list" })}
          onStarted={(conv) => {
            refresh();
            openConversation(conv);
          }}
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-lg font-semibold">Messages</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView({ name: "new" })}
                aria-label="New message"
                className="rounded-full p-2 text-green-700 hover:bg-green-50"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button type="button" onClick={onClose} aria-label="Close messages" className="rounded-full p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations === null ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-semibold text-gray-800">No conversations yet</p>
                <p className="mt-1 text-sm text-gray-500">Start one with a classmate.</p>
                <button
                  type="button"
                  onClick={() => setView({ name: "new" })}
                  className="mt-4 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  New message
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const last = c.last_message;
                const preview = last
                  ? `${last.sender_id === me ? "You: " : ""}${last.content || "Message deleted"}`
                  : "No messages yet";
                const title = titleOf(c, me);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => openConversation(c)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <Avatar src={avatarOf(c, me)} label={c.type === "group" ? null : title[0]} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${c.unread ? "font-semibold" : "font-medium"}`}>{title}</span>
                        <span className="shrink-0 text-[11px] text-gray-400">{when(last?.created_at || c.created_at)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-xs ${c.unread ? "text-gray-800" : "text-gray-500"}`}>{preview}</span>
                        {c.unread > 0 && (
                          <span className="shrink-0 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

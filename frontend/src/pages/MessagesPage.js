import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageSquare, PlusCircle, Users, X } from "lucide-react";
import Header from "../components/layout/Header";
import { ConversationList, NewChat, Thread } from "../components/chat/ChatPanel";
import { useChat } from "../context/ChatContext";
import ChatService from "../services/chatService";

const TABS = [
  { id: "direct", label: "Direct", icon: MessageSquare },
  { id: "group", label: "Groups", icon: Users },
];

/**
 * Full chat page (header chat button on desktop). Same conversations as the
 * floating panel (shared ChatContext), split into Direct and Groups.
 * /messages/:conversationId opens a conversation directly.
 */
function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { conversations, refresh, closePanel } = useChat();
  const [tab, setTab] = useState("direct");
  const [composing, setComposing] = useState(false);
  const [fallback, setFallback] = useState(null); // conversation not in the list yet

  // Only one chat surface at a time: close the small panel here.
  useEffect(() => closePanel(), [closePanel]);

  const selected = useMemo(
    () => (conversations || []).find((c) => c._id === conversationId) || (fallback?._id === conversationId ? fallback : null),
    [conversations, conversationId, fallback],
  );

  // Deep link to a conversation that isn't loaded yet.
  useEffect(() => {
    if (!conversationId || selected || conversations === null) return;
    ChatService.getConversation(conversationId).then(({ data }) => {
      if (data) setFallback(data);
      else navigate("/messages", { replace: true });
    });
  }, [conversationId, selected, conversations, navigate]);

  // Show the tab that contains the open conversation.
  useEffect(() => {
    if (selected) setTab(selected.type === "group" ? "group" : "direct");
  }, [selected]);

  const counts = useMemo(() => {
    const c = { direct: { n: 0, unread: 0 }, group: { n: 0, unread: 0 } };
    (conversations || []).forEach((conv) => {
      const k = conv.type === "group" ? "group" : "direct";
      c[k].n += 1;
      c[k].unread += conv.unread || 0;
    });
    return c;
  }, [conversations]);

  const visible = conversations === null ? null : conversations.filter((c) => (c.type === "group" ? "group" : "direct") === tab);

  const open = useCallback(
    (conv) => {
      setComposing(false);
      navigate(`/messages/${conv._id}`);
    },
    [navigate],
  );

  const showRightOnPhone = composing || Boolean(conversationId);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Header />
      <div className="flex min-h-0 flex-1">
        {/* Left: conversations */}
        <aside
          className={`w-full flex-col border-r border-gray-200 sm:flex sm:w-80 sm:shrink-0 ${showRightOnPhone ? "hidden" : "flex"}`}
        >
          <div className="flex items-center gap-2 p-4">
            <button
              type="button"
              onClick={() => {
                setComposing(true);
                navigate("/messages");
              }}
              className="flex h-10 flex-1 items-center justify-center rounded-full bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Message
            </button>
          </div>
          <div className="mx-4 mb-2 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Conversation type">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm transition ${
                  tab === t.id ? "bg-white font-medium text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {counts[t.id].unread > 0 && (
                  <span className="rounded-full bg-green-600 px-1.5 text-[10px] font-semibold leading-4 text-white">
                    {counts[t.id].unread}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              conversations={visible}
              selectedId={conversationId}
              onSelect={open}
              onNew={() => setComposing(true)}
              emptyText={tab === "group" ? "Pick two or more people to start a group." : 'Click "New Message" to start chatting.'}
            />
          </div>
        </aside>

        {/* Right: conversation / new message / placeholder */}
        <section className={`relative min-w-0 flex-1 flex-col sm:flex ${showRightOnPhone ? "flex" : "hidden"}`}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Close messages"
            className="absolute right-3 top-2.5 z-10 hidden rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 sm:block"
          >
            <X className="h-5 w-5" />
          </button>
          {composing ? (
            <NewChat
              onBack={() => setComposing(false)}
              onStarted={(conv) => {
                refresh();
                setFallback(conv);
                open(conv);
              }}
            />
          ) : selected ? (
            <Thread
              key={selected._id}
              conversation={selected}
              onBack={() => navigate("/messages")}
              backOnlyOnPhone
              onRead={refresh}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MessagesPage;

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ChatService, { getChatSocket, OPEN_CHAT_EVENT } from "../services/chatService";

const ChatContext = createContext(null);

/**
 * One source of truth for chat across the app: the conversation list,
 * unread count and the small (floating) chat panel. The floating panel, the
 * header badge and the full /messages page all read from here, so they always
 * show the same chats.
 */
export function ChatProvider({ children }) {
  const location = useLocation();
  const [signedIn, setSignedIn] = useState(() => Boolean(localStorage.getItem("jwt_token")));
  const [conversations, setConversations] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  // What the small panel should open next:
  // { userId?, conversation?, draft?: { text, post } }
  const [startWith, setStartWith] = useState(null);

  // Sign-in/out happens on route changes (sign in -> /home, sign out -> /signin).
  useEffect(() => {
    setSignedIn(Boolean(localStorage.getItem("jwt_token")));
  }, [location.pathname]);

  const refresh = useCallback(async () => {
    const { data } = await ChatService.listConversations();
    if (data) setConversations(data.conversations);
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setConversations(null);
      setPanelOpen(false);
      return undefined;
    }
    refresh();
    const socket = getChatSocket();
    let timer;
    const onUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    };
    socket?.on("conversation_updated", onUpdate);
    socket?.on("connect", onUpdate);
    return () => {
      clearTimeout(timer);
      socket?.off("conversation_updated", onUpdate);
      socket?.off("connect", onUpdate);
    };
  }, [signedIn, refresh]);

  // openPanel(userId) or openPanel({ userId | conversation, draft })
  const openPanel = useCallback((target = null) => {
    setPanelOpen(true);
    if (target) setStartWith(typeof target === "string" ? { userId: target } : target);
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const togglePanel = useCallback(() => setPanelOpen((open) => !open), []);
  const clearStartWith = useCallback(() => setStartWith(null), []);

  // "Message" buttons elsewhere (e.g. profiles) open the panel with that person.
  useEffect(() => {
    const onOpenChat = (e) => openPanel(e.detail?.userId || null);
    window.addEventListener(OPEN_CHAT_EVENT, onOpenChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpenChat);
  }, [openPanel]);

  const value = useMemo(
    () => ({
      signedIn,
      conversations,
      unreadTotal: (conversations || []).reduce((n, c) => n + (c.unread || 0), 0),
      refresh,
      panelOpen,
      openPanel,
      closePanel,
      togglePanel,
      startWith,
      clearStartWith,
    }),
    [signedIn, conversations, refresh, panelOpen, openPanel, closePanel, togglePanel, startWith, clearStartWith],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);

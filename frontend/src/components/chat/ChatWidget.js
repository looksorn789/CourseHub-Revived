import { useLocation } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import ChatPanel from "./ChatPanel";
import { useChat } from "../../context/ChatContext";

const PUBLIC_PATHS = ["/", "/signin", "/signup", "/forgot-password", "/student-profile"];

/**
 * Floating chat bubble (bottom right, desktop/tablet) that opens the small
 * chat panel. On phones the header's chat button opens the panel instead.
 * Hidden on public pages and on the full /messages page.
 */
export default function ChatWidget() {
  const { pathname } = useLocation();
  const { signedIn, panelOpen, togglePanel, unreadTotal } = useChat();

  const hidden =
    !signedIn ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/messages");
  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={togglePanel}
        aria-label={panelOpen ? "Close chat" : unreadTotal ? `Open chat, ${unreadTotal} unread` : "Open chat"}
        className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:scale-105 hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 sm:flex"
      >
        {panelOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!panelOpen && unreadTotal > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-red-500 px-1 text-center text-[11px] font-semibold leading-5 text-white ring-2 ring-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        )}
      </button>
      <ChatPanel />
    </>
  );
}

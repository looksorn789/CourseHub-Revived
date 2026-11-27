import { io } from "socket.io-client";
import api from "./api";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

// Ask the chat panel to open (optionally straight into a chat with someone).
export const OPEN_CHAT_EVENT = "coursehub:open-chat";
export const openChatWith = (userId) =>
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { userId } }));

let socket = null;
let socketToken = null;

/**
 * One shared Socket.IO connection, authenticated with the current access
 * token. The server only pushes events; all writes go through the REST API.
 */
export function getChatSocket() {
  const token = localStorage.getItem("jwt_token");
  if (!token) return null;
  if (socket && socketToken === token) return socket;
  if (socket) socket.disconnect();
  socketToken = token;
  socket = io(API_URL, {
    auth: (cb) => cb({ token: localStorage.getItem("jwt_token") }),
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 10000,
  });
  return socket;
}

export function disconnectChatSocket() {
  if (socket) socket.disconnect();
  socket = null;
  socketToken = null;
}

const unwrap = (promise) =>
  promise
    .then((res) => ({ data: res.data.data, error: null }))
    .catch((err) => ({ data: null, error: err.message || "Something went wrong" }));

const ChatService = {
  listConversations: () => unwrap(api.get("/api/messages/conversations")),
  startConversation: (participantIds, name = "") =>
    unwrap(api.post("/api/messages/conversations", { participant_ids: participantIds, name })),
  getConversation: (id) => unwrap(api.get(`/api/messages/conversations/${id}`)),
  listMessages: (id, before) =>
    unwrap(api.get(`/api/messages/conversations/${id}/messages`, { params: { before, limit: 30 } })),
  sendMessage: (id, content) =>
    unwrap(api.post(`/api/messages/conversations/${id}/messages`, { content })),
  markRead: (id) => unwrap(api.post(`/api/messages/conversations/${id}/read`)),
  deleteMessage: (messageId) => unwrap(api.delete(`/api/messages/messages/${messageId}`)),
};

export default ChatService;

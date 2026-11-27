import { useState } from "react";
import { Check, Clock, Loader2, UserCheck, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
  unfriendUser,
} from "../../services/friendsService";

const base =
  "inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60";

/**
 * Friend actions for someone else's profile.
 * status: none | sent | received | friends. Calls onChanged() after any
 * change so the parent can reload the status (and friend count).
 */
export default function FriendButton({ userId, name, status, requestId, onChanged }) {
  const [busy, setBusy] = useState(false);

  const run = async (action, success) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result?.error || result?.success === false) {
      toast.error(result.error || "Something went wrong");
      return;
    }
    if (success) toast.success(success);
    onChanged?.();
  };

  const spinner = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;

  if (status === "received") {
    return (
      <>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => acceptFriendRequest(requestId), `You and ${name} are now friends`)}
          className={`${base} bg-green-600 text-white hover:bg-green-700`}
        >
          {busy ? spinner : <Check className="mr-2 h-4 w-4" />}
          Accept request
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => declineFriendRequest(requestId))}
          className={`${base} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        >
          <X className="mr-2 h-4 w-4" />
          Decline
        </button>
      </>
    );
  }

  if (status === "friends") {
    return (
      <button
        type="button"
        disabled={busy}
        title="Click to unfriend"
        onClick={() => {
          if (window.confirm(`Remove ${name} from your friends?`)) run(() => unfriendUser(userId));
        }}
        className={`${base} group bg-green-100 text-green-800 hover:bg-red-50 hover:text-red-700`}
      >
        {busy ? spinner : (
          <>
            <UserCheck className="mr-2 h-4 w-4 group-hover:hidden" />
            <UserMinus className="mr-2 hidden h-4 w-4 group-hover:inline" />
          </>
        )}
        <span className="group-hover:hidden">Friends</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </button>
    );
  }

  if (status === "sent") {
    return (
      <button
        type="button"
        disabled={busy}
        title="Click to cancel the request"
        onClick={() => run(() => cancelFriendRequest(requestId), "Friend request cancelled")}
        className={`${base} group border border-gray-300 bg-white text-gray-700 hover:border-red-200 hover:text-red-700`}
      >
        {busy ? spinner : <Clock className="mr-2 h-4 w-4" />}
        <span className="group-hover:hidden">Request sent</span>
        <span className="hidden group-hover:inline">Cancel request</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => sendFriendRequest(userId), `Friend request sent to ${name}`)}
      className={`${base} bg-green-600 text-white hover:bg-green-700`}
    >
      {busy ? spinner : <UserPlus className="mr-2 h-4 w-4" />}
      Add Friend
    </button>
  );
}

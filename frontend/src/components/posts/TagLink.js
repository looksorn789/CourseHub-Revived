import { useNavigate } from "react-router-dom";
import { Hash } from "lucide-react";

export const tagPath = (tag) => `/tags/${encodeURIComponent(String(tag).replace(/^#/, ""))}`;

/**
 * A tag that opens the page of every post with that tag. Rendered as a
 * button (not a link) so it can sit inside clickable cards and links.
 */
export default function TagLink({ tag, className = "", showHash = true, children, onNavigate }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.();
        navigate(tagPath(tag));
      }}
      title={`Posts tagged #${tag}`}
      className={`inline-flex items-center transition-colors hover:text-green-700 hover:underline underline-offset-2 ${className}`}
    >
      {showHash && <Hash className="mr-0.5 h-3 w-3" />}
      {children || tag}
    </button>
  );
}

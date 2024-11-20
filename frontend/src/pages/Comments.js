import React, { useState, useEffect } from "react";
import axios from "../services/api";

const Comments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/comments/post/${postId}`);
      setComments(data);
    } catch (error) {
      setError("Failed to load comments.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/comments/", { post_id: postId, body });
      setBody("");  // Clear comment input
      fetchComments();  // Refresh comments
    } catch (error) {
      setError("Failed to add comment.");
    }
  };

  return (
    <div className="comments-section">
      {error && <p>{error}</p>}

      {/* Add comment form */}
      <form onSubmit={handleAddComment}>
        <textarea
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit">Post Comment</button>
      </form>

      {/* List of comments */}
      {comments.map((comment) => (
        <div key={comment.id}>
          <p>{comment.body}</p>
          <small>by {comment.author} on {comment.date}</small>
        </div>
      ))}
    </div>
  );
};

export default Comments;

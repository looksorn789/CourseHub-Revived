import React, { useEffect, useState } from "react";
import { forumService } from "../../services/forumServices";
import Button from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card"; // Import card components

function ForumGrid() {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedForums, setExpandedForums] = useState(new Set());
  const [joinedForums, setJoinedForums] = useState(new Set());
  const [joinError, setJoinError] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchForums = async () => {
      const { data, error } = await forumService.getAllForums();
      if (error) {
        setError(error);
      } else {
        setForums(data.forums);
      }
      setLoading(false);
    };

    fetchForums();
  }, []);

  const handleJoinForum = async (forumId, forumName) => {
    const { data, error } = await forumService.joinForum(forumId);
    if (error) {
      setJoinError(error);
      console.error("Join forum error:", error);
    } else {
      setJoinedForums((prev) => new Set(prev).add(forumId));
      setPopupMessage(`Welcome to the ${forumName} forum!`);
      setShowPopup(true);
    }
  };

  const handleLeaveForum = async (forumId, forumName) => {
    const { data, error } = await forumService.leaveForum(forumId);
    if (error) {
      console.error("Leave forum error:", error);
    } else {
      setJoinedForums((prev) => {
        const updated = new Set(prev);
        updated.delete(forumId);
        return updated;
      });
      setPopupMessage(`You have left the ${forumName} forum.`);
      setShowPopup(true);
    }
  };

  const toggleExpand = (forumId) => {
    setExpandedForums((prev) => {
      const updated = new Set(prev);
      if (updated.has(forumId)) {
        updated.delete(forumId);
      } else {
        updated.add(forumId);
      }
      return updated;
    });
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {forums.map((forum) => (
        <Card key={forum._id} className="w-full h-full max-w-[500px] p-4 flex flex-col justify-between"> {/* Flex container */}
          <CardHeader>
            <div className="w-full h-40 bg-gray-300"></div>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow">
            <CardTitle className="text-lg font-bold">{forum.name}</CardTitle>
            <CardDescription>
              <div 
                className={`line-clamp-2 ${expandedForums.has(forum._id) ? "line-clamp-none" : ""}`} 
                onClick={() => toggleExpand(forum._id)}
              >
                {forum.description}
              </div>
            </CardDescription>
            {/* Tags Section */}
            <div className="flex flex-wrap mt-2">
              {forum.tags.map((tag, index) => (
                <span key={index} className="text-sm text-gray-600 bg-gray-200 rounded-full px-2 py-1 mr-2 mb-2">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-500 mb-4">Members: {forum.member_count}</div>
            {/* Join Button */}
            <Button 
              className="mt-auto w-full bg-green-500 hover:bg-green-600 text-white py-2" 
              variant="primary"
              onClick={() => {
                if (joinedForums.has(forum._id)) {
                  handleLeaveForum(forum._id, forum.name);
                } else {
                  handleJoinForum(forum._id, forum.name);
                }
              }}
            >
              {joinedForums.has(forum._id) ? "Joined" : "Join"} 
            </Button>
            {joinError && <div className="text-red-500 mt-2">{joinError}</div>} 
          </CardContent>
        </Card>
      ))}

      {/* Popup for messages */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-lg font-semibold">{popupMessage}</h2>
            <Button className="mt-4" onClick={closePopup}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumGrid;

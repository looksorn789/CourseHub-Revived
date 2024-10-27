import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import axios from "axios"; // Import axios for making HTTP requests

function Feed() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateForumModal, setShowCreateForumModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "", forum: "", attachment: null });
  const [newForum, setNewForum] = useState({ name: "", description: "", tags: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const posts = [
    {
      title: "What is the difference between a list and an array?",
      author: "user12345",
      comments: 12,
      date: "September 17, 2024",
      image: "https://via.placeholder.com/150",
      forum: "Computer Science",
    },
  ];

  const subscribedForums = ["Computer Science", "Technology", "Business", "Film"];

  const filteredPosts = posts.filter((post) => {
    const matchesForum =
      selectedFilter === "All" || post.forum === selectedFilter;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesForum && matchesSearch;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost({ ...newPost, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewPost({ ...newPost, attachment: e.target.files[0] });
  };

  // API call for creating a post
  const handleCreatePostSubmit = async () => {
    const formData = new FormData();
    formData.append("title", newPost.title);
    formData.append("body", newPost.body);
    formData.append("forum", newPost.forum);
    if (newPost.attachment) {
      formData.append("attachment", newPost.attachment);
    }

    try {
      const response = await axios.post("/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Post created successfully:", response.data);
      setShowCreatePostModal(false);
      setNewPost({ title: "", body: "", forum: "", attachment: null });
      // Optionally refresh posts or update the state here
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // Handle Create Forum modal input change
  const handleForumInputChange = (e) => {
    const { name, value } = e.target;
    setNewForum({ ...newForum, [name]: value });
  };

  // API call for creating a forum
  const handleCreateForumSubmit = async () => {
    const forumData = {
        name: newForum.title,        // Assuming title corresponds to forum name
        description: newForum.description,
        tags: newForum.tags.split(",").map(tag => tag.trim()), // Split tags by commas and trim whitespace
    };

    try {
        const response = await axios.post("/api/forums/", forumData); // Send request to backend
        console.log("Forum created successfully:", response.data);
        setShowCreateForumModal(false);
        setNewForum({ title: "", description: "", tags: "" }); // Reset form fields
        // Optionally refresh forums or update the state here
    } catch (error) {
        console.error("Error creating forum:", error);
    }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <Header />

      <div className="feed-content flex p-4">
        {/* Sidebar */}
        <div className="flex flex-col space-y-4">
          {/* Saved Posts Section */}
          <div className="m-12 top-20 w-64 h-full p-8 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Saved Posts</h3>
            <ul>
              {filteredPosts.slice(0, 2).map((post, index) => (
                <li key={index} className="mb-2">
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => navigate(`/postdetails`)}
                  >
                    {post.title}
                  </a>
                  <p className="text-xs text-green-700">{post.forum}</p>
                </li>
              ))}
            </ul>
          </div>
          {/* Courses Section */}
          <div className="m-12 w-64 h-full p-11 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Courses</h3>
            <ul>
              {["Computer Science", "Mathematics", "Business", "Film"].map((course, index) => (
                <li key={index} className="mb-2 text-sm text-gray-600">{course}</li>
              ))}
            </ul>
            {/* Create Forum Button moved under Courses */}
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => setShowCreateForumModal(true)}
            >
              Create Forum
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-4/5 bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="forumFilter" className="text-sm font-semibold mr-2">
                  Filter by forum:
                </label>
                <select
                  id="forumFilter"
                  className="border rounded px-3 py-1"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  {["All", ...subscribedForums].map((forum, index) => (
                    <option key={index} value={forum}>
                      {forum}
                    </option>
                  ))}
                </select>
              </div>
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
              />
            </div>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => setShowCreatePostModal(true)}
            >
              Create Post
            </button>
          </div>

          {/* Posts Feed */}
          <h2 className="text-2xl font-semibold text-green-700 mb-4">
            {selectedFilter}
          </h2>
          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-4 flex items-start space-x-4 cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/postdetails`)}
              >
                <img
                  src={post.image}
                  alt="Post Thumbnail"
                  className="w-16 h-16 rounded-md"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
                  <p className="text-sm text-gray-600">{post.author}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span>{post.comments} comments</span>
                    <span className="mx-2">•</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreatePostModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Create a New Post</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  name="title"
                  value={newPost.title}
                  onChange={handleInputChange}
                  placeholder="Post Title"
                  className="block border rounded w-full p-2 mb-4"
                  required
                />
                <textarea
                  name="body"
                  value={newPost.body}
                  onChange={handleInputChange}
                  placeholder="Post Body"
                  className="block border rounded w-full p-2 mb-4"
                  required
                />
                <select
                  name="forum"
                  value={newPost.forum}
                  onChange={handleInputChange}
                  className="block border rounded w-full p-2 mb-4"
                  required
                >
                  <option value="">Select Forum</option>
                  {subscribedForums.map((forum, index) => (
                    <option key={index} value={forum}>
                      {forum}
                    </option>
                  ))}
                </select>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block border rounded w-full p-2 mb-4"
                />
                <div className="flex justify-end">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded mr-2"
                    onClick={handleCreatePostSubmit}
                  >
                    Submit
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                    onClick={() => setShowCreatePostModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Forum Modal */}
        {showCreateForumModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Create a New Forum</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  name="title"
                  value={newForum.title}
                  onChange={handleForumInputChange}
                  placeholder="Forum Title"
                  className="block border rounded w-full p-2 mb-4"
                  required
                />
                <textarea
                  name="description"
                  value={newForum.description}
                  onChange={handleForumInputChange}
                  placeholder="Description"
                  className="block border rounded w-full p-2 mb-4"
                  required
                />
                <input
                  type="text"
                  name="tags"
                  value={newForum.tags}
                  onChange={handleForumInputChange}
                  placeholder="Tags (comma-separated)"
                  className="block border rounded w-full p-2 mb-4"
                  required
                />
                <div className="flex justify-end">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded mr-2"
                    onClick={handleCreateForumSubmit}
                  >
                    Submit
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                    onClick={() => setShowCreateForumModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feed;

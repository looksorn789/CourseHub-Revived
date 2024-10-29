import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import axios from "axios"; 
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Label from "../components/ui/Label";
import "./Feed.css";
function Feed() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateForumModal, setShowCreateForumModal] = useState(false);
  const [newPost, setNewPost] = useState({title : "", body : "", tags : [], forum_id : "55367", creator_id : "6554", creation_date : "", like_count : 0});
  const [newForum, setNewForum] = useState({ title: "", description: "", tags: [] }); 
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTag, setCurrentTag] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const handleListItemAdd = (item, setter) => {
    if (item.trim()) {
      setter((prev) => [...prev, item.trim()]);
    }
  };

  const handleTagRemove = (index) => {
    setNewForum((prev) => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index) // Correctly filter tags
    }));
};

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
    setLoading(true); // Set loading to true
    const formData = new FormData();
    formData.append("title", newPost.title);
    formData.append("body", newPost.body);
    formData.append("forum_id", newPost.forum);
    formData.append("creator_id", newPost.creator_id)
    formData.append("like_count", newPost.like_count)
    if (newPost.attachment) {
      formData.append("attachment", newPost.attachment);
    }

    try {
      const response = await axios.post("/post/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Post created successfully:", response.data);
      setShowCreatePostModal(false);
      setNewPost({ title: "", body: "", forum_id: "", attachment: null });
      // Optionally refresh posts or update the state here
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handle Create Forum modal input change
  const handleForumInputChange = (e) => {
    const { name, value } = e.target;
    setNewForum({ ...newForum, [name]: value });
  };

  // Function to add a tag
  const addTagPost = () => {
    if (currentTag && !newPost.tags.includes(currentTag)) {
      setNewPost((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag(""); // Reset current tag input
    }
  };
  const addTagForum = () => {
    if (currentTag && !newForum.tags.includes(currentTag)) {
      setNewForum((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag(""); // Reset current tag input
    }
  };

  const handleCreateForumSubmit = async () => {
    setLoading(true); 
    const forumData = {
      name: newForum.title,
      description: newForum.description,
      tags: newForum.tags, 
    };

    try {
      const response = await axios.post("/forum/", forumData); 
      console.log("Forum created successfully:", response.data);
      setShowCreateForumModal(false);
      setNewForum({ title: "", description: "", tags: [] }); 
      setCurrentTag(""); 
    } catch (error) {
      console.error("Error creating forum:", error);
    } finally {
      setLoading(false); 
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
              {["Computer Science", "Film"].map((course, index) => (
                <li key={index} className="mb-2 text-sm text-gray-600">{course}</li>
              ))}
            </ul>
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

        {showCreatePostModal && (
  <div className="modal">
    <div className="modal-content">
      <button className="close-button" onClick={() => setShowCreatePostModal(false)}>
        &times;
      </button>
      <h2 className="text-xl font-bold">Create Post</h2>
      <Label htmlFor="postTitle">Title</Label>
      <Input
        type="text"
        name="title"
        id="postTitle"
        value={newPost.title}
        onChange={handleInputChange}
        className="mb-4"
      />
      <Label htmlFor="postBody">Body</Label>
      <Input
        type="text"
        name="body"
        id="postBody"
        value={newPost.body}
        onChange={handleInputChange}
        className="mb-4"
      />
      <Label htmlFor="forumSelect">Select Forum</Label>
      <select
        name="forum"
        id="forumSelect"
        value={newPost.forum}
        onChange={handleInputChange}
        className="border rounded mb-4"
      >
        {subscribedForums.map((forum, index) => (
          <option key={index} value={forum}>
            {forum}
          </option>
        ))}
      </select>
      <Label htmlFor="tags">Tags</Label>
      <div className="flex mb-4">
        <Input
          type="text"
          id="tags"
          placeholder="Add a tag"
          value={currentTag}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTagPost();
            }
          }}
          onChange={(e) => setCurrentTag(e.target.value)}
          className="flex-grow border-green-200 focus:ring-green-500 focus:border-green-500"
        />
        <Button onClick={addTagPost}>Add Tag</Button>
      </div>
      <div className="tags-container mb-4">
        {newPost.tags.map((tag, index) => (
          <span
            key={index}
            className="tag bg-green-200 rounded-full px-2 py-1 text-green-700 mr-2"
          >
            {tag}
            <button
              className="ml-2 text-red-600"
              onClick={() => handleTagRemove(index, true)} // Updated to include 'true' for post tag removal
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <Label htmlFor="postAttachment">Attach File</Label>
      <Input
        type="file"
        id="postAttachment"
        onChange={handleFileChange}
        className="mb-4"
      />
      <Button onClick={handleCreatePostSubmit} disabled={loading}>
        {loading ? "Creating..." : "Create Post"}
      </Button>
      <Button onClick={() => setShowCreatePostModal(false)}>Cancel</Button>
    </div>
  </div>
)}
   {showCreateForumModal && (
  <div className="modal">
    <div className="modal-content">
      <button className="close-button" onClick={() => setShowCreateForumModal(false)}>
        &times;
      </button>
      <h2 className="text-xl font-bold">Create Forum</h2>
      <Label htmlFor="forumTitle">Forum Name</Label>
      <Input
        type="text"
        name="title"
        id="forumTitle"
        value={newForum.title}
        onChange={handleForumInputChange}
        className="mb-4"
      />
      <Label htmlFor="forumDescription">Description</Label>
      <Input
        type="text"
        name="description"
        id="forumDescription"
        value={newForum.description}
        onChange={handleForumInputChange}
        className="mb-4"
      />
      <Label htmlFor="tags">Tags</Label>
      <div className="flex mb-4">
        <Input
          type="text"
          id="tags"
          placeholder="Add a tag"
          value={currentTag}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTagForum();
            }
          }}
          onChange={(e) => setCurrentTag(e.target.value)}
          className="flex-grow border-green-200 focus:ring-green-500 focus:border-green-500"
        />
        <Button onClick={addTagForum}>Add Tag</Button>
      </div>
      <div className="tags-container mb-4">
        {newForum.tags.map((tag, index) => (
          <span
            key={index}
            className="tag bg-green-200 rounded-full px-2 py-1 text-green-700 mr-2"
          >
            {tag}
            <button
              className="ml-2 text-red-600"
              onClick={() => handleTagRemove(index)} // Correct the function call here
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <Button onClick={handleCreateForumSubmit} disabled={loading}>
        {loading ? "Creating..." : "Create Forum"}
      </Button>
      <Button onClick={() => setShowCreateForumModal(false)}>Cancel</Button>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

export default Feed;

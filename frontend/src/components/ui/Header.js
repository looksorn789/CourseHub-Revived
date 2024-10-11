import React from "react";
import { FaHome, FaUserCircle } from "react-icons/fa";
import { BookOpen } from "lucide-react"; // Import the BookOpen icon
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        {/* Wrapping the icon and text in a span for proper flex alignment */}
        <h1 className="header-title">
          <span className="icon-text">
            <BookOpen className="book-icon" />
            CourseHub
          </span>
        </h1>
      </div>
      <div className="header-right">
        <a href="/" className="icon">
          <FaHome />
        </a>
        <a href="/student-profile" className="icon">
          <FaUserCircle />
        </a>
      </div>
    </header>
  );
};

export default Header;

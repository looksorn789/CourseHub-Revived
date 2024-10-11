import React from "react";
import { FaHome, FaUserCircle } from "react-icons/fa";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        {/* Ensure there is no unnecessary wrapper that might center the text */}
        <h1>CourseHub</h1>
      </div>
      <div className="header-right">
        <a href="/" className="icon">
          <FaHome />
        </a>
        <a href="/profile-page" className="icon">
          <FaUserCircle />
        </a>
      </div>
    </header>
  );
};

export default Header;

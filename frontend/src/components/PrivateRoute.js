import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PrivateRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("jwt_token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
  };

  if (!token) {
    sessionStorage.setItem("redirectUrl", location.pathname);
    return <Navigate to="/signin" />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime + 10) {
      handleLogout();
      return <Navigate to="/signin" />;
    }

    if (!decoded.sub || !decoded.aud) {
      handleLogout();
      return <Navigate to="/signin" />;
    }

    const isProfileCompleted = user.profile_completed;
    const isProfilePage = location.pathname === "/student-profile";

    if (!isProfileCompleted && !isProfilePage) {
      return <Navigate to="/student-profile" state={{ from: location }} />;
    }

    if (!isProfileCompleted && isProfilePage) {
      return children;
    }

    if (isProfileCompleted) {
      return children;
    }

    return <Navigate to="/signin" />;
  } catch (error) {
    console.error("Token validation error:", error);
    handleLogout();
    return <Navigate to="/signin" />;
  }
}

export default PrivateRoute;

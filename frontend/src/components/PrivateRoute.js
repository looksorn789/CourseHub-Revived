import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PrivateRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("jwt_token");

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
  };

  if (!token) {
    sessionStorage.setItem('redirectUrl', location.pathname);
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

    return children;
  } catch (error) {
    console.error('Token validation error:', error);
    handleLogout();
    return <Navigate to="/signin" />;
  }
}

export default PrivateRoute;
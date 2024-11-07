import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import StudentProfile from "./components/StudentProfile/StudentProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import Explore from "./pages/Explore";
import ChannelPage from "./pages/ChannelPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="/student-profile"
          element={
            <PrivateRoute>
              <StudentProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <PrivateRoute>
              <Explore />
            </PrivateRoute>
          }
        />
        <Route
          path="/channel/:slug"
          element={
            <PrivateRoute>
              <ChannelPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Feed from "./pages/Feed";
import PostDetails from "./pages/PostDetails";
import Profile from "./pages/Profile.js";
import StudentProfilePage from "./pages/StudentProfilePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentProfile from "./components/StudentProfile/StudentProfile.js";
import PrivateRoute from "./components/PrivateRoute";

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
          path="/feed"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />
      <Route
            path="/postdetails"
            element={
              <PrivateRoute>
                <PostDetails/>
              </PrivateRoute>

            }
          />
           <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile/>
              </PrivateRoute>

            }
          />
          </Routes>
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
      </Routes>
    </Router>
  );
}

export default App;
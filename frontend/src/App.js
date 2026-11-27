import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import StudentProfile from "./components/Profile/StudentProfile";
import ViewProfilePage from "./pages/ViewProfilePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import Explore from "./pages/Explore";
import Settings from "./pages/Settings";
import ChannelPage from "./pages/ChannelPage";
import FriendsPage from "./pages/FriendsPage";
import TagPage from "./pages/TagPage";
import MessagesPage from "./pages/MessagesPage";
import { ChatProvider } from "./context/ChatContext";
import ChatWidget from "./components/chat/ChatWidget";

function App() {
  return (
    <Router>
      {/* The app uses both toast libraries; mount both so their messages show.
          Top center keeps them clear of the chat bubble/panel at the bottom right. */}
      <ToastContainer position="top-center" autoClose={3000} newestOnTop />
      <Toaster position="top-center" />
      <ChatProvider>
      {/* Floating chat bubble + small chat panel (shared chat state). */}
      <ChatWidget />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/settings" element={<PrivateRoute><Settings /> </PrivateRoute>}/>
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
          path="/profile/:username"
          element={
            <PrivateRoute>
              <ViewProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
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
          path="/friends"
          element={
            <PrivateRoute>
              <FriendsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages/:conversationId?"
          element={
            <PrivateRoute>
              <MessagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tags/:tag"
          element={
            <PrivateRoute>
              <TagPage />
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
      </ChatProvider>
    </Router>
  );
}

export default App;

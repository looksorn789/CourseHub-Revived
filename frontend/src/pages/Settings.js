import React, { useState } from "react";
import "./settings.css";

const Settings = () => {
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [newPassword, setNewPassword] = useState(""); // To store the new password
  
  const toggleSection = (section) => {
    switch (section) {
      case "password":
        setIsPasswordOpen(!isPasswordOpen);
        break;
      case "account":
        setIsAccountOpen(!isAccountOpen);
        break;
      case "notification":
        setIsNotificationOpen(!isNotificationOpen);
        break;
      default:
        break;
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    console.log("New Password:", newPassword); // Handle password submission here
    setIsPasswordOpen(false); // Close the section after submission
    setNewPassword(""); // Clear input field
  };

  const handleCancel = () => {
    setIsPasswordOpen(false); // Close the password section
    setNewPassword(""); // Clear input field
  };

  const handleLogOut = () => {
    setIsAccountOpen(false); //Close
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="setting-item">
        <button className="setting-btn" onClick={() => toggleSection("password")}>
          Password
        </button>
        {isPasswordOpen && (
          <div className="setting-content">
            <form onSubmit={handlePasswordSubmit}>
              <label htmlFor="new-password" className="pass-change">
              </label>
              <input
                type="password"
                id="new-password"
                name="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="password-input"
              />
              <div className="button-group">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="setting-item">
        <button className="setting-btn" onClick={() => toggleSection("account")}>
          Manage Your Account
        </button>
        {isAccountOpen && (
          <div className="setting-content">
            <div className="button-group">
                <button type="button" className="cancel-btn" onClick={handleLogOut}>
                  Log Out
                </button>
                <button type="submit" className="submit-btn">
                  Delete Your Account
                </button>
              </div>
          </div>
        )}
      </div>

      <div className="setting-item">
        <button className="setting-btn" onClick={() => toggleSection("notification")}>
          Notification Preferences
        </button>
        {isNotificationOpen && (
          <div className="setting-content">
            <div className="button-group">
              <input type="checkbox" id="notifcation" value="on"></input>
              <label for="notifcation">Notification for mentions?</label>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

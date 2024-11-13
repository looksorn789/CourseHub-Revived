import React, { useState } from "react";
import Header from ".././components/layout/Header";
import SettingSidebar from "../components/Settings/SettingSidebar";
import AccountSettings from ".././components/Settings/AccountSettings";
import SecuritySettings from "../components/Settings/SecuritySettings.js";
import Notification from ".././components/Settings/Notification";
import DeleteAccountModal from ".././components/Settings/DeleteAccountModal";
import { deleteAccount } from "../services/authService"; // Import deleteAccount function
import { useNavigate } from "react-router-dom";

function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const navigate = useNavigate(); // Use navigate to redirect after deletion

  const handleDeleteAccount = async () => {
    try {
      const email = prompt("Please enter your email address to confirm deletion:");
      if (!email) {
        alert("Email is required to delete your account.");
        return;
      }

      await deleteAccount(email);
      alert("Your account has been successfully deleted.");
      navigate("/"); // Redirect to homepage or logout page
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again later.");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50 shadow-lg">
          <SettingSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onDeleteClick={() => setDeleteModalOpen(true)}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6 mt-6">
              {activeSection === "profile" && <AccountSettings />}
              {activeSection === "security" && <SecuritySettings />}
              {activeSection === "notification" && <Notification />}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <DeleteAccountModal
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}

export default Settings;

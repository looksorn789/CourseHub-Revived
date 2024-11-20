import React, { useState } from "react";
import { SettingLayout } from "../components/layout/SettingLayout";
import UserProfile from "../components/Settings/UserProfile";
import SecuritySettings from "../components/Settings/SecuritySettings";
import Notification from "../components/Settings/Notification";
import DeleteAccountModal from "../components/Settings/DeleteAccountModal";
import { deleteAccount } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    try {
      const email = prompt(
        "Please enter your email address to confirm account deletion:"
      );
      if (!email) {
        alert("Email is required to delete your account.");
        return;
      }

      await deleteAccount(email);
      alert("Your account has been successfully deleted.");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again later.");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  return (
    <SettingLayout
      maxWidth="7xl"
      showRightSidebar={false}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onDeleteClick={() => setDeleteModalOpen(true)}
    >
        {activeSection === "profile" && <UserProfile />}
        {activeSection === "security" && <SecuritySettings />}
        {activeSection === "notification" && <Notification />}
      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <DeleteAccountModal
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </SettingLayout>
  );
}

export default Settings;

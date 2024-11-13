import React from "react";
import { Home, Lock, Bell, Trash2 } from "lucide-react";
import Button from "../ui/Button";

function SettingsSidebar({ activeSection, setActiveSection, onDeleteClick }) {
  const sections = [
    { id: "profile", label: "My Profile", icon: Home },
    { id: "security", label: "Security", icon: Lock },
    { id: "notification", label: "Notification", icon: Bell },
  ];

  return (
    <div className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Account Settings</h2>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  activeSection === section.id
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="mr-2 h-4 w-4" />
                {section.label}
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {/* Delete Account Section */}
      <div className="mt-auto p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-100"
          onClick={onDeleteClick}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}

export default SettingsSidebar;

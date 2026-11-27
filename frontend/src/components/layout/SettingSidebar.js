import React from "react";
import { Home, Lock, Bell, Trash2 } from "lucide-react";
import Button from "../ui/Button";

const sections = [
  { id: "profile", label: "My Profile", icon: Home },
  { id: "security", label: "Security", icon: Lock },
  { id: "notification", label: "Notification", icon: Bell },
];

// Phone/tablet version of the settings sidebar: a scrollable tab row.
export function SettingsTabs({ activeSection, setActiveSection, onDeleteClick }) {
  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => setActiveSection(section.id)}
          className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === section.id
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
          }`}
        >
          <section.icon className="mr-1.5 h-4 w-4" />
          {section.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onDeleteClick}
        className="inline-flex shrink-0 items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50"
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Delete Account
      </button>
    </div>
  );
}

function SettingsSidebar({ activeSection, setActiveSection, onDeleteClick }) {

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Account Settings</h2>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors ${
                  activeSection === section.id
                    ? "bg-green-100 text-green-800 font-semibold"
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

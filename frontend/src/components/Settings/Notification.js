import React, { useState } from "react";

function Notification() {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = () => {
    setIsEnabled((prev) => !prev);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notification</h1>
      <p className="mb-6 text-gray-700">
        Change your notification settings here. Use the toggle switch below to turn notifications on or off.
      </p>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">{isEnabled ? "On" : "Off"}</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
            isEnabled ? "bg-blue-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform bg-white rounded-full transition-transform ${
              isEnabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default Notification;

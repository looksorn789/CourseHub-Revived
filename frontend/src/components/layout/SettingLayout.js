import React from "react";
import Header from "./Header";
import SettingSidebar from "./SettingSidebar";
import RightSidebar from "./RightSidebar";

export function SettingLayout({
  children,
  activeSection,
  setActiveSection,
  onDeleteClick,
  showRightSidebar = true,
  maxWidth = "3xl",
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <Header />
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white border-r border-gray-200">
          <SettingSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onDeleteClick={onDeleteClick}
          />
        </div>
        {/* Center */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] px-4 py-6">
          <div className={`w-full ${maxWidth === "7xl" ? "max-w-7xl" : "max-w-3xl"} mx-auto`}>
            {children}
          </div>
        </main>
        {/* Right Sidebar */}
        {showRightSidebar && (
          <div className="w-80 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightSidebar />
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
import Header from "./Header";
import SettingSidebar, { SettingsTabs } from "./SettingSidebar";
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
        <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white border-r border-gray-200">
          <SettingSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onDeleteClick={onDeleteClick}
          />
        </aside>
        {/* Center */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)] px-4 py-6">
          <div className={`w-full ${maxWidth === "7xl" ? "max-w-7xl" : "max-w-3xl"} mx-auto`}>
            <SettingsTabs
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onDeleteClick={onDeleteClick}
            />
            {children}
          </div>
        </main>
        {/* Right Sidebar */}
        {showRightSidebar && (
          <aside className="hidden xl:block w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightSidebar />
          </aside>
        )}
      </div>
    </div>
  );
}

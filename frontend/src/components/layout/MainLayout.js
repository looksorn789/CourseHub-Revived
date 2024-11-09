import React from "react";
import Header from "./Header";
import Sidebar from "./SideBar";
import RightSidebar from "./RightSidebar";

export function MainLayout({
  children,
  showRightSidebar = true,
  maxWidth = "3xl",
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <Sidebar />
        </div>
        {/* Center*/}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="flex justify-center">
            <div
              className={`w-full ${maxWidth === "7xl" ? "max-w-7xl" : "max-w-3xl"}`}
            >
              {children}
            </div>
          </div>
        </main>
        {/* Right Sidebar*/}
        {showRightSidebar && (
          <div className="w-80 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <RightSidebar />
          </div>
        )}
      </div>
    </div>
  );
}

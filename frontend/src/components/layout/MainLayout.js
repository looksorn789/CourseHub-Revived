import React from "react";
import Header from "./Header";
import Sidebar from "./SideBar";
import RightSidebar from "./RightSidebar";

/**
 * App shell for signed-in pages.
 * - lg (>=1024px) and up: left navigation column.
 *   Below that it lives in the header's menu sheet instead.
 * - xl (>=1280px) and up: right sidebar (suggestions, tags).
 */
export function MainLayout({
  children,
  showRightSidebar = true,
  maxWidth = "3xl"
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200">
          <Sidebar />
        </aside>
        {/* Center */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
          <div className="flex justify-center">
            <div className={`w-full ${maxWidth === "7xl" ? "max-w-7xl" : "max-w-3xl"}`}>
              {children}
            </div>
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

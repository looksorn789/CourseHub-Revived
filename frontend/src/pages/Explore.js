import React from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/SideBar";
import RightSidebar from "../components/layout/RightSidebar";
import ForumGrid from "../components/layout/ForumGrid";

function Explore() {
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
            <div className="w-full max-w-3xl">
              <ForumGrid/>
            </div>
          </div>
        </main>
        {/* Right Sidebar */}
        <div className="w-80 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

export default Explore;

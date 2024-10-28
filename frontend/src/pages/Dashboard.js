import React from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/SideBar";

function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to CourseHub</h2>
            <div className="mt-6">
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
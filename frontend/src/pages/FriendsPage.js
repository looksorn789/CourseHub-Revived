import React from "react";
import { MainLayout } from "../components/layout/MainLayout";
import Friends from "../components/Friends/Friends";

function FriendsPage() {
  return (
    <MainLayout maxWidth="7xl" showRightSidebar={false}>
      <div className="w-full">
        <Friends />
      </div>
    </MainLayout>
  );
}

export default FriendsPage;

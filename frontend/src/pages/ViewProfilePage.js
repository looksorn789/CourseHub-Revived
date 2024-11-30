import React from "react";
import { MainLayout } from "../components/layout/MainLayout";
import ProfileView from "../components/Profile/ProfileView";


function ViewProfilePage() {
  return (
    <MainLayout maxWidth="7xl" showRightSidebar={false}>
      <div className="w-full">
        <ProfileView />
      </div>
    </MainLayout>
  );
}

export default ViewProfilePage;
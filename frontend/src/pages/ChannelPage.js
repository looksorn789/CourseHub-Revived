import React from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { ChannelProfile } from "../components/channel/ChannelProfile";

function ChannelPage() {
  return (
    <MainLayout maxWidth="7xl" showRightSidebar={false}>
      <div className="w-full">
        <ChannelProfile />
      </div>
    </MainLayout>
  );
}

export default ChannelPage;

import React from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { Feed } from "./Feed";

function Home() {
  return (
    <MainLayout>
      <Feed />
    </MainLayout>
  );
}

export default Home;
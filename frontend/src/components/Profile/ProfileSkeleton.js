import React from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import ScrollArea from "../ui/ScrollArea";

const Skeleton = ({ width, height, className }) => (
  <div
    className={`animate-pulse bg-gray-300 rounded ${className}`}
    style={{ width, height }}
  ></div>
);

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Skeleton className="w-32 h-32 rounded-full border-4" />
              <div className="flex-grow text-center md:text-left">
                <Skeleton width="200px" height="24px" className="mb-2" />
                <Skeleton width="150px" height="20px" className="mb-4" />
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <Skeleton width="100px" height="28px" />
                  <Skeleton width="120px" height="28px" />
                  <Skeleton width="80px" height="28px" />
                </div>
                <Skeleton width="300px" height="20px" className="mb-4" />
                <div className="flex justify-center md:justify-start space-x-4">
                  <Skeleton width="100px" height="36px" />
                  <Skeleton width="100px" height="36px" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts and Interests */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton width="120px" height="24px" />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full pr-4">
                <Skeleton width="100%" height="80px" className="mb-4" />
                <Skeleton width="100%" height="80px" className="mb-4" />
                <Skeleton width="100%" height="80px" />
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton width="120px" height="24px" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Skeleton width="80px" height="28px" />
                  <Skeleton width="100px" height="28px" />
                  <Skeleton width="120px" height="28px" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton width="120px" height="24px" />
              </CardHeader>
              <CardContent>
                <Skeleton width="100%" height="80px" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton width="120px" height="24px" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-center">
                  <div>
                    <Skeleton width="40px" height="28px" />
                    <Skeleton width="80px" height="20px" />
                  </div>
                  <div>
                    <Skeleton width="40px" height="28px" />
                    <Skeleton width="80px" height="20px" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client"

import { Button } from "../components/ui/button";
import { useState, Suspense } from "react";

function HomeContent() {
  const [userType, setUserType] = useState<"driver" | "rider" | null>(null)

  const handleClick = (userType: "driver" | "rider") => {
    setUserType(userType)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {userType === null && (
        <div className="flex flex-col items-center justify-center h-screen gap-6 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Ride4Low</h2>
            <p className="text-gray-600 mb-8">Choose how you&apos;d like to use our service today</p>
            <div className="space-y-4">
              <Button
                className="w-full text-lg py-6 bg-black text-white hover:bg-gray-800"
                onClick={() => handleClick("rider")}
              >
                I Need a Ride
              </Button>
              <Button
                className="w-full text-lg py-6 bg-white text-black border border-gray-200 hover:bg-gray-50"
                variant="outline"
                onClick={() => handleClick("driver")}
              >
                I Want to Drive
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-48 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}

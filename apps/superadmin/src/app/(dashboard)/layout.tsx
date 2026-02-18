"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((open) => !open);

  const closeSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen relative w-full overflow-x-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-white/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col w-full min-w-0 ml-0 lg:ml-64 transition-all duration-300">
        <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 p-4 lg:p-8 w-full max-w-full overflow-x-hidden bg-gray-100">
          <div className="max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

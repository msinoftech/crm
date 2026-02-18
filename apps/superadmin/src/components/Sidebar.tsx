"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@crm/shared/hooks";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState("");
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={`bg-white border-r border-gray-200 fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } shadow-lg`}
    >
      <div className="h-16 px-3 flex items-center justify-start border-b border-gray-200">
        <Link href="/" className="logo w-full relative flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">GetSetTime</span>
          <span className="text-xs text-indigo-600">Superadmin</span>
        </Link>
      </div>

      <div className="py-6 px-3">
        <nav className="space-y-1">
          <Link
            href="/"
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname === "/" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMenu("dashboard")}
          >
            <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/workspaces"
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname.startsWith("/workspaces") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMenu("workspaces")}
          >
            <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Workspaces
          </Link>
          <Link
            href="/users"
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname.startsWith("/users") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMenu("users")}
          >
            <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Users
          </Link>
          <Link
            href="/settings"
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname === "/settings" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMenu("settings")}
          >
            <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </nav>
      </div>

      <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
            <span className="text-sm font-medium">
              {user?.email ? user.email.charAt(0).toUpperCase() : "SA"}
            </span>
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
              {user?.name || user?.email?.split("@")[0] || "Superadmin"}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[150px]">
              {user?.email || "admin@example.com"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

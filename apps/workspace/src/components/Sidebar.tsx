"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@crm/shared/hooks";
import { useWorkspaceName } from "@/hooks/useWorkspaceName";
import { getSuperadminUrl } from "@/lib/env";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState("");
  const pathname = usePathname();
  const { user, role } = useAuth();
  const workspaceName = useWorkspaceName();
  const superadminUrl = getSuperadminUrl();

  return (
    <aside
      className={`bg-white border-r border-gray-200 fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } shadow-lg`}
    >
      <div className="h-16 px-3 flex items-center justify-start border-b border-gray-200">
        <Link href="/" className="logo w-full relative flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">GetSetTime</span>
          <span className="text-xs text-indigo-600">Workspace</span>
        </Link>
      </div>
      {role === "superadmin" && (
        <div className="px-3 py-2 border-b border-gray-100 space-y-2">
          {workspaceName && (
            <p className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md truncate" title={workspaceName}>
              Viewing: {workspaceName}
            </p>
          )}
          {superadminUrl ? (
            <a
              href={superadminUrl}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-indigo-600 hover:bg-indigo-50"
            >
              <svg className="h-5 w-5 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Superadmin
            </a>
          ) : (
            <p className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-md">
              Missing NEXT_PUBLIC_SUPERADMIN_APP_URL in environment
            </p>
          )}
        </div>
      )}

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
            href="/leads"
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname.startsWith("/leads") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMenu("leads")}
          >
            <svg className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Leads
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
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
              {user?.name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[150px]">
              {user?.email || "user@example.com"}
            </p>
            {role === "superadmin" && (
              <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                Superadmin
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

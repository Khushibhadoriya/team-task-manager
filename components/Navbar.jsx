"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function getInitials(name) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default function Navbar() {
  const { user, logout }  = useAuth();
  const pathname          = usePathname();
  const [dropOpen, setDropOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects",  label: "Projects"  },
  ];

  return (
    <nav className="bg-indigo-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center font-bold text-indigo-900 text-sm">
              TF
            </div>
            <span className="font-bold text-lg tracking-tight">TaskFlow</span>
          </Link>

          {/* ── Nav Links ─────────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-indigo-700 text-white"
                      : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── User Menu ─────────────────────────────────────────── */}
          <div className="relative">
            <button
              onClick={() => setDropOpen(!dropOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-indigo-800 transition-all"
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-xs text-indigo-300 mt-0.5 capitalize">{user?.role}</p>
              </div>
              {/* Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14" height="14"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                className="text-indigo-300 ml-0.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropOpen && (
              <>
                {/* Invisible backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
                    <span className="inline-block mt-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize font-medium">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors mt-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
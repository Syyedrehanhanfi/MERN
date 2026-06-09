import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function MainLayout() {
  // Sidebar is expanded by default on large screens, collapsed on small
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Collapse on small screens automatically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isExpanded = sidebarOpen || sidebarHovered;

  return (
    <div className="flex h-screen bg-neutral-950 overflow-hidden">
      {/* ── Sidebar ── */}
      <Sidebar
        isExpanded={isExpanded}
        sidebarOpen={sidebarOpen}
        onMouseEnter={() => !sidebarOpen && setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

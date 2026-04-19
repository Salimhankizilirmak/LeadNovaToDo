'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AIAssistantWidget from '@/components/ai/AIAssistantWidget';
import UserSyncTrigger from '@/components/auth/UserSyncTrigger';
import { X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Sidebar - Mobile (Slide-over) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar Content */}
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full relative">
            {/* Close Button Mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 -right-12 p-2 bg-white rounded-lg text-gray-500 hover:text-gray-900 shadow-lg"
            >
              <X size={20} />
            </button>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* AI Assistant FAB and Panel */}
        <AIAssistantWidget />

        {/* Auth Sync Trigger */}
        <UserSyncTrigger />
      </div>
    </div>
  );
}

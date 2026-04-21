'use client';

import { Bell, Menu } from 'lucide-react';
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-lg lg:hidden transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-sm font-semibold text-gray-500 hidden sm:block">
          Genel Bakış
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-1.5 sm:p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-lg transition-all relative">
          <Bell size={18} className="sm:w-5 sm:h-5" />
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-gray-100">
          <OrganizationSwitcher
            hidePersonal={true}
            appearance={{
              elements: {
                organizationSwitcherTrigger: "hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors",
              }
            }}
          />
          <UserButton />
        </div>
      </div>
    </header>
  );
}


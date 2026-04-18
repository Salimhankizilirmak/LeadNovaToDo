'use client';

import { Bell, Menu } from 'lucide-react';

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

      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-lg transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}

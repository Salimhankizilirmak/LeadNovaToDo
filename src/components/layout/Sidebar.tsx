'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  BarChart3,
  Boxes,
  LogOut,
  Loader2,
  Settings2,
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projeler', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Takvim', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Hücreler', href: '/dashboard/cells', icon: Boxes },
  { name: 'Ekip', href: '/dashboard/team', icon: Users, roles: ['Patron', 'Genel Müdür', 'Admin', 'Proje Yöneticisi'] },
  { name: 'Raporlar', href: '/dashboard/reports', icon: BarChart3, roles: ['Patron', 'Genel Müdür', 'Admin'] },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings2, roles: ['Patron', 'Genel Müdür', 'Admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 10V3L4 14h7v7l9-11h-7z"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          LeadNova
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item: any) => {
          const role = user?.publicMetadata?.role as string || 'Personel';
          if (item.roles && !item.roles.includes(role)) return null;

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-900'}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="px-3 py-2 rounded-xl bg-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
              {isLoaded
                ? (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? '?').toUpperCase()
                : '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {!isLoaded ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Yükleniyor...
                  </span>
                ) : (
                  user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? 'Kullanıcı'
                )}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {(user?.publicMetadata?.role as string) || 'Personel'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}

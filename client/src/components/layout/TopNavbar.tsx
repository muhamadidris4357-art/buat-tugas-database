import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  User,
  Sun,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function TopNavbar() {
  const { user, isPlatformOwner, isCompanyAdmin, isEmployee, state } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 border-b border-gray-700 bg-gray-900/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 lg:px-6 h-full">
        {/* Mobile menu + logo */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 text-gray-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">T</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white hidden sm:block">
              TaskSphere
            </span>
          </Link>
        </div>

        {/* Center - breadcrumb / page title (optional) */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="text-gray-400">{getBreadcrumb(location.pathname)}</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotifMenuOpen((prev) => !prev)}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Bell className="h-5 w-5" />
            {state.unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-gray-900" />
            )}
          </button>

          <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
            <button className="flex items-center gap-2 p-1 hover:bg-gray-800 rounded-lg transition-colors group">
              <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600 flex items-center justify-center">
                <span className="text-xs font-medium text-white">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-white" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-100">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profil Saya
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Sun className="h-4 w-4" />
                  Pengaturan
                </Link>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={() => {
                    // placeholder
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOutIcon className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getBreadcrumb(path: string): string {
  const map: Record<string, string> = {
    '/dashboard/owner': 'Platform Owner',
    '/dashboard/admin': 'Admin Perusahaan',
    '/dashboard/employee': 'Karyawan',
    '/tasks': 'Manajemen Tugas',
    '/reports': 'Manajemen Laporan',
    '/reminders': 'Manajemen Pengingat',
    '/users': 'Manajemen Pengguna',
    '/companies': 'Manajemen Perusahaan',
    '/company-profile': 'Profil Perusahaan',
    '/profile': 'Profil',
    '/settings': 'Pengaturan',
    '/activities': 'Riwayat Aktivitas',
  };
  return map[path] || 'Dashboard';
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

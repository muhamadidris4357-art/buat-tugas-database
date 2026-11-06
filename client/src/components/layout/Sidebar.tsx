import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Bell,
  Users,
  Building2,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Activity,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_CONFIG } from '@/lib/utils';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: ('PLATFORM_OWNER' | 'COMPANY_ADMIN' | 'EMPLOYEE')[];
}

const PLATFORM_OWNER_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard/owner', icon: LayoutDashboard, roles: ['PLATFORM_OWNER'] },
  { label: 'Perusahaan', href: '/companies', icon: Building2, roles: ['PLATFORM_OWNER'] },
  { label: 'Pengguna', href: '/users', icon: Users, roles: ['PLATFORM_OWNER'] },
  { label: 'Tugas', href: '/tasks', icon: ClipboardList, roles: ['PLATFORM_OWNER'] },
  { label: 'Laporan', href: '/reports', icon: FileText, roles: ['PLATFORM_OWNER'] },
  { label: 'Pengingat', href: '/reminders', icon: Bell, roles: ['PLATFORM_OWNER'] },
  { label: 'Aktivitas', href: '/activities', icon: Activity, roles: ['PLATFORM_OWNER'] },
  { label: 'Pengaturan', href: '/settings', icon: Settings, roles: ['PLATFORM_OWNER'] },
];

const COMPANY_ADMIN_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['COMPANY_ADMIN'] },
  { label: 'Tugas', href: '/tasks', icon: ClipboardList, roles: ['COMPANY_ADMIN'] },
  { label: 'Laporan', href: '/reports', icon: FileText, roles: ['COMPANY_ADMIN'] },
  { label: 'Pengingat', href: '/reminders', icon: Bell, roles: ['COMPANY_ADMIN'] },
  { label: 'Pengguna', href: '/users', icon: Users, roles: ['COMPANY_ADMIN'] },
  { label: 'Perusahaan', href: '/company-profile', icon: Building2, roles: ['COMPANY_ADMIN'] },
  { label: 'Aktivitas', href: '/activities', icon: Activity, roles: ['COMPANY_ADMIN'] },
  { label: 'Pengaturan', href: '/settings', icon: Settings, roles: ['COMPANY_ADMIN'] },
];

const EMPLOYEE_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard/employee', icon: LayoutDashboard, roles: ['EMPLOYEE'] },
  { label: 'Tugas', href: '/tasks', icon: ClipboardList, roles: ['EMPLOYEE'] },
  { label: 'Laporan', href: '/reports', icon: FileText, roles: ['EMPLOYEE'] },
  { label: 'Pengingat', href: '/reminders', icon: Bell, roles: ['EMPLOYEE'] },
  { label: 'Profil', href: '/profile', icon: ShieldAlert, roles: ['EMPLOYEE'] },
  { label: 'Pengaturan', href: '/settings', icon: Settings, roles: ['EMPLOYEE'] },
];

export function Sidebar() {
  const { user, logout, isPlatformOwner, isCompanyAdmin, isEmployee } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const items = isPlatformOwner()
    ? PLATFORM_OWNER_ITEMS
    : isCompanyAdmin()
      ? COMPANY_ADMIN_ITEMS
      : EMPLOYEE_ITEMS;

  const roleConfig = user ? ROLE_CONFIG[user.role] : ROLE_CONFIG.EMPLOYEE;

  return (
    <>
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-700 bg-gray-900/80 backdrop-blur-md transition-all duration-300',
        collapsed && '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className={cn(collapsed ? 'hidden' : 'block', 'text-xl font-bold tracking-tight text-white')}>
            TaskSphere
          </span>
        </div>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="mt-6 px-3 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {collapsed ? null : item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className={cn(collapsed ? 'hidden' : 'block', 'flex flex-col min-w-0')}>
            <span className="text-sm font-medium text-white truncate">{user?.name || 'Pengguna'}</span>
            <span className={cn('text-xs truncate', roleConfig.color)}>{roleConfig.label}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {collapsed ? null : 'Keluar'}
        </button>
      </div>
    </aside>
    {/* Backdrop for mobile */}
    {!collapsed && (
      <div className="fixed inset-0 z-39 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setCollapsed(true)} />
    )}
    </>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

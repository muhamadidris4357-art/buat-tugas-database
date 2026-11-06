import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#080D1A] text-gray-200 selection:bg-blue-500/30">
      <TopNavbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 lg:pl-64 mt-0 pb-12 relative z-0">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-[#0B1929]">
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav onMenuToggle={() => setMobileSidebarOpen((o) => !o)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6" role="main">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

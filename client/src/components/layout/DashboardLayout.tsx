import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles: Record<string, string> = {
  '/coordinator/dashboard': 'Dashboard',
  '/coordinator/youth': 'Youth Management',
  '/coordinator/jobs': 'Job Management',
  '/coordinator/clients': 'Client Management',
  '/coordinator/reports': 'Reports',
  '/coordinator/notifications': 'Notifications',
  '/youth/jobs': 'My Jobs',
  '/youth/profile': 'My Profile',
  '/youth/earnings': 'Earnings',
  '/youth/notifications': 'Notifications',
  '/client/request': 'Request Service',
  '/client/jobs': 'My Jobs',
  '/client/csr-report': 'CSR Report',
  '/client/notifications': 'Notifications',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-surface-gradient bg-african-pattern">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <Navbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

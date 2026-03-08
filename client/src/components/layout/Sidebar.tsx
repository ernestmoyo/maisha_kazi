import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  BarChart3,
  Bell,
  UserCircle,
  DollarSign,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const roleNavItems: Record<string, NavItem[]> = {
  COORDINATOR: [
    { label: 'Dashboard', path: '/coordinator/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Youth', path: '/coordinator/youth', icon: <Users size={20} /> },
    { label: 'Jobs', path: '/coordinator/jobs', icon: <Briefcase size={20} /> },
    { label: 'Clients', path: '/coordinator/clients', icon: <Building2 size={20} /> },
    { label: 'Reports', path: '/coordinator/reports', icon: <BarChart3 size={20} /> },
    { label: 'Notifications', path: '/coordinator/notifications', icon: <Bell size={20} /> },
  ],
  YOUTH: [
    { label: 'My Jobs', path: '/youth/jobs', icon: <Briefcase size={20} /> },
    { label: 'Profile', path: '/youth/profile', icon: <UserCircle size={20} /> },
    { label: 'Earnings', path: '/youth/earnings', icon: <DollarSign size={20} /> },
    { label: 'Notifications', path: '/youth/notifications', icon: <Bell size={20} /> },
  ],
  CLIENT: [
    { label: 'Request Service', path: '/client/request', icon: <ClipboardList size={20} /> },
    { label: 'My Jobs', path: '/client/jobs', icon: <Briefcase size={20} /> },
    { label: 'CSR Report', path: '/client/csr-report', icon: <BarChart3 size={20} /> },
    { label: 'Notifications', path: '/client/notifications', icon: <Bell size={20} /> },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = roleNavItems[user?.role ?? ''] ?? [];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6 border-b border-white/10">
        <img
          src="/logo.png"
          alt="Maisha Community Initiatives"
          className="w-9 h-9 rounded-lg object-contain bg-white shrink-0 p-0.5"
        />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-base font-heading font-bold text-white tracking-wide">Maisha Kazi</span>
            <span className="text-[10px] text-stone-400 font-body">Community Initiatives</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-stone-400 hover:bg-white/5 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className={`shrink-0 ${isActive ? 'text-accent-light' : 'text-stone-500 group-hover:text-accent-light'} transition-colors`}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-stone-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-stone-500 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            className="mt-3 p-1.5 rounded-md text-stone-500 hover:text-red-400 hover:bg-white/5 transition-colors w-full flex justify-center"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed inset-y-0 left-0 z-30
          bg-dark border-r border-white/5
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        {sidebarContent}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:border-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72
          bg-dark border-r border-white/5
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-stone-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}

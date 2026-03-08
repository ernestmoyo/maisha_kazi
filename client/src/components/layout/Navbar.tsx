import { useState, useRef, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Navbar({ title, onMenuClick }: NavbarProps) {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.notifications ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNotificationClick(id: string) {
    markAsRead.mutate(id);
  }

  function handleMarkAllRead() {
    markAllAsRead.mutate();
    setShowDropdown(false);
  }

  function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-dark-muted hover:bg-stone-100 transition-colors"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-dark truncate">
            {title}
          </h1>
        </div>

        {/* Right: notifications + avatar */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg text-dark-muted hover:bg-stone-100 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-error rounded-full leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200/80 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                  <h3 className="text-sm font-semibold text-dark">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell size={28} className="mx-auto text-stone-300 mb-2" />
                      <p className="text-sm text-dark-subtle">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={`
                          w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors
                          ${!notification.isRead ? 'bg-surface-cool' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {!notification.isRead && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <div className={`flex-1 min-w-0 ${notification.isRead ? 'ml-5' : ''}`}>
                            <p className="text-sm font-medium text-dark truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-dark-subtle mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-dark-muted truncate max-w-[120px]">
              {user?.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

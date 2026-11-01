import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { Menu, LogOut, Bell, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUnreadNotificationsCount } from '@/features/notifications/hooks/useNotifications';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/expenses': 'nav.expenses',
  '/approvals': 'nav.approvals',
  '/budgets': 'nav.budgets',
  '/projects': 'nav.projects',
  '/departments': 'nav.departments',
  '/users': 'nav.users',
  '/analytics': 'nav.analytics',
  '/power-bi': 'nav.powerBi',
  '/activity-logs': 'nav.activityLogs',
  '/notifications': 'nav.notifications',
};

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const titleKey = ROUTE_TITLES[location.pathname] || 'nav.dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight font-display">
          {t(titleKey)}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user?.role && (
          <div className="hidden sm:flex items-center gap-1.5">
            <Badge variant="indigo" size="md" className="gap-1.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t(`roles.${user.role}`)}</span>
            </Badge>
          </div>
        )}

        {/* Notification Entry Point */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-5 w-[1px] bg-stone-200 mx-1" aria-hidden="true" />

        {/* Logout Action */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-stone-600 hover:text-red-700 hover:bg-red-50 text-xs gap-1.5"
          title={t('common.logout')}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">{t('common.logout')}</span>
        </Button>
      </div>
    </header>
  );
};

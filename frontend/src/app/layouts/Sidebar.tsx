import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import type { UserRole } from '@/types/roles.types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Wallet,
  FolderKanban,
  Building2,
  Users,
  LineChart,
  BarChart3,
  Bell,
  ScrollText,
  X,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  nameKey: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    nameKey: 'nav.dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'finance_officer', 'employee'],
  },
  {
    nameKey: 'nav.expenses',
    path: '/expenses',
    icon: Receipt,
    roles: ['admin', 'manager', 'finance_officer', 'employee'],
  },
  {
    nameKey: 'nav.approvals',
    path: '/approvals',
    icon: CheckSquare,
    roles: ['manager'],
  },
  {
    nameKey: 'nav.budgets',
    path: '/budgets',
    icon: Wallet,
    roles: ['admin', 'manager', 'finance_officer'],
  },
  {
    nameKey: 'nav.projects',
    path: '/projects',
    icon: FolderKanban,
    roles: ['admin', 'manager', 'finance_officer', 'employee'],
  },
  {
    nameKey: 'nav.departments',
    path: '/departments',
    icon: Building2,
    roles: ['admin', 'manager', 'finance_officer', 'employee'],
  },
  {
    nameKey: 'nav.analytics',
    path: '/analytics',
    icon: LineChart,
    roles: ['admin', 'manager', 'finance_officer', 'employee'],
  },
  {
    nameKey: 'nav.powerBi',
    path: '/power-bi',
    icon: BarChart3,
    roles: ['admin', 'manager', 'finance_officer'],
  },
  {
    nameKey: 'nav.users',
    path: '/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    nameKey: 'nav.activityLogs',
    path: '/activity-logs',
    icon: ScrollText,
    roles: ['admin', 'manager', 'finance_officer'],
  },
  {
    nameKey: 'nav.notifications',
    path: '/notifications',
    icon: Bell,
    roles: ['admin', 'manager', 'finance_officer', 'employee'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  const userRole = user?.role || 'employee';

  const accessibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Sidebar navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#111322] text-stone-300 flex flex-col border-r border-[#1E223D] transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#1E223D]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight font-display">
                FinSight
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-indigo-400">
                Enterprise
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Navigation
          </div>
          {accessibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }: { isActive: boolean }) =>
                  cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-[#181A2F]'
                  )
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'
                      )}
                    />
                    <span className="truncate">{t(item.nameKey)}</span>
                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/80" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Identity Footer Badge */}
        <div className="p-3 border-t border-[#1E223D]/80">
          <div className="p-3 rounded-xl bg-[#16182E] border border-[#232746] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.email?.slice(0, 2) || 'FS'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.email}
              </p>
              <p className="text-[11px] text-indigo-300/80 truncate capitalize">
                {t(`roles.${user?.role || 'employee'}`)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

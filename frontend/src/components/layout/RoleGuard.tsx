import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import type { UserRole } from '@/types/roles.types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2 font-display">
            {t('common.unauthorizedTitle')}
          </h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            {t('common.unauthorizedDesc')}
          </p>
          <div className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200/60 mb-6 text-xs text-stone-600 flex justify-between">
            <span>Your Active Role:</span>
            <span className="font-semibold text-stone-800 capitalize">
              {t(`roles.${user?.role || 'employee'}`)}
            </span>
          </div>
          <Link to="/dashboard" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.goDashboard')}</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

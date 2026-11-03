import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Receipt,
  Wallet,
  LineChart,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <Card variant="elevated" className="p-6 sm:p-8 border-stone-200/80 dark:border-stone-800 bg-gradient-to-br from-white to-[#FAF9F5] dark:from-[#151A2D] dark:to-[#181D33]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="indigo" size="md">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                {t(`roles.${user?.role || 'employee'}`)}
              </Badge>
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                Session Active
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
              {t('dashboard.welcome')}, {user?.email?.split('@')[0]}
            </h2>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {t('dashboard.overviewSubtitle')} {t('dashboard.roleScopeNotice')}
            </p>
          </div>
        </div>
      </Card>

      {/* Scope & Session Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Authorization Scope</p>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 capitalize">
                {user?.role?.replace('_', ' ')}
              </h4>
            </div>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Frontend route guards enforce client navigation policies while backend guards strictly validate requests.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Platform Status</p>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">All Modules Active</h4>
            </div>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Expenses, budgets, projects, approvals, analytics, and Power BI reporting are operational.
          </p>
        </Card>
      </div>

      {/* Core Enterprise Modules */}
      <Card className="p-6 sm:p-8 border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-display">
              Enterprise Business Modules
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Access your role-scoped workflows, approvals, and financial analytics
            </p>
          </div>
          <Badge variant="success" size="md">
            Operational
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-stone-800 dark:text-stone-200 font-semibold text-sm">
                <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Expenses & Receipts</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                Multipart expense submission with receipt attachments and manager approval workflow.
              </p>
            </div>
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              <span>Manage Expenses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-stone-800 dark:text-stone-200 font-semibold text-sm">
                <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Budgets & Allocations</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                Operational department budgets (OpEx) and project-specific capital allocations (CapEx).
              </p>
            </div>
            <Link
              to="/budgets"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              <span>View Allocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-stone-800 dark:text-stone-200 font-semibold text-sm">
                <LineChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Analytics & Reporting</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                Native Recharts visualizations tied to verified backend DTOs and dedicated Power BI embedding.
              </p>
            </div>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              <span>Open Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/app/layouts/MainLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { NotFoundPage } from '@/components/layout/NotFoundPage';

// Lazy-loaded route chunks for performance and code-splitting
const LandingPage = lazy(() => import('@/features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ExpensesPage = lazy(() => import('@/features/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const ApprovalsPage = lazy(() => import('@/features/approvals/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const BudgetsPage = lazy(() => import('@/features/budgets/BudgetsPage').then(m => ({ default: m.BudgetsPage })));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const DepartmentsPage = lazy(() => import('@/features/departments/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const UsersPage = lazy(() => import('@/features/users/UsersPage').then(m => ({ default: m.UsersPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ActivityLogsPage = lazy(() => import('@/features/activity-logs/ActivityLogsPage').then(m => ({ default: m.ActivityLogsPage })));
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const PowerBIPage = lazy(() => import('@/features/power-bi/PowerBIPage').then(m => ({ default: m.PowerBIPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8" aria-label="Loading workspace">
    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
    <span className="text-xs font-semibold text-stone-500 mt-3 font-display">
      Loading FinSight Workspace...
    </span>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Public Landing Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Root */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Expenses (All Roles) */}
              <Route path="/expenses" element={<ExpensesPage />} />

              {/* Approvals (Manager Only) */}
              <Route element={<RoleGuard allowedRoles={['manager']} />}>
                <Route path="/approvals" element={<ApprovalsPage />} />
              </Route>

            {/* Budgets (Admin, Finance Officer, Manager) */}
            <Route element={<RoleGuard allowedRoles={['admin', 'finance_officer', 'manager']} />}>
              <Route path="/budgets" element={<BudgetsPage />} />
            </Route>

            {/* Projects (All Roles) */}
            <Route path="/projects" element={<ProjectsPage />} />

            {/* Departments (All Roles) */}
            <Route path="/departments" element={<DepartmentsPage />} />

            {/* User Management (Admin Only) */}
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>

            {/* Audit Logs (Admin, Finance Officer, Manager) */}
            <Route element={<RoleGuard allowedRoles={['admin', 'finance_officer', 'manager']} />}>
              <Route path="/activity-logs" element={<ActivityLogsPage />} />
            </Route>

            {/* Notifications (All Roles) */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Native Analytics (Phase 5) */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Dedicated Power BI Dashboard (Phase 6) */}
            <Route element={<RoleGuard allowedRoles={['admin', 'finance_officer', 'manager']} />}>
              <Route path="/power-bi" element={<PowerBIPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Not Found Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
  );
};

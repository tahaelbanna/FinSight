import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage';
import { BudgetsPage } from '@/features/budgets/BudgetsPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { ActivityLogsPage } from '@/features/activity-logs/ActivityLogsPage';
import { MainLayout } from '@/app/layouts/MainLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import { LineChart, BarChart3 } from 'lucide-react';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Root */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Index redirects to Dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
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

            {/* Native Analytics (Phase 5 Placeholder) */}
            <Route
              path="/analytics"
              element={
                <ModulePlaceholder
                  title="Native Analytics"
                  phase="Phase 5"
                  description="Interactive data visualizations built on the five verified analytics DTOs."
                  icon={LineChart}
                  apiEndpoints={[
                    'GET /api/v1/analytics/summary',
                    'GET /api/v1/analytics/monthly-trend',
                    'GET /api/v1/analytics/category-breakdown',
                    'GET /api/v1/analytics/department-comparison',
                    'GET /api/v1/analytics/project-performance',
                  ]}
                />
              }
            />

            {/* Dedicated Power BI Dashboard (Phase 6 Placeholder) */}
            <Route element={<RoleGuard allowedRoles={['admin', 'finance_officer', 'manager']} />}>
              <Route
                path="/power-bi"
                element={
                  <ModulePlaceholder
                    title="Power BI Dashboard"
                    phase="Phase 6"
                    description="Dedicated executive Power BI report embedding container."
                    icon={BarChart3}
                    apiEndpoints={['VITE_POWER_BI_EMBED_URL (iframe embedding)']}
                  />
                }
              />
            </Route>
          </Route>
        </Route>

        {/* 404 Not Found Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { MainLayout } from '@/app/layouts/MainLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { ModulePlaceholder } from '@/components/layout/ModulePlaceholder';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import {
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
} from 'lucide-react';

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
            <Route
              path="/expenses"
              element={
                <ModulePlaceholder
                  title="Expenses"
                  phase="Phase 4"
                  description="Submit expenses, upload receipts, and track approval states."
                  icon={Receipt}
                  apiEndpoints={[
                    'GET /api/v1/expenses',
                    'POST /api/v1/expenses (multipart)',
                    'GET /api/v1/expenses/categories',
                  ]}
                />
              }
            />

            {/* Approvals (Manager Only) */}
            <Route element={<RoleGuard allowedRoles={['manager']} />}>
              <Route
                path="/approvals"
                element={
                  <ModulePlaceholder
                    title="Expense Approvals"
                    phase="Phase 4"
                    description="Review, approve, or reject employee expenses for your department."
                    icon={CheckSquare}
                    apiEndpoints={[
                      'GET /api/v1/approvals/pending',
                      'PATCH /api/v1/approvals/expenses/:id/review',
                    ]}
                  />
                }
              />
            </Route>

            {/* Budgets (Admin, Finance Officer, Manager) */}
            <Route element={<RoleGuard allowedRoles={['admin', 'finance_officer', 'manager']} />}>
              <Route
                path="/budgets"
                element={
                  <ModulePlaceholder
                    title="Budgets & Allocations"
                    phase="Phase 4"
                    description="Manage OpEx department allocations and CapEx project budgets."
                    icon={Wallet}
                    apiEndpoints={[
                      'GET /api/v1/budgets',
                      'POST /api/v1/budgets',
                      'PATCH /api/v1/budgets/:id',
                    ]}
                  />
                }
              />
            </Route>

            {/* Projects (All Roles) */}
            <Route
              path="/projects"
              element={
                <ModulePlaceholder
                  title="Projects"
                  phase="Phase 4"
                  description="View and manage corporate projects and status lifecycles."
                  icon={FolderKanban}
                  apiEndpoints={[
                    'GET /api/v1/projects',
                    'POST /api/v1/projects',
                    'PATCH /api/v1/projects/:id/status',
                  ]}
                />
              }
            />

            {/* Departments (All Roles) */}
            <Route
              path="/departments"
              element={
                <ModulePlaceholder
                  title="Departments"
                  phase="Phase 4"
                  description="View and manage corporate departments and assigned managers."
                  icon={Building2}
                  apiEndpoints={[
                    'GET /api/v1/departments',
                    'POST /api/v1/departments',
                    'PATCH /api/v1/departments/:id',
                  ]}
                />
              }
            />

            {/* Native Analytics (All Roles) */}
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

            {/* Dedicated Power BI Dashboard (Admin, Finance Officer, Manager) */}
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

            {/* User Management (Admin Only) */}
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route
                path="/users"
                element={
                  <ModulePlaceholder
                    title="User Management"
                    phase="Phase 4"
                    description="Provision organization users and assign roles. No public registration."
                    icon={Users}
                    apiEndpoints={[
                      'GET /api/v1/users',
                      'POST /api/v1/users',
                      'PATCH /api/v1/users/:user_id',
                      'PATCH /api/v1/users/:user_id/status',
                    ]}
                  />
                }
              />
            </Route>

            {/* Audit Logs (Admin Only) */}
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route
                path="/activity-logs"
                element={
                  <ModulePlaceholder
                    title="Audit Logs"
                    phase="Phase 4"
                    description="Track system administrative actions and financial audit trails."
                    icon={ScrollText}
                    apiEndpoints={['GET /api/v1/activity-logs']}
                  />
                }
              />
            </Route>

            {/* Notifications (All Roles) */}
            <Route
              path="/notifications"
              element={
                <ModulePlaceholder
                  title="Notifications"
                  phase="Phase 4"
                  description="In-app notification feed for expense review events and status updates."
                  icon={Bell}
                  apiEndpoints={[
                    'GET /api/v1/notifications',
                    'PATCH /api/v1/notifications/:id/read',
                  ]}
                />
              }
            />
          </Route>
        </Route>

        {/* 404 Not Found Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

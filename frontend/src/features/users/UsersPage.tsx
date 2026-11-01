import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useUpdateUserStatus } from './hooks/useUsers';
import type { UserItem, UserRole } from './types/users.types';
import { departmentsService } from '@/features/departments/services/departmentsService';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/feedback/Toast';
import { getFirstErrorMessage } from '@/services/api/errorExtractor';
import { CreateUserModal } from './components/CreateUserModal';
import { EditUserModal } from './components/EditUserModal';
import {
  Plus,
  Users,
  Search,
  Building,
  Edit2,
  UserCheck,
  UserX,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { showSuccess, showError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserItem | null>(null);
  const [userForStatusToggle, setUserForStatusToggle] = useState<UserItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () => departmentsService.getAll({ limit: 100 }),
  });

  const { data, isLoading, error } = useUsers({
    page,
    limit: 10,
    search: search.trim() || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    department_id: departmentFilter || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });

  const updateStatusMutation = useUpdateUserStatus();

  const users = data?.data || [];
  const meta = data?.meta;

  const handleToggleStatus = async () => {
    if (!userForStatusToggle) return;
    setIsTogglingStatus(true);
    const newStatus = !userForStatusToggle.is_active;

    try {
      await updateStatusMutation.mutateAsync({
        id: userForStatusToggle.user_id,
        payload: { is_active: newStatus },
      });
      showSuccess(
        `User "${userForStatusToggle.full_name}" is now ${newStatus ? 'activated' : 'deactivated'}`
      );
      setUserForStatusToggle(null);
    } catch (err) {
      showError(getFirstErrorMessage(err));
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">System Admin</Badge>;
      case 'manager':
        return <Badge variant="info">Manager</Badge>;
      case 'finance_officer':
        return <Badge variant="success">Finance Officer</Badge>;
      case 'employee':
        return <Badge variant="neutral">Employee</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const departments = departmentsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise identity governance, role provisioning, and account lifecycle
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New User</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Role Pills & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'admin', 'manager', 'finance_officer', 'employee'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading user accounts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            Failed to load users. Access is restricted to System Administrators.
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No users found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              There are no user accounts matching the specified filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr
                    key={u.user_id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {u.full_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {u.department ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.department.department_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserForEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setUserForStatusToggle(u)}
                            className={`p-1.5 rounded transition-colors ${
                              u.is_active
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={u.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              meta={meta}
              currentPage={page}
              onPageChange={(p) => setPage(p)}
              isLoading={isLoading}
            />
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <EditUserModal
        user={selectedUserForEdit}
        isOpen={Boolean(selectedUserForEdit)}
        onClose={() => setSelectedUserForEdit(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(userForStatusToggle)}
        title={userForStatusToggle?.is_active ? 'Deactivate User Account' : 'Activate User Account'}
        message={
          userForStatusToggle?.is_active
            ? `Are you sure you want to deactivate ${userForStatusToggle?.full_name}? The user will be immediately blocked from signing in.`
            : `Are you sure you want to activate ${userForStatusToggle?.full_name}? The user will regain access to the platform.`
        }
        confirmLabel={userForStatusToggle?.is_active ? 'Deactivate User' : 'Activate User'}
        variant={userForStatusToggle?.is_active ? 'danger' : 'primary'}
        isLoading={isTogglingStatus}
        onConfirm={handleToggleStatus}
        onClose={() => setUserForStatusToggle(null)}
      />
    </div>
  );
};

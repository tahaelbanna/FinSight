import React, { useState } from 'react';
import { useActivityLogs } from './hooks/useActivityLogs';
import type { ActionType, EntityType } from './types/activityLogs.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import {
  FileText,
  Clock,
  User,
  Building,
  Briefcase,
  PieChart,
  DollarSign,
  Activity,
} from 'lucide-react';

export const ActivityLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState<EntityType | 'all'>('all');
  const [actionFilter, setActionFilter] = useState<ActionType | 'all'>('all');

  const { data, isLoading, error } = useActivityLogs({
    page,
    limit: 15,
    entity_type: entityFilter === 'all' ? undefined : entityFilter,
    action_type: actionFilter === 'all' ? undefined : actionFilter,
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const getActionBadge = (action: ActionType) => {
    if (action.includes('APPROVED') || action.includes('ACTIVATED')) {
      return <Badge variant="success">{action.replace(/_/g, ' ')}</Badge>;
    }
    if (action.includes('REJECTED') || action.includes('DEACTIVATED') || action.includes('DELETED')) {
      return <Badge variant="danger">{action.replace(/_/g, ' ')}</Badge>;
    }
    if (action.includes('UPDATED')) {
      return <Badge variant="warning">{action.replace(/_/g, ' ')}</Badge>;
    }
    if (action.includes('CREATED') || action.includes('SUBMITTED')) {
      return <Badge variant="info">{action.replace(/_/g, ' ')}</Badge>;
    }
    return <Badge variant="neutral">{action.replace(/_/g, ' ')}</Badge>;
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'expense':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'budget':
        return <PieChart className="w-4 h-4 text-indigo-500" />;
      case 'project':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'department':
        return <Building className="w-4 h-4 text-purple-500" />;
      case 'user':
        return <User className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-stone-100">
          System Audit Logs
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Audited activity trail tracking company financial events, user provisioning, and governance operations
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#151A2D] p-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Entity Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'expense', 'budget', 'project', 'department', 'user'] as const).map(
            (entity) => (
              <button
                key={entity}
                onClick={() => {
                  setEntityFilter(entity);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  entityFilter === entity
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {entity === 'all' ? 'All Entities' : entity}
              </button>
            )
          )}
        </div>

        {/* Action Type Dropdown */}
        <div className="w-full sm:w-56">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as ActionType | 'all');
              setPage(1);
            }}
            aria-label="Filter by action type"
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all" className="dark:bg-stone-900">All Action Types</option>
            <option value="EXPENSE_SUBMITTED" className="dark:bg-stone-900">Expense Submitted</option>
            <option value="EXPENSE_APPROVED" className="dark:bg-stone-900">Expense Approved</option>
            <option value="EXPENSE_REJECTED" className="dark:bg-stone-900">Expense Rejected</option>
            <option value="BUDGET_CREATED" className="dark:bg-stone-900">Budget Created</option>
            <option value="BUDGET_UPDATED" className="dark:bg-stone-900">Budget Updated</option>
            <option value="PROJECT_CREATED" className="dark:bg-stone-900">Project Created</option>
            <option value="PROJECT_UPDATED" className="dark:bg-stone-900">Project Updated</option>
            <option value="DEPARTMENT_CREATED" className="dark:bg-stone-900">Department Created</option>
            <option value="DEPARTMENT_UPDATED" className="dark:bg-stone-900">Department Updated</option>
            <option value="DEPARTMENT_DELETED" className="dark:bg-stone-900">Department Deleted</option>
            <option value="USER_CREATED" className="dark:bg-stone-900">User Created</option>
            <option value="USER_UPDATED" className="dark:bg-stone-900">User Updated</option>
            <option value="USER_ACTIVATED" className="dark:bg-stone-900">User Activated</option>
            <option value="USER_DEACTIVATED" className="dark:bg-stone-900">User Deactivated</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs bg-white dark:bg-[#151A2D]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Loading activity trail...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 dark:text-rose-400">
            Failed to load audit logs. Access is restricted to Managers, Finance Officers, and Administrators.
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              No activity recorded
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
              There are no audit events matching the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50/75 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Action</th>
                  <th scope="col" className="py-3 px-4">Entity</th>
                  <th scope="col" className="py-3 px-4">Performing Actor</th>
                  <th scope="col" className="py-3 px-4">Target ID</th>
                  <th scope="col" className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {logs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">{getActionBadge(log.action_type)}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entity_type)}
                        <span className="font-medium text-stone-900 dark:text-stone-100 capitalize">
                          {log.entity_type}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-300">
                        <User className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                        <span className="font-semibold">{log.user?.full_name || 'System'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-stone-500 dark:text-stone-400 max-w-[140px] truncate">
                      {log.entity_id}
                    </td>

                    <td className="py-3.5 px-4 text-right text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <div className="p-4 bg-white dark:bg-[#151A2D] border-t border-stone-100 dark:border-stone-800">
            <Pagination
              meta={meta}
              currentPage={page}
              onPageChange={(p) => setPage(p)}
              isLoading={isLoading}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

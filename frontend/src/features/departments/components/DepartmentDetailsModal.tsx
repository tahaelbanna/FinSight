import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDepartment } from '../hooks/useDepartments';
import { Building, User, Users, Calendar } from 'lucide-react';

interface DepartmentDetailsModalProps {
  departmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({
  departmentId,
  isOpen,
  onClose,
}) => {
  const { data: department, isLoading, error } = useDepartment(departmentId || '');

  if (!isOpen) return null;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Department Details" maxWidth="lg">
      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || !department ? (
        <div className="py-8 text-center text-rose-500">
          Failed to load department details. Please try again.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  {department.department_name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {department.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formatDate(department.created_at)}</span>
                </div>
              </div>
            </div>

            <Badge variant="info">OpEx Entity</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Designated Manager</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {department.manager?.manager_name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Total Personnel</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {department.usersCount ?? (department as any).users?.length ?? 0} Members
                </p>
              </div>
            </div>
          </div>

          {/* Department Users / Staff if provided */}
          {(department as any).users && (department as any).users.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Department Personnel ({(department as any).users.length})
              </h4>
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {(department as any).users.map((u: any) => (
                  <div
                    key={u.user_id}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {u.full_name}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <Badge variant="neutral" className="text-[10px] capitalize">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

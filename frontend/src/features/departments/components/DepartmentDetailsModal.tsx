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
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 font-display">
                  {department.department_name}
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  {department.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formatDate(department.created_at)}</span>
                </div>
              </div>
            </div>

            <Badge variant="info">OpEx Entity</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-100 text-stone-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500">Designated Manager</span>
                <p className="text-sm font-semibold text-stone-900">
                  {department.manager?.manager_name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-stone-100 text-stone-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500">Total Personnel</span>
                <p className="text-sm font-semibold text-stone-900">
                  {department.usersCount ?? (department as any).users?.length ?? 0} Members
                </p>
              </div>
            </div>
          </div>

          {/* Department Users / Staff if provided */}
          {(department as any).users && (department as any).users.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-3">
                Department Personnel ({(department as any).users.length})
              </h4>
              <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 max-h-56 overflow-y-auto">
                {(department as any).users.map((u: any) => (
                  <div
                    key={u.user_id}
                    className="p-3 bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {u.full_name}
                      </p>
                      <p className="text-xs text-stone-500">{u.email}</p>
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

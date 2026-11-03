import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDepartments, useDeleteDepartment } from './hooks/useDepartments';
import type { DepartmentItem } from './services/departmentsService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/feedback/Toast';
import { getFirstErrorMessage } from '@/services/api/errorExtractor';
import { CreateDepartmentModal } from './components/CreateDepartmentModal';
import { EditDepartmentModal } from './components/EditDepartmentModal';
import { DepartmentDetailsModal } from './components/DepartmentDetailsModal';
import {
  Plus,
  Building,
  User,
  Users,
  Search,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showSuccess, showError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDeptForEdit, setSelectedDeptForEdit] = useState<DepartmentItem | null>(null);
  const [selectedDeptIdForDetails, setSelectedDeptIdForDetails] = useState<string | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<DepartmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error } = useDepartments({
    page,
    limit: 10,
    search: search.trim() || undefined,
  });

  const deleteDeptMutation = useDeleteDepartment();

  const departments = data?.data || [];
  const meta = data?.meta;

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDeptMutation.mutateAsync(deptToDelete.department_id);
      showSuccess(`Department "${deptToDelete.department_name}" removed successfully`);
      setDeptToDelete(null);
    } catch (err) {
      showError(getFirstErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-stone-100">
            Departments
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Organizational business units, leadership assignments, and OpEx cost centers
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Department</span>
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#151A2D] p-3 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search departments by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Departments Table */}
      <Card className="overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs bg-white dark:bg-[#151A2D]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Loading departments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 dark:text-rose-400">
            Failed to load departments. Please try refreshing.
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              No departments found
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
              There are no departments matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50/75 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Department</th>
                  <th scope="col" className="py-3 px-4">Description</th>
                  <th scope="col" className="py-3 px-4">Manager</th>
                  <th scope="col" className="py-3 px-4">Personnel</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {departments.map((d) => (
                  <tr
                    key={d.department_id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        <span>{d.department_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-stone-600 dark:text-stone-400 max-w-xs truncate">
                      {d.description}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-stone-900 dark:text-stone-100">
                        <User className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                        <span>{d.manager?.manager_name || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                        <Users className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                        <span>{d.usersCount ?? 0} members</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDeptIdForDetails(d.department_id)}
                          className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                          title="View Details"
                          aria-label={`View details for ${d.department_name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setSelectedDeptForEdit(d)}
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                              title="Edit Department"
                              aria-label={`Edit ${d.department_name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeptToDelete(d)}
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              title="Delete Department"
                              aria-label={`Delete ${d.department_name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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

      {/* Modals */}
      <CreateDepartmentModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <EditDepartmentModal
        department={selectedDeptForEdit}
        isOpen={Boolean(selectedDeptForEdit)}
        onClose={() => setSelectedDeptForEdit(null)}
      />

      <DepartmentDetailsModal
        departmentId={selectedDeptIdForDetails}
        isOpen={Boolean(selectedDeptIdForDetails)}
        onClose={() => setSelectedDeptIdForDetails(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deptToDelete)}
        title="Delete Department"
        message={`Are you sure you want to delete the department "${deptToDelete?.department_name}"? This action cannot be undone if projects or expenses are linked.`}
        confirmLabel="Delete Department"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeptToDelete(null)}
      />
    </div>
  );
};

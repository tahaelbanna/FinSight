import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { useToast } from '@/components/feedback/Toast';
import { usersService } from '@/features/users/services/usersService';
import { useUpdateDepartment } from '../hooks/useDepartments';
import type { DepartmentItem } from '../services/departmentsService';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const editDepartmentSchema = z.object({
  department_name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  manager_id: z.string().min(1, 'Please select a designated department manager'),
});

type EditDepartmentFormData = z.infer<typeof editDepartmentSchema>;

interface EditDepartmentModalProps {
  department: DepartmentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  department,
  isOpen,
  onClose,
}) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: managersData } = useQuery({
    queryKey: ['users', 'managers'],
    queryFn: () => usersService.getAll({ role: 'manager', is_active: true, limit: 100 }),
    enabled: isOpen,
  });

  const updateDeptMutation = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditDepartmentFormData>({
    resolver: zodResolver(editDepartmentSchema) as any,
  });

  useEffect(() => {
    if (department) {
      reset({
        department_name: department.department_name,
        description: department.description,
        manager_id: department.manager?.manager_id || '',
      });
      setGeneralError(null);
    }
  }, [department, reset]);

  if (!department) return null;

  const onSubmit = async (data: EditDepartmentFormData) => {
    setGeneralError(null);
    try {
      await updateDeptMutation.mutateAsync({
        id: department.department_id,
        body: {
          department_name: data.department_name.trim(),
          description: data.description.trim(),
          manager_id: data.manager_id,
        },
      });

      showSuccess('Department updated successfully');
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof EditDepartmentFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  const managers = managersData?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Department" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <Input
          label="Department Name"
          error={errors.department_name?.message}
          {...register('department_name')}
        />

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>
          )}
        </div>

        <Select
          label="Department Manager"
          options={managers.map((m) => ({
            value: m.user_id,
            label: `${m.full_name} (${m.email})`,
          }))}
          placeholder="Select an active manager..."
          error={errors.manager_id?.message}
          {...register('manager_id')}
        />

        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

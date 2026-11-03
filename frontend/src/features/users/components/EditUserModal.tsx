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
import { departmentsService } from '@/features/departments/services/departmentsService';
import { useUpdateUser } from '../hooks/useUsers';
import type { UserItem, UserRole } from '../types/users.types';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const editUserSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['admin', 'manager', 'finance_officer', 'employee']),
    department_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'manager' || data.role === 'employee') {
        return Boolean(data.department_id);
      }
      return true;
    },
    {
      message: 'Department is required for managers and employees',
      path: ['department_id'],
    }
  );

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose }) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () => departmentsService.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  const updateUserMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema) as any,
  });

  const selectedRole = watch('role');
  const needsDepartment = selectedRole === 'employee' || selectedRole === 'manager';

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        role: user.role,
        department_id: user.department?.department_id || '',
      });
      setGeneralError(null);
    }
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = async (data: EditUserFormData) => {
    setGeneralError(null);
    try {
      await updateUserMutation.mutateAsync({
        id: user.user_id,
        payload: {
          full_name: data.full_name.trim(),
          role: data.role as UserRole,
          department_id: needsDepartment ? data.department_id : undefined,
        },
      });

      showSuccess(`Profile for ${data.full_name} updated successfully`);
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof EditUserFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  const departments = departmentsData?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800 text-xs">
          <span className="text-stone-500 dark:text-stone-400 font-medium">Account Email: </span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">{user.email}</span>
        </div>

        <Input
          label="Full Legal Name"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Select
          label="Assigned System Role"
          options={[
            { value: 'employee', label: 'Employee (Submit Claims)' },
            { value: 'manager', label: 'Manager (Approve Department Claims)' },
            { value: 'finance_officer', label: 'Finance Officer (Allocate Budgets & Audits)' },
            { value: 'admin', label: 'System Admin (Full Governance)' },
          ]}
          error={errors.role?.message}
          {...register('role')}
        />

        {needsDepartment && (
          <Select
            label="Assigned Department"
            options={departments.map((d) => ({
              value: d.department_id,
              label: d.department_name,
            }))}
            placeholder="Select department..."
            error={errors.department_id?.message}
            {...register('department_id')}
          />
        )}

        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
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

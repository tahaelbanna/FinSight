import React, { useState } from 'react';
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
import { useCreateUser } from '../hooks/useUsers';
import type { UserRole } from '../types/users.types';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const createUserSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid work email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
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

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () => departmentsService.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'employee',
      department_id: '',
    },
  });

  const selectedRole = watch('role');
  const needsDepartment = selectedRole === 'employee' || selectedRole === 'manager';

  const onSubmit = async (data: CreateUserFormData) => {
    setGeneralError(null);
    try {
      await createUserMutation.mutateAsync({
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        password_hash: data.password,
        role: data.role as UserRole,
        department_id: needsDepartment ? data.department_id : undefined,
      });

      showSuccess(`User account for ${data.full_name} created successfully`);
      reset();
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof CreateUserFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  const departments = departmentsData?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Enterprise User" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <Input
          label="Full Legal Name"
          placeholder="e.g. John Doe"
          error={errors.full_name?.message}
          {...register('full_name')}
        />

        <Input
          label="Corporate Email Address"
          type="email"
          placeholder="e.g. j.doe@finsight.internal"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Initial Password"
          type="password"
          placeholder="Minimum 6 characters"
          error={errors.password?.message}
          {...register('password')}
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

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
};

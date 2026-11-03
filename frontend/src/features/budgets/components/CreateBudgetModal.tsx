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
import { projectsService } from '@/features/projects/services/projectsService';
import { useCreateBudget } from '../hooks/useBudgets';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const createBudgetSchema = z
  .object({
    scope: z.enum(['department', 'project']),
    department_id: z.string().optional(),
    project_id: z.string().optional(),
    allocated_amount: z.coerce.number().positive('Allocated amount must be greater than 0'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => {
      if (data.scope === 'department') return Boolean(data.department_id);
      if (data.scope === 'project') return Boolean(data.project_id);
      return false;
    },
    {
      message: 'Please select a specific scope target',
      path: ['scope'],
    }
  )
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) > new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'End date must be strictly after start date',
      path: ['end_date'],
    }
  );

type CreateBudgetFormData = z.infer<typeof createBudgetSchema>;

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({ isOpen, onClose }) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () => departmentsService.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'options'],
    queryFn: () => projectsService.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  const createBudgetMutation = useCreateBudget();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateBudgetFormData>({
    resolver: zodResolver(createBudgetSchema) as any,
    defaultValues: {
      scope: 'department',
      department_id: '',
      project_id: '',
      allocated_amount: undefined,
      start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    },
  });

  const selectedScope = watch('scope');

  const onSubmit = async (data: CreateBudgetFormData) => {
    setGeneralError(null);
    try {
      await createBudgetMutation.mutateAsync({
        department_id: data.scope === 'department' ? data.department_id : undefined,
        project_id: data.scope === 'project' ? data.project_id : undefined,
        allocated_amount: data.allocated_amount,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
      });

      showSuccess('Budget allocated successfully');
      reset();
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof CreateBudgetFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  const departments = departmentsData?.data || [];
  const projects = projectsData?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate New Budget" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        {/* Scope selector */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Budget Scope Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedScope === 'department'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-500'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <input
                type="radio"
                value="department"
                {...register('scope')}
                className="sr-only"
              />
              <span>Department (OpEx)</span>
            </label>

            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedScope === 'project'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-500'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <input
                type="radio"
                value="project"
                {...register('scope')}
                className="sr-only"
              />
              <span>Project (CapEx)</span>
            </label>
          </div>
          {errors.scope && (
            <p className="mt-1 text-xs text-rose-500">{errors.scope.message}</p>
          )}
        </div>

        {/* Dynamic target based on scope */}
        {selectedScope === 'department' ? (
          <Select
            label="Department"
            options={departments.map((d) => ({
              value: d.department_id,
              label: d.department_name,
            }))}
            placeholder="Select department..."
            error={errors.department_id?.message}
            {...register('department_id')}
          />
        ) : (
          <Select
            label="Project"
            options={projects.map((p) => ({
              value: p.project_id,
              label: `${p.project_name} (${p.department.department_name})`,
            }))}
            placeholder="Select project..."
            error={errors.project_id?.message}
            {...register('project_id')}
          />
        )}

        {/* Allocated Amount */}
        <Input
          label="Allocated Amount ($)"
          type="number"
          step="0.01"
          placeholder="e.g. 50000.00"
          error={errors.allocated_amount?.message}
          {...register('allocated_amount')}
        />

        {/* Period Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />
          <Input
            label="End Date"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Allocate Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};

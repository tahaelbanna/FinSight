import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { useToast } from '@/components/feedback/Toast';
import { useUpdateBudget } from '../hooks/useBudgets';
import type { BudgetItem } from '../types/budgets.types';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const editBudgetSchema = z
  .object({
    allocated_amount: z.coerce.number().positive('Allocated amount must be greater than 0'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
  })
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

type EditBudgetFormData = z.infer<typeof editBudgetSchema>;

interface EditBudgetModalProps {
  budget: BudgetItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ budget, isOpen, onClose }) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const updateBudgetMutation = useUpdateBudget();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditBudgetFormData>({
    resolver: zodResolver(editBudgetSchema) as any,
  });

  useEffect(() => {
    if (budget) {
      reset({
        allocated_amount: Number(budget.allocated_amount),
        start_date: budget.start_date ? new Date(budget.start_date).toISOString().split('T')[0] : '',
        end_date: budget.end_date ? new Date(budget.end_date).toISOString().split('T')[0] : '',
      });
      setGeneralError(null);
    }
  }, [budget, reset]);

  if (!budget) return null;

  const scopeLabel = budget.department
    ? `Department: ${budget.department.name} (OpEx)`
    : budget.project
    ? `Project: ${budget.project.name} (CapEx)`
    : 'Unassigned Scope';

  const onSubmit = async (data: EditBudgetFormData) => {
    setGeneralError(null);
    try {
      await updateBudgetMutation.mutateAsync({
        id: budget.budget_id,
        payload: {
          allocated_amount: data.allocated_amount,
          start_date: new Date(data.start_date).toISOString(),
          end_date: new Date(data.end_date).toISOString(),
        },
      });

      showSuccess('Budget updated successfully');
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof EditBudgetFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Budget" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Budget Target</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{scopeLabel}</p>
        </div>

        <Input
          label="Allocated Amount ($)"
          type="number"
          step="0.01"
          error={errors.allocated_amount?.message}
          {...register('allocated_amount')}
        />

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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

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
import { useExpenseCategories, useSubmitExpense } from '../hooks/useExpenses';
import { departmentsService } from '@/features/departments/services/departmentsService';
import { projectsService } from '@/features/projects/services/projectsService';
import { extractApiErrors } from '@/services/api/errorExtractor';
import { Upload, FileText, X } from 'lucide-react';

const createExpenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  expense_date: z.string().min(1, 'Expense date is required'),
  category_id: z.string().min(1, 'Category is required'),
  department_id: z.string().min(1, 'Department is required'),
  project_id: z.string().optional(),
  description: z.string().min(3, 'Description must be at least 3 characters'),
});

type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: categories = [] } = useExpenseCategories();
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

  const submitExpenseMutation = useSubmitExpense();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: {
      amount: undefined,
      expense_date: new Date().toISOString().split('T')[0],
      category_id: '',
      department_id: '',
      project_id: '',
      description: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setFileError('You can upload a maximum of 5 receipts.');
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['png', 'jpg', 'jpeg', 'pdf'].includes(ext || '')) {
        setFileError(`"${file.name}" has an unsupported format. Allowed: PNG, JPG, PDF.`);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateExpenseFormData) => {
    setGeneralError(null);
    try {
      const formData = new FormData();
      formData.append('amount', String(data.amount));
      formData.append('expense_date', data.expense_date);
      formData.append('category_id', data.category_id);
      formData.append('department_id', data.department_id);
      formData.append('description', data.description);
      if (data.project_id) {
        formData.append('project_id', data.project_id);
      }

      selectedFiles.forEach((file) => {
        formData.append('receipts', file);
      });

      await submitExpenseMutation.mutateAsync(formData);
      showSuccess('Expense submitted successfully and forwarded for review.');
      reset();
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (Object.keys(extracted.fieldErrors).length > 0) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as any, { type: 'server', message: msg });
        });
      }
      if (extracted.generalErrors.length > 0) {
        setGeneralError(extracted.generalErrors.join('. '));
      } else if (Object.keys(extracted.fieldErrors).length === 0) {
        setGeneralError('Failed to submit expense. Please check input values.');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit New Expense" subtitle="Upload receipts and submit for department review" maxWidth="lg">
      {generalError && (
        <div className="mb-4">
          <Alert variant="danger">{generalError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount ($ USD)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />

          <Input
            label="Expense Date"
            type="date"
            error={errors.expense_date?.message}
            {...register('expense_date')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Expense Category"
            placeholder="Select category..."
            options={categories.map((c) => ({
              value: c.category_id,
              label: c.category_name,
            }))}
            error={errors.category_id?.message}
            {...register('category_id')}
          />

          <Select
            label="Department"
            placeholder="Select department..."
            options={(departmentsData?.data || []).map((d) => ({
              value: d.department_id,
              label: d.department_name,
            }))}
            error={errors.department_id?.message}
            {...register('department_id')}
          />
        </div>

        <Select
          label="Project (Optional - CapEx)"
          placeholder="None (Direct Department OpEx)"
          options={(projectsData?.data || []).map((p) => ({
            value: p.project_id,
            label: `${p.project_name} (${p.department?.department_name || 'Project'})`,
          }))}
          error={errors.project_id?.message}
          {...register('project_id')}
        />

        <div className="flex flex-col gap-1.5 text-start">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Description / Justification
          </label>
          <textarea
            rows={3}
            placeholder="Provide business context, vendor details, and expense purpose..."
            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-stone-300 transition-colors"
            {...register('description')}
          />
          {errors.description?.message && (
            <p className="text-xs font-medium text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* File Receipts Upload */}
        <div className="flex flex-col gap-1.5 text-start pt-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Receipt Attachments (PNG, JPG, PDF up to 5MB, max 5)
          </label>
          <div className="border-2 border-dashed border-stone-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-stone-50/40">
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-1.5 text-stone-500">
              <Upload className="w-6 h-6 text-indigo-500" />
              <p className="text-xs font-medium">
                Click to browse or drag and drop receipts
              </p>
            </div>
          </div>
          {fileError && <p className="text-xs font-medium text-red-600">{fileError}</p>}

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-xs border border-indigo-200/60"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-0.5 hover:text-red-700 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting || submitExpenseMutation.isPending}
          >
            Submit Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};

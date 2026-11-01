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
import { useCreateProject } from '../hooks/useProjects';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const createProjectSchema = z
  .object({
    project_name: z.string().min(2, 'Project name must be at least 2 characters'),
    department_id: z.string().min(1, 'Department is required'),
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

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () => departmentsService.getAll({ limit: 100 }),
    enabled: isOpen,
  });

  const createProjectMutation = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema) as any,
    defaultValues: {
      project_name: '',
      department_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
    },
  });

  const onSubmit = async (data: CreateProjectFormData) => {
    setGeneralError(null);
    try {
      await createProjectMutation.mutateAsync({
        project_name: data.project_name.trim(),
        department_id: data.department_id,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
      });

      showSuccess('Project created successfully');
      reset();
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof CreateProjectFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  const departments = departmentsData?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <Input
          label="Project Name"
          placeholder="e.g. Cloud Migration Phase 1"
          error={errors.project_name?.message}
          {...register('project_name')}
        />

        <Select
          label="Responsible Department"
          options={departments.map((d) => ({
            value: d.department_id,
            label: d.department_name,
          }))}
          placeholder="Select department..."
          error={errors.department_id?.message}
          {...register('department_id')}
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

        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

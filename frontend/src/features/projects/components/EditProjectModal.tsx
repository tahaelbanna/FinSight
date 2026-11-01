import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { useToast } from '@/components/feedback/Toast';
import { useUpdateProject } from '../hooks/useProjects';
import type { ProjectItem } from '../services/projectsService';
import { extractApiErrors, getFirstErrorMessage } from '@/services/api/errorExtractor';

const editProjectSchema = z
  .object({
    project_name: z.string().min(2, 'Project name must be at least 2 characters'),
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

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectModalProps {
  project: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { showSuccess } = useToast();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const updateProjectMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema) as any,
  });

  useEffect(() => {
    if (project) {
      reset({
        project_name: project.project_name,
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
      });
      setGeneralError(null);
    }
  }, [project, reset]);

  if (!project) return null;

  const onSubmit = async (data: EditProjectFormData) => {
    setGeneralError(null);
    try {
      await updateProjectMutation.mutateAsync({
        id: project.project_id,
        body: {
          project_name: data.project_name.trim(),
          start_date: new Date(data.start_date).toISOString(),
          end_date: new Date(data.end_date).toISOString(),
        },
      });

      showSuccess('Project updated successfully');
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.fieldErrors) {
        Object.entries(extracted.fieldErrors).forEach(([field, msg]) => {
          setError(field as keyof EditProjectFormData, { message: msg });
        });
      }
      setGeneralError(getFirstErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Details" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
          <span className="text-stone-500 font-medium">Department: </span>
          <span className="font-semibold text-stone-900">
            {project.department.department_name}
          </span>
        </div>

        <Input
          label="Project Name"
          error={errors.project_name?.message}
          {...register('project_name')}
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

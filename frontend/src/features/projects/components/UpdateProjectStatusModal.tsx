import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { useToast } from '@/components/feedback/Toast';
import { useUpdateProjectStatus } from '../hooks/useProjects';
import type { ProjectItem, ProjectStatus } from '../services/projectsService';
import { getFirstErrorMessage } from '@/services/api/errorExtractor';

interface UpdateProjectStatusModalProps {
  project: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateProjectStatusModal: React.FC<UpdateProjectStatusModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { showSuccess } = useToast();
  const [status, setStatus] = useState<ProjectStatus>('planned');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatusMutation = useUpdateProjectStatus();

  React.useEffect(() => {
    if (project) {
      setStatus(project.status);
      setGeneralError(null);
    }
  }, [project]);

  if (!project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await updateStatusMutation.mutateAsync({
        id: project.project_id,
        status,
      });

      showSuccess(`Project status changed to ${status}`);
      onClose();
    } catch (err) {
      setGeneralError(getFirstErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'planned', label: 'Planned' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Project Status" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Project</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {project.project_name}
          </p>
        </div>

        <Select
          label="New Lifecycle Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          options={statusOptions}
        />

        <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import type { UserRole } from '@/types/roles.types';

export type PowerBIReportId =
  | 'executive-summary'
  | 'department-comparison'
  | 'expense-audit';

export interface PowerBIReportMeta {
  id: PowerBIReportId;
  title: string;
  subtitle: string;
  description: string;
  category: 'Executive' | 'Department' | 'Compliance';
  allowedRoles: UserRole[];
  defaultReportId?: string;
  embedUrl?: string;
}

export type PowerBIEmbedState =
  | 'unconfigured'
  | 'loading'
  | 'rendered'
  | 'error';

export interface PowerBIConfigState {
  isConfigured: boolean;
  workspaceId?: string;
  reportId?: string;
  embedUrl?: string;
  embedToken?: string;
  missingVariables: string[];
}

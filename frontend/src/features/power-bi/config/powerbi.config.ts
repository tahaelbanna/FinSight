import type { PowerBIReportMeta, PowerBIConfigState } from '../types/powerbi.types';
import type { UserRole } from '../../../types/roles.types';

/**
 * FinSight Power BI Enterprise Reports Catalog
 * Maps designated reports to authorized organizational roles
 */
export const POWER_BI_REPORTS: PowerBIReportMeta[] = [
  {
    id: 'executive-summary',
    title: 'Executive Financial Overview & KPI Suite',
    subtitle: 'Consolidated OpEx & CapEx velocity and executive KPIs',
    description:
      'High-level executive metrics adhering to Model B accounting, tracking consolidated organizational spend against approved annual budgets.',
    category: 'Executive',
    allowedRoles: ['admin', 'finance_officer'],
  },
  {
    id: 'department-comparison',
    title: 'Department Budget Variance & CapEx Realization',
    subtitle: 'Department operational budgets vs independent project capital investments',
    description:
      'Comparative cross-departmental view highlighting spending velocity, project realization, and overrun risk.',
    category: 'Department',
    allowedRoles: ['admin', 'finance_officer', 'manager'],
  },
  {
    id: 'expense-audit',
    title: 'Expense Claim Audit & Policy Compliance',
    subtitle: 'Manager review turnaround, claim categories, and policy adherence',
    description:
      'Audit trail analytics analyzing submission cycles, rejection rates with reasons, and categorical expense distributions.',
    category: 'Compliance',
    allowedRoles: ['admin', 'finance_officer', 'manager'],
  },
];

/**
 * Filter catalog reports according to the current user's role
 */
export function getReportsForRole(role?: UserRole): PowerBIReportMeta[] {
  if (!role) return [];
  return POWER_BI_REPORTS.filter((report) => report.allowedRoles.includes(role));
}

/**
 * Read and validate public client-side environment configuration
 */
export function getPowerBIConfig(): PowerBIConfigState {
  const workspaceId = import.meta.env.VITE_POWER_BI_WORKSPACE_ID as string | undefined;
  const reportId = import.meta.env.VITE_POWER_BI_REPORT_ID as string | undefined;
  const embedUrl = import.meta.env.VITE_POWER_BI_EMBED_URL as string | undefined;
  const embedToken = import.meta.env.VITE_POWER_BI_EMBED_TOKEN as string | undefined;

  const missingVariables: string[] = [];
  if (!embedUrl) missingVariables.push('VITE_POWER_BI_EMBED_URL');
  if (!reportId) missingVariables.push('VITE_POWER_BI_REPORT_ID');
  if (!workspaceId) missingVariables.push('VITE_POWER_BI_WORKSPACE_ID');

  // To be considered fully configured for embedding, a valid embed URL and report ID must be present
  const isConfigured = Boolean(embedUrl && reportId && embedToken);

  return {
    isConfigured,
    workspaceId: workspaceId || undefined,
    reportId: reportId || undefined,
    embedUrl: embedUrl || undefined,
    embedToken: embedToken || undefined,
    missingVariables,
  };
}

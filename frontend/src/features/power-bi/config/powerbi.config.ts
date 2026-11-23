import type { PowerBIReportMeta, PowerBIConfigState } from '../types/powerbi.types';
import type { UserRole } from '../../../types/roles.types';

/**
 * Designated FinSight Power BI Live Embed Configuration
 * Target Dashboard: FinSight Power BI Dashboard
 * Aspect Ratio: 1140 x 541.25 (~2.106:1)
 */
export const DEFAULT_POWER_BI_EMBED_URL =
  'https://app.powerbi.com/reportEmbed?reportId=809f893e-e567-4844-aa24-10971c2c07dc&autoAuth=true&ctid=27a388d0-1a33-462f-a48b-52c5342daf56';

export const DEFAULT_POWER_BI_REPORT_ID = '809f893e-e567-4844-aa24-10971c2c07dc';
export const DEFAULT_POWER_BI_TENANT_ID = '27a388d0-1a33-462f-a48b-52c5342daf56';

/**
 * FinSight Power BI Enterprise Reports Catalog
 */
export const POWER_BI_REPORTS: PowerBIReportMeta[] = [
  {
    id: 'executive-summary',
    title: 'FinSight Enterprise Financial Dashboard',
    subtitle: 'Model B Dual-Stream OpEx & CapEx spend intelligence',
    description:
      'Executive-level financial reporting adhering to Model B accounting, tracking consolidated organizational spend, department variances, and project capital allocations.',
    category: 'Executive',
    allowedRoles: ['admin', 'finance_officer', 'manager'],
    embedUrl: DEFAULT_POWER_BI_EMBED_URL,
    defaultReportId: DEFAULT_POWER_BI_REPORT_ID,
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
 * Read and validate client-side Power BI configuration.
 * Defaults to the designated live report embed URL.
 */
export function getPowerBIConfig(): PowerBIConfigState {
  const embedUrl =
    (import.meta.env.VITE_POWER_BI_EMBED_URL as string | undefined) ||
    DEFAULT_POWER_BI_EMBED_URL;
  const reportId =
    (import.meta.env.VITE_POWER_BI_REPORT_ID as string | undefined) ||
    DEFAULT_POWER_BI_REPORT_ID;
  const workspaceId = import.meta.env.VITE_POWER_BI_WORKSPACE_ID as string | undefined;

  return {
    isConfigured: Boolean(embedUrl),
    workspaceId: workspaceId || undefined,
    reportId,
    embedUrl,
    missingVariables: [],
  };
}

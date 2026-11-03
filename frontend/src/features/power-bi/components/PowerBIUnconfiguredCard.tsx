import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Terminal,
  FileCode2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PowerBIUnconfiguredCardProps {
  missingVariables: string[];
}

export const PowerBIUnconfiguredCard: React.FC<PowerBIUnconfiguredCardProps> = ({
  missingVariables,
}) => {
  return (
    <Card className="p-6 sm:p-8 bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="indigo" size="sm">
                Power BI Embedded Engine
              </Badge>
              <Badge variant="warning" size="sm">
                Azure Workspace Configuration Required
              </Badge>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
              Enterprise Power BI Reporting Architecture Ready
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-2xl leading-relaxed">
              The frontend is fully instrumented with the official <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">powerbi-client-react</code> runtime. Connecting your live Microsoft Power BI reports requires configuring your Azure Active Directory Service Principal and Workspace credentials.
            </p>
          </div>
        </div>

        <Link to="/analytics" className="shrink-0">
          <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <span>Explore Native Analytics</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Grid: Setup Checklist & Security Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Setup Checklist */}
        <div className="p-5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/70 dark:border-stone-800 space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-display">
              Activation Checklist
            </h4>
          </div>

          <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">Azure AD App Registration</strong>
                Register a Service Principal in Microsoft Entra ID with Power BI Service API permissions.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">Power BI Workspace Access</strong>
                Grant the Service Principal Member or Admin access to the dedicated Power BI workspace.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">Deploy Financial Reports (.pbix)</strong>
                Publish FinSight OpEx & CapEx reports and acquire Report and Workspace IDs.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-stone-900 dark:text-stone-100 block">Set Environment Variables</strong>
                Populate frontend and backend configuration files as detailed below.
              </div>
            </div>
          </div>
        </div>

        {/* Security & Token Architecture */}
        <div className="p-5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/70 dark:border-stone-800 space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-display">
              Enterprise Security Standards
            </h4>
          </div>

          <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Confidential Financial Data Policy:</strong> Public "Publish to Web" embedding is strictly disabled to prevent confidential organizational balance exposure.
              </span>
            </div>

            <p>
              In accordance with Microsoft security best practices, sensitive Azure client secrets and tenant credentials are kept entirely on the server side and are never exposed in frontend bundles.
            </p>

            <p>
              When activated, an authenticated backend endpoint generates short-lived Power BI Embed tokens with row-level security (RLS) mapped to the user&apos;s department.
            </p>
          </div>
        </div>
      </div>

      {/* Environment Variables Reference */}
      <div className="p-5 rounded-2xl bg-[#111322] text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Frontend Environment Specifications (frontend/.env)</span>
          </div>
          <Badge variant="indigo" size="sm" className="text-[10px]">
            Public Config Only
          </Badge>
        </div>

        <div className="font-mono text-xs bg-[#16182E] p-3.5 rounded-xl border border-stone-800 space-y-1.5 text-stone-300">
          <div>
            <span className="text-indigo-400 font-semibold">VITE_POWER_BI_EMBED_URL</span>=
            <span className="text-amber-300">&quot;https://app.powerbi.com/reportEmbed?reportId=...&quot;</span>
          </div>
          <div>
            <span className="text-indigo-400 font-semibold">VITE_POWER_BI_REPORT_ID</span>=
            <span className="text-amber-300">&quot;00000000-0000-0000-0000-000000000000&quot;</span>
          </div>
          <div>
            <span className="text-indigo-400 font-semibold">VITE_POWER_BI_WORKSPACE_ID</span>=
            <span className="text-amber-300">&quot;00000000-0000-0000-0000-000000000000&quot;</span>
          </div>
        </div>

        {missingVariables.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-stone-400 pt-1">
            <FileCode2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Currently unset in active environment: <code className="text-amber-300 font-mono">{missingVariables.join(', ')}</code>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

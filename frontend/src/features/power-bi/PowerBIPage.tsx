import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import type { Report } from 'powerbi-client';
import type { PowerBIReportId, PowerBIEmbedState } from './types/powerbi.types';
import {
  POWER_BI_REPORTS,
  getReportsForRole,
  getPowerBIConfig,
} from './config/powerbi.config';
import { PowerBIReportSelector } from './components/PowerBIReportSelector';
import { PowerBILoadingSkeleton } from './components/PowerBILoadingSkeleton';
import { PowerBIErrorCard } from './components/PowerBIErrorCard';
import { PowerBIUnconfiguredCard } from './components/PowerBIUnconfiguredCard';
import { PowerBIEmbedContainer } from './components/PowerBIEmbedContainer';
import {
  BarChart3,
  Maximize2,
  RefreshCw,
  LineChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PowerBIPage: React.FC = () => {
  const { user } = useAuth();
  const config = getPowerBIConfig();

  // Filter available reports based on user's authorized role
  const availableReports = getReportsForRole(user?.role);
  const defaultReportId: PowerBIReportId = availableReports[0]?.id || 'executive-summary';

  const [selectedReportId, setSelectedReportId] = useState<PowerBIReportId>(defaultReportId);
  const [embedState, setEmbedState] = useState<PowerBIEmbedState>(
    config.isConfigured ? 'loading' : 'unconfigured'
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const reportRef = useRef<Report | null>(null);

  // Sync state if environment configuration changes
  useEffect(() => {
    if (!config.isConfigured) {
      setEmbedState('unconfigured');
    }
  }, [config.isConfigured]);

  const activeReport =
    POWER_BI_REPORTS.find((r) => r.id === selectedReportId) || POWER_BI_REPORTS[0];

  const handleFullScreen = () => {
    if (reportRef.current) {
      try {
        reportRef.current.fullscreen();
      } catch (err) {
        console.error('Failed to trigger fullscreen:', err);
      }
    }
  };

  const handleRefresh = async () => {
    if (reportRef.current) {
      try {
        setEmbedState('loading');
        await reportRef.current.refresh();
        setEmbedState('rendered');
      } catch (err) {
        console.error('Failed to refresh Power BI report:', err);
        setEmbedState('rendered');
      }
    }
  };

  const handleRetry = () => {
    setErrorMessage(undefined);
    setEmbedState('loading');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="indigo" size="md">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Power BI Reports
            </Badge>
            {config.isConfigured ? (
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Live Embedded
              </Badge>
            ) : (
              <Badge variant="warning" size="md">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Setup Required
              </Badge>
            )}
            <Badge variant="neutral" size="md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-stone-500" />
              <span className="capitalize">{user?.role?.replace('_', ' ')} Scope</span>
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-display">
            Enterprise Power BI Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl">
            Interactive analytical dashboards with advanced slicing, multi-year cross-filtering, and organizational drilldowns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Link to="/analytics">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-xs text-stone-700 bg-white hover:bg-stone-50 shadow-2xs"
            >
              <LineChart className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Native Analytics
            </Button>
          </Link>

          {config.isConfigured && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={embedState !== 'rendered'}
                className="h-9 px-3 text-xs text-stone-700 bg-white hover:bg-stone-50 shadow-2xs"
                title="Refresh Report Data"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFullScreen}
                disabled={embedState !== 'rendered'}
                className="h-9 px-3 text-xs text-stone-700 bg-white hover:bg-stone-50 shadow-2xs"
                title="View Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
                Fullscreen
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report Switcher (when multiple reports available for role) */}
      {availableReports.length > 0 && (
        <PowerBIReportSelector
          reports={availableReports}
          selectedReportId={selectedReportId}
          onSelectReport={(id) => {
            setSelectedReportId(id);
            if (config.isConfigured) {
              setEmbedState('loading');
            }
          }}
        />
      )}

      {/* Main Reporting Canvas */}
      {!config.isConfigured ? (
        <PowerBIUnconfiguredCard missingVariables={config.missingVariables} />
      ) : embedState === 'error' ? (
        <PowerBIErrorCard
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
      ) : (
        <div className="relative">
          {embedState === 'loading' && (
            <div className="absolute inset-0 z-10">
              <PowerBILoadingSkeleton />
            </div>
          )}

          <PowerBIEmbedContainer
            reportId={config.reportId || ''}
            embedUrl={config.embedUrl || ''}
            embedToken={config.embedToken || ''}
            onLoaded={() => {
              setEmbedState('rendered');
            }}
            onRendered={() => {
              setEmbedState('rendered');
            }}
            onError={(err) => {
              console.error('Power BI embed error:', err);
              setErrorMessage(err?.message || 'Failed to initialize Power BI report session.');
              setEmbedState('error');
            }}
            onReportReady={(report) => {
              reportRef.current = report;
            }}
          />
        </div>
      )}

      {/* Footer Info Banner */}
      <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Active Catalog Report: <strong className="text-stone-900">{activeReport.title}</strong> — Authorized for {activeReport.allowedRoles.map((r) => r.replace('_', ' ')).join(', ')}.
          </span>
        </div>
        <Link
          to="/analytics"
          className="text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1 shrink-0"
        >
          <span>Switch to Native Analytics</span>
        </Link>
      </div>
    </div>
  );
};

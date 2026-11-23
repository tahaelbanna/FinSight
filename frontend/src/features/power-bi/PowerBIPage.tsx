import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import {
  DEFAULT_POWER_BI_EMBED_URL,
  getPowerBIConfig,
} from './config/powerbi.config';
import {
  PowerBIEmbedContainer,
  type PowerBIEmbedContainerRef,
} from './components/PowerBIEmbedContainer';
import {
  BarChart3,
  Maximize2,
  Minimize2,
  RefreshCw,
  LineChart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const PowerBIPage: React.FC = () => {
  const { user } = useAuth();
  const config = getPowerBIConfig();
  const embedRef = useRef<PowerBIEmbedContainerRef>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullScreen = () => {
    if (embedRef.current) {
      if (!document.fullscreenElement) {
        embedRef.current.requestFullscreen();
      } else {
        embedRef.current.exitFullscreen();
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (embedRef.current) {
      embedRef.current.reload();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="indigo" size="md">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Power BI Reports
            </Badge>
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              Live Embedded
            </Badge>
            <Badge variant="neutral" size="md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-stone-500 dark:text-stone-400" />
              <span className="capitalize">{user?.role?.replace('_', ' ')} Scope</span>
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
            Enterprise Power BI Workspace
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            Interactive analytical dashboard with advanced slicing, multi-year cross-filtering, and organizational drilldowns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Link to="/analytics">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-xs text-stone-700 dark:text-stone-200 shadow-2xs"
            >
              <LineChart className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              Native Analytics
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-3 text-xs text-stone-700 dark:text-stone-200 shadow-2xs"
            title="Refresh Report Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : 'text-stone-500 dark:text-stone-400'}`}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFullScreen}
            className="h-9 px-3 text-xs text-stone-700 dark:text-stone-200 shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 mr-1.5 text-stone-500 dark:text-stone-400" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-stone-500 dark:text-stone-400" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Reporting Canvas */}
      <PowerBIEmbedContainer
        ref={embedRef}
        src={config.embedUrl || DEFAULT_POWER_BI_EMBED_URL}
        title="FinSight Power BI Dashboard"
      />

      {/* Footer Info Banner */}
      <div className="p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            Enterprise Report: <strong className="text-stone-900 dark:text-stone-100">FinSight Power BI Dashboard</strong> — Model B Financial Intelligence. If organizational sign-in is required, please authenticate with your Microsoft account.
          </span>
        </div>
        <Link
          to="/analytics"
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 shrink-0"
        >
          <span>Switch to Native Analytics</span>
        </Link>
      </div>
    </div>
  );
};

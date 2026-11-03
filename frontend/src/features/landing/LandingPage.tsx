import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  TrendingUp,
  ShieldCheck,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  PieChart,
  BarChart3,
  Receipt,
  Layers,
  Lock,
  Database,
  Sparkles,
  Info,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0B0E1B] text-stone-900 dark:text-stone-100 selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200 font-sans antialiased transition-colors duration-200">
      {/* ------------------------------------------------------------------ */}
      {/* Navigation Header                                                  */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 w-full bg-[#FBFBFA]/90 dark:bg-[#0B0E1B]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="w-5 h-5 text-indigo-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight text-stone-950 dark:text-stone-100">
                Fin<span className="text-indigo-600 dark:text-indigo-400">Sight</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500 dark:text-stone-400 -mt-1">
                Enterprise Finance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <a href="#overview" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Financial Overview
            </a>
            <a href="#model-b" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Model B Accounting
            </a>
            <a href="#modules" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Enterprise Modules
            </a>
            <a href="#security" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Security &amp; RBAC
            </a>
          </nav>

          {/* Action Area: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />

            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Go to Workspace ({user?.role?.replace('_', ' ')})
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs text-xs sm:text-sm"
                >
                  Access Workspace
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero Section                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-amber-100/20 dark:from-indigo-950/20 dark:via-purple-950/15 dark:to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Enterprise Financial Management &amp; Spend Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-950 dark:text-stone-100 font-display leading-[1.12]">
              Complete Financial Visibility.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-purple-400">
                Confident Spending Decisions.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Centralize company expenses, manage operational and capital budgets, and gain actionable financial insights through one unified platform.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCtaClick}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 px-7"
              >
                {isAuthenticated ? 'Open Enterprise Dashboard' : 'Sign In'}
              </Button>
              <a
                href="#modules"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-200 bg-white dark:bg-[#151A2D] hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-stone-200/90 dark:border-stone-800 shadow-2xs transition-colors"
              >
                Explore Features
              </a>
            </div>

            {/* Trust Markers */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Model B Dual-Stream Accounting
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Strict Role-Based Access Control
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Transactional Activity Audit Logging
              </span>
            </div>
          </div>

          {/* Interactive UI Mockup / Dashboard Preview */}
          <div className="mt-12 sm:mt-14 rounded-2xl bg-white dark:bg-[#151A2D] p-3.5 sm:p-5 border border-stone-200/90 dark:border-stone-800 shadow-xl dark:shadow-2xl max-w-5xl mx-auto transition-colors">
            {/* Mock Window Top Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono ml-2">
                  finsight.internal/analytics
                </span>
              </div>
              <Badge variant="indigo" size="sm">
                Executive Intelligence Preview
              </Badge>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="space-y-4">
              {/* Executive Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    Enterprise Budget
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-stone-100 mt-1">
                    $8,668,000
                  </p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Consolidated OpEx + CapEx
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    Approved Spend
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
                    $6,498,290
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    74.97% Overall Utilization
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    In Review Pipeline
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-amber-600 dark:text-amber-400 mt-1">
                    $1,517,355
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Manager Review Queue
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-stone-100 mt-1">
                    $2,169,710
                  </p>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                    Operating Margin Reserve
                  </span>
                </div>
              </div>

              {/* Visual Split Graphic Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display">
                      Spend vs Budget by Department (Model B Consolidated)
                    </span>
                    <Badge variant="neutral" size="sm" className="text-[10px]">
                      Sample Data
                    </Badge>
                  </div>
                  {/* Department Spending Mock Bars */}
                  <div className="space-y-2.5 text-xs">
                    {[
                      { name: 'Engineering', budget: '$1,917,000', spend: '$1,080,000', pct: 56.3 },
                      { name: 'Product Management', budget: '$1,420,000', spend: '$1,184,000', pct: 83.4 },
                      { name: 'Marketing', budget: '$1,530,000', spend: '$1,220,000', pct: 79.7 },
                      { name: 'Finance & Operations', budget: '$1,850,000', spend: '$1,450,000', pct: 78.4 },
                    ].map((dept) => (
                      <div key={dept.name}>
                        <div className="flex justify-between text-[11px] text-stone-600 dark:text-stone-400 mb-1">
                          <span className="font-semibold text-stone-800 dark:text-stone-200">{dept.name}</span>
                          <span>
                            {dept.spend} / {dept.budget} ({dept.pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-stone-200/80 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              dept.pct > 80 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: `${dept.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/30 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display block mb-1.5">
                      Model B Dual Stream
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
                      OpEx and CapEx are tracked in separate streams with zero double counting.
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                        <span className="font-semibold text-indigo-950 dark:text-indigo-200 text-[11px]">
                          Department OpEx
                        </span>
                        <code className="font-mono text-indigo-700 dark:text-indigo-400 font-bold text-[10px]">
                          project_id IS NULL
                        </code>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                        <span className="font-semibold text-emerald-950 dark:text-emerald-200 text-[11px]">
                          Project CapEx
                        </span>
                        <code className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                          project_id IS NOT NULL
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400 mt-3">
                    <span>Audit Status</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Reconciled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Financial Overview KPI Section (Sample Financial Data)             */}
      {/* ------------------------------------------------------------------ */}
      <section id="overview" className="py-16 sm:py-20 bg-stone-100/60 dark:bg-[#11162A]/60 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <Info className="w-3.5 h-3.5" />
              <span>Sample Financial Data &bull; Demo Environment</span>
            </div>
            <h2 className="text-3xl font-extrabold text-stone-950 dark:text-stone-100 font-display tracking-tight">
              Executive Financial Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              High-level overview of authorized enterprise spending envelopes, realized period expenditures, and approval pipeline volume.
            </p>
          </div>

          {/* 5 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Card 1: Total Budget */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Total Enterprise Budget
                </span>
                <PieChart className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black font-display text-stone-950 dark:text-stone-100">
                $8,668,000
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Authorized OpEx + CapEx allocation
              </p>
            </div>

            {/* Card 2: Approved Spend */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Approved Expenditure
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">
                $6,498,290
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Realized approved spending
              </p>
            </div>

            {/* Card 3: Utilization */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Overall Utilization
                </span>
                <BarChart3 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black font-display text-stone-950 dark:text-stone-100">
                74.97%
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Controlled burn velocity
              </p>
            </div>

            {/* Card 4: Pending Spend */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Pending In Review
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black font-display text-amber-600 dark:text-amber-400">
                $1,517,355
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                Active manager queue
              </p>
            </div>

            {/* Card 5: Available Balance */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Available Balance
                </span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black font-display text-stone-950 dark:text-stone-100">
                $2,169,710
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Remaining operating margin
              </p>
            </div>
          </div>

          {/* Department Spending Detailed Visualization */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-950 dark:text-stone-100 font-display">
                  Spend vs Budget by Department (Model B Consolidated)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Consolidated departmental allocations incorporating both operational overhead (OpEx) and strategic project envelopes (CapEx)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-stone-300 dark:bg-stone-700" />
                  <span className="text-stone-600 dark:text-stone-400">Authorized Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
                  <span className="text-stone-600 dark:text-stone-400">Approved Spend</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { name: 'Engineering', budget: 1917000, spend: 1080000, pct: 56.3 },
                { name: 'Product Management', budget: 1420000, spend: 1184000, pct: 83.4 },
                { name: 'Marketing', budget: 1530000, spend: 1220000, pct: 79.7 },
                { name: 'Finance & Operations', budget: 1850000, spend: 1450000, pct: 78.4 },
                { name: 'Sales & Partnerships', budget: 1120000, spend: 890000, pct: 79.5 },
                { name: 'People & HR', budget: 831000, spend: 674290, pct: 81.1 },
              ].map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 dark:text-stone-100">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-600 dark:text-stone-400">
                        ${(item.spend / 1000).toLocaleString()}k / ${(item.budget / 1000).toLocaleString()}k
                      </span>
                      <span
                        className={`font-bold text-[11px] ${
                          item.pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        ({item.pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.pct >= 80 ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>* Data source: FinSight Seed Demonstration Dataset. Excludes unapproved/pending draft submissions.</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Dual-Stream Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Model B Dual-Stream Accounting Section                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="model-b" className="py-20 bg-white dark:bg-[#0B0E1B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="indigo" size="sm">
                Audited Accounting Standards
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-stone-100 font-display tracking-tight leading-tight">
                Model B Dual-Stream Accounting Architecture
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                Traditional expense tracking tools conflate routine department operations with long-term capital initiatives. FinSight enforces a mathematically validated dual-stream model that eliminates double-counting and ensures rigorous multi-period budget containment.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display">
                      Department Operational Budgets (OpEx)
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Direct operational overhead where expenses have no project assignment (<code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">project_id IS NULL</code>). Governs regular departmental salaries, software subscriptions, and office spend.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display">
                      Project Capital Expenditures (CapEx)
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Ring-fenced multi-year project envelopes where expenses are tied directly to an authorized capital project (<code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">project_id IS NOT NULL</code>). Tracked independently with strict overrun alerts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 font-display">
                      Consolidated Department Spending
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Department executives view consolidated spend without double-counting: total department operational spend plus the sum of capital expenses across projects assigned to that department.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustrative Equation & Comparison Card */}
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800">
                <span className="text-xs font-bold font-display text-stone-900 dark:text-stone-100">
                  Consolidated Spending Equation
                </span>
                <Badge variant="indigo" size="sm">
                  Model B Audited
                </Badge>
              </div>

              {/* Equation Box */}
              <div className="p-4 rounded-xl bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">
                  Consolidated Department Spend
                </span>
                <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  Consolidated Spend = OpEx Spend + Σ Project CapEx Spend
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  Pending and rejected expense requests are strictly excluded from realized spending metrics. Only verified and approved expenditures are recognized.
                </p>
              </div>

              {/* OpEx vs CapEx Visual Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 tracking-wider">
                      Department OpEx
                    </span>
                    <Badge variant="indigo" size="sm" className="font-mono text-[9px] py-0 px-1">
                      project_id IS NULL
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block font-display">
                    Direct Department Overhead
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    Operating expenditures dedicated exclusively to departmental cost centers. Excluded from capital project budgets.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                      Project CapEx
                    </span>
                    <Badge variant="success" size="sm" className="font-mono text-[9px] py-0 px-1">
                      project_id IS NOT NULL
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block font-display">
                    Capital Project Investments
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    Ring-fenced project envelopes tracked independently. Excluded from general department operating budgets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Enterprise Business Modules Section                                */}
      {/* ------------------------------------------------------------------ */}
      <section id="modules" className="py-20 bg-stone-100/60 dark:bg-[#11162A]/60 border-y border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Badge variant="indigo" size="sm">Platform Architecture</Badge>
            <h2 className="text-3xl font-extrabold text-stone-950 dark:text-stone-100 font-display tracking-tight">
              Enterprise Business Modules
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              Complete financial operations platform engineered for visibility, compliance, and strict accounting integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1: Expense Management */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mb-2">
                Expense Management
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Submit and review operational expenses with multi-file digital receipts, automatic categorization, and immediate budget impact calculation.
              </p>
            </div>

            {/* Module 2: Budget Allocation & Overrun Prevention */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mb-2">
                Budget Allocation &amp; Overrun Prevention
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Allocate multi-period department budgets and dedicated project envelopes with real-time variance and overrun alerts.
              </p>
            </div>

            {/* Module 3: Manager Approval Workflows */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mb-2">
                Manager Approval Workflows
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Department managers review pending expenses with detailed justification audit logs, approval comments, and automated notifications.
              </p>
            </div>

            {/* Module 4: Native Financial Analytics */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mb-2">
                Native Financial Analytics
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Five real-time analytical lenses: executive KPIs, monthly trend trajectories, category allocations, department comparisons, and project performance.
              </p>
            </div>

            {/* Module 5: Capital Projects Management */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mb-2">
                Capital Projects Management
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Track strategic multi-year capital projects with status governance, dedicated CapEx budgets, and cross-department collaboration.
              </p>
            </div>

            {/* Module 6: Role-Based Access Control */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-display mb-2">
                Role-Based Access Control
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Strict separation of authority between System Admins, Finance Officers, Department Managers, and Employees enforced in both frontend and backend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Security & Compliance Architecture Section                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="security" className="py-20 bg-stone-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" /> Security &amp; Compliance Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">
              Enterprise Protection at Every Layer
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Engineered with defensive security, authentication guards, and relational data integrity standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Security Item 1 */}
            <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">JWT Token Rotation</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Secure JWT authentication with rotating refresh tokens. Short-lived access credentials and single-flight token rotation prevent replay attacks.
              </p>
            </div>

            {/* Security Item 2 */}
            <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Relational Data Integrity</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                PostgreSQL relational database with foreign key constraints and ACID transaction isolation guarantees consistent state across all accounts.
              </p>
            </div>

            {/* Security Item 3 */}
            <div className="p-6 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Transactional Activity Audit</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Every expenditure submission, managerial approval, and budget mutation produces a structured audit record with actor metadata and timestamps.
              </p>
            </div>
          </div>

          {/* Bottom Security CTA */}
          <div className="mt-14 p-8 rounded-2xl bg-gradient-to-r from-indigo-900/50 to-purple-900/30 border border-indigo-700/40 text-center max-w-3xl mx-auto space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Ready to Access Your FinSight Enterprise Workspace?
            </h3>
            <p className="text-xs text-stone-300 max-w-lg mx-auto">
              Authorized personnel can log in using their enterprise credentials to access their role-specific department dashboard.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleCtaClick}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 px-6"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Sign In to Workspace'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                             */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-white dark:bg-[#0B0E1B] border-t border-stone-200/80 dark:border-stone-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold text-base text-stone-950 dark:text-stone-100">
              FinSight
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 ml-2">
              &copy; {new Date().getFullYear()} FinSight. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-500 dark:text-stone-400">
            <a href="#overview" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Overview
            </a>
            <a href="#model-b" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Model B
            </a>
            <a href="#modules" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Modules
            </a>
            <a href="#security" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Security
            </a>
            <Link
              to="/login"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Employee Login</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
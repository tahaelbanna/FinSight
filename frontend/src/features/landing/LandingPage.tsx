import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900 selection:bg-indigo-500/20 selection:text-indigo-900 font-sans antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* Navigation Header                                                  */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 w-full bg-[#FBFBFA]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
              <TrendingUp className="w-5 h-5 text-indigo-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight text-stone-950">
                Fin<span className="text-indigo-600">Sight</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-600 -mt-1">
                Enterprise Finance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Platform Modules
            </a>
            <a href="#analytics" className="hover:text-indigo-600 transition-colors">
              Model B Analytics
            </a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">
              Security &amp; RBAC
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                Go to Workspace ({user?.role?.replace('_', ' ')})
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-indigo-600 px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 text-xs sm:text-sm"
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
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-amber-100/20 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Enterprise Financial Management &amp; Spend Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-950 font-display leading-[1.12]">
              Precision Spend Control &amp; Native Financial Analytics
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
              FinSight centralizes organizational spend, department operational budgets (OpEx),
              and multi-year project investments (CapEx) under a rigorous, audited Model B accounting architecture.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCtaClick}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 px-7"
              >
                {isAuthenticated ? 'Open Enterprise Dashboard' : 'Access Your Workspace'}
              </Button>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 shadow-2xs transition-colors"
              >
                Explore Platform Architecture
              </a>
            </div>

            {/* Trust Markers */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Model B Dual-Stream Accounting
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Strict Role-Based Access Control
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600" /> ACID-Compliant Transaction Audits
              </span>
            </div>
          </div>

          {/* Interactive UI Mockup / Dashboard Preview */}
          <div className="mt-12 sm:mt-16 rounded-2xl bg-white p-3 sm:p-5 border border-stone-200 shadow-xl shadow-stone-200/50 max-w-5xl mx-auto">
            {/* Mock Window Top Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-stone-600 font-mono ml-2">finsight.company.internal/analytics</span>
              </div>
              <Badge variant="indigo" size="sm">
                Live Enterprise Preview
              </Badge>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="space-y-4">
              {/* Executive Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Total Enterprise Budget
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 mt-1">
                    $8,668,000.00
                  </p>
                  <span className="text-[10px] text-indigo-600 font-medium">Consolidated OpEx + CapEx</span>
                </div>
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Approved Expenditure
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-emerald-700 mt-1">
                    $6,498,290.00
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">74.97% Overall Utilization</span>
                </div>
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Pending In Review
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-amber-600 mt-1">
                    $1,517,355.00
                  </p>
                  <span className="text-[10px] text-amber-600 font-medium">Manager Approval Queue</span>
                </div>
                <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Available Balance
                  </span>
                  <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 mt-1">
                    $2,169,710.00
                  </p>
                  <span className="text-[10px] text-stone-500 font-medium">Healthy Variance</span>
                </div>
              </div>

              {/* Visual Split Graphic Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 p-4 rounded-xl border border-stone-200/80 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-stone-900 font-display">
                      Spend vs Budget by Department (Model B Consolidated)
                    </span>
                    <Badge variant="neutral" size="sm">6 Departments Active</Badge>
                  </div>
                  {/* Department Spending Mock Bars */}
                  <div className="space-y-2.5 text-xs">
                    {[
                      { name: 'Engineering', budget: 1917, spend: 1080, pct: 56.4 },
                      { name: 'Product Management', budget: 1420, spend: 1184, pct: 83.4 },
                      { name: 'Marketing', budget: 1530, spend: 1220, pct: 79.7 },
                      { name: 'Finance & Ops', budget: 1850, spend: 1450, pct: 78.4 },
                    ].map((dept) => (
                      <div key={dept.name}>
                        <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                          <span className="font-semibold text-stone-800">{dept.name}</span>
                          <span>${dept.spend}k / ${dept.budget}k ({dept.pct}%)</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${dept.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200/80 bg-white flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 font-display block mb-2">
                      Model B Dual Stream
                    </span>
                    <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
                      OpEx and CapEx are tracked in separate ledgers with zero double counting.
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                        <span className="font-semibold text-indigo-950">Department OpEx</span>
                        <span className="font-mono text-indigo-700 font-bold">project_id IS NULL</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                        <span className="font-semibold text-emerald-950">Capital CapEx</span>
                        <span className="font-mono text-emerald-700 font-bold">project_id IS NOT NULL</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                    <span>Audit Status</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Balanced
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features Section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-20 bg-stone-100/60 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="indigo" size="sm">Core Architecture</Badge>
            <h2 className="text-3xl font-extrabold text-stone-950 font-display tracking-tight">
              Enterprise Business Modules
            </h2>
            <p className="text-sm text-stone-600">
              Complete financial operations platform engineered for visibility, compliance, and strict accounting integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display mb-2">
                Expense Management
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Submit and review operational expenses with multi-file digital receipts, automatic categorization, and immediate budget impact calculation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display mb-2">
                Budget Allocation &amp; Overrun Prevention
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Allocate multi-period department budgets and dedicated project envelopes with real-time variance and overrun alerts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display mb-2">
                Manager Approval Workflows
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Department managers review pending expenses with detailed justification audit logs, approval comments, and automated notifications.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display mb-2">
                Native Financial Analytics
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Five real-time analytical lenses: executive KPIs, monthly trend trajectories, category allocations, department comparisons, and project performance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display mb-2">
                Capital Projects Management
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Track strategic multi-year capital projects with status governance, dedicated CapEx budgets, and cross-department collaboration.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-display mb-2">
                Role-Based Access Control
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Strict separation of authority between System Admins, Finance Officers, Department Managers, and Employees enforced in both frontend and backend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Analytics & Accounting Model B Section                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="analytics" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="indigo" size="sm">Model B Accounting Rules</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-950 font-display tracking-tight leading-tight">
                Dual-Stream Financial Architecture Built for Real Enterprise Rigor
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Traditional expense trackers confuse operational expenses with capital investments.
                FinSight implements a mathematically verified accounting model that guarantees consistency across every report:
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 font-display">Department Operational Budgets (OpEx)</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Direct operational spend where expenses have no project assignment (<code className="text-indigo-600">project_id IS NULL</code>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 font-display">Project Capital Expenditures (CapEx)</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Strategic project budgets where expenses are tied directly to an approved project (<code className="text-indigo-600">project_id IS NOT NULL</code>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 font-display">Consolidated Department Metrics</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Consolidated department spend equals OpEx plus CapEx across projects belonging to that department—never double-counted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustrative Graphic Box */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-xs font-bold font-display text-stone-900">
                  Consolidated Spending Equation
                </span>
                <Badge variant="success" size="sm">Formula Audited</Badge>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200/80 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                  Consolidated Department Spend
                </span>
                <div className="font-mono text-sm font-bold text-indigo-700">
                  Consolidated = OpEx Spend + ∑ Project CapEx Spend
                </div>
                <p className="text-[11px] text-stone-500">
                  Strictly filters out pending or rejected requests. Only approved expenditures are counted.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 text-start space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Department OpEx</span>
                    <Badge variant="indigo" size="sm" className="font-mono text-[9px]">project_id IS NULL</Badge>
                  </div>
                  <span className="text-xs font-bold text-stone-900 block font-display">Direct Department Overhead</span>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Operating expenditures dedicated exclusively to departmental cost centers. Excluded from capital project budgets.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 text-start space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Project CapEx</span>
                    <Badge variant="success" size="sm" className="font-mono text-[9px]">project_id IS NOT NULL</Badge>
                  </div>
                  <span className="text-xs font-bold text-stone-900 block font-display">Capital Project Investments</span>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Ring-fenced project envelopes tracked independently. Excluded from general department operating budgets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Security Section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="security" className="py-20 bg-stone-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" /> Security &amp; Compliance Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">
              Enterprise Protection at Every Layer
            </h2>
            <p className="text-sm text-stone-400">
              Engineered with defensive security, authentication guards, and data isolation standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Cryptographic Token Rotation</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Secure JWT authentication with rotating refresh tokens. Short-lived access credentials prevent replay attacks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Database Stacking Isolation</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                System Administrator accounts and organizational user identities are isolated across discrete schemas to prevent privilege escalation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white font-display">Immutable Activity Audit</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Every expenditure submission, managerial approval, and budget mutation produces an immutable audit record for compliance.
              </p>
            </div>
          </div>

          {/* Bottom Security CTA */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-indigo-900/50 to-purple-900/30 border border-indigo-700/40 text-center max-w-3xl mx-auto space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Ready to Access Your FinSight Enterprise Workspace?
            </h3>
            <p className="text-xs text-stone-300 max-w-lg mx-auto">
              Authorized personnel can log in using their enterprise credentials to access their department dashboard.
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
      <footer className="bg-white border-t border-stone-200/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-display font-extrabold text-base text-stone-950">
              FinSight
            </span>
            <span className="text-xs text-stone-600 ml-2">
              © {new Date().getFullYear()} FinSight Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-500">
            <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
            <a href="#analytics" className="hover:text-stone-900 transition-colors">Model B</a>
            <a href="#security" className="hover:text-stone-900 transition-colors">Security</a>
            <Link to="/login" className="hover:text-indigo-600 font-semibold transition-colors">Employee Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

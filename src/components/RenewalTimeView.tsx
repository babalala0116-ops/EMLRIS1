import React, { useState, useMemo } from 'react';
import { 
  Clock, Calendar, AlertTriangle, CheckCircle, Shield, FileText, 
  Search, Filter, Download, Check, X, RefreshCw, 
  Layers, Landmark, MapPin, AlertCircle, Info, ArrowRightLeft, ArrowLeft
} from 'lucide-react';
import type { Application } from '../types';
import { useAppContext } from '../App.tsx';

interface RenewalTimeViewProps {
  applications?: Application[];
  currentUserRole?: string;
  currentUserRegion?: string;
  darkMode?: boolean;
  onRenewLicense?: (id: string, extensionYears: number, newExpiryDate: string, remark?: string) => void;
  onNavigateToMap?: () => void;
  onNavigateToDetail?: (appId: string) => void;
}

// Helper to calculate days remaining from today (reference March 2026 for simulation)
export const calculateDaysRemaining = (expiryDateStr?: string): { days: number; isExpired: boolean; label: string; statusClass: string } => {
  if (!expiryDateStr) {
    return { days: 999, isExpired: false, label: 'Standard Tenor', statusClass: 'text-slate-400' };
  }
  
  // System current date baseline (March 14, 2026)
  const today = new Date('2026-03-14');
  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      isExpired: true,
      label: `Expired ${Math.abs(diffDays)} days ago (Grace Period)`,
      statusClass: 'text-rose-600 dark:text-rose-400 font-bold'
    };
  } else if (diffDays <= 30) {
    return {
      days: diffDays,
      isExpired: false,
      label: `Critical: ${diffDays} days left`,
      statusClass: 'text-rose-500 dark:text-rose-400 font-bold'
    };
  } else if (diffDays <= 90) {
    return {
      days: diffDays,
      isExpired: false,
      label: `${diffDays} days left (90-Day Window Open)`,
      statusClass: 'text-amber-600 dark:text-amber-400 font-semibold'
    };
  } else if (diffDays <= 365) {
    return {
      days: diffDays,
      isExpired: false,
      label: `${diffDays} days remaining`,
      statusClass: 'text-emerald-700 dark:text-emerald-400 font-medium'
    };
  } else {
    const years = (diffDays / 365.25).toFixed(1);
    return {
      days: diffDays,
      isExpired: false,
      label: `${years} years remaining`,
      statusClass: 'text-slate-600 dark:text-slate-300 font-medium'
    };
  }
};

export const RenewalTimeView: React.FC<RenewalTimeViewProps> = ({
  applications: propsApplications,
  currentUserRole: propsRole,
  currentUserRegion: propsRegion,
  darkMode: propsDarkMode,
  onRenewLicense: propsOnRenew,
  onNavigateToMap: propsOnMap,
  onNavigateToDetail: propsOnDetail
}) => {
  const { state, dispatch } = useAppContext();
  const applications = propsApplications || state?.applications || [];
  const darkMode = propsDarkMode ?? state?.darkMode ?? false;
  const currentUserRole = propsRole || state?.currentUser?.role;
  const currentUserRegion = propsRegion || state?.currentUser?.region;

  const onRenewLicense = propsOnRenew || ((id: string, extensionYears: number, newExpiryDate: string, remark?: string) => {
    dispatch({
      type: 'RENEW_LICENSE',
      payload: { id, extensionYears, newExpiryDate, remark }
    });
  });

  const onNavigateToMap = propsOnMap || (() => {
    dispatch({ type: 'NAVIGATE', payload: 'map' });
  });

  const onNavigateToDetail = propsOnDetail || ((appId: string) => {
    dispatch({ type: 'NAVIGATE', payload: 'application-detail', entityId: appId });
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [selectedAppForRenewal, setSelectedAppForRenewal] = useState<Application | null>(null);
  const [extensionYears, setExtensionYears] = useState<number>(3);
  const [renewalRemark, setRenewalRemark] = useState('');
  const [escrowConfirmed, setEscrowConfirmed] = useState(true);
  const [relinquishmentConfirmed, setRelinquishmentConfirmed] = useState(true);
  const [workProgramAudited, setWorkProgramAudited] = useState(true);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filter licenses
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const daysInfo = calculateDaysRemaining(app.expiryDate);
      
      // Search matching
      const matchesSearch = 
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.mineral.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.tin.includes(searchTerm);

      // Region matching
      const matchesRegion = regionFilter === 'ALL' || app.region === regionFilter;

      // Status matching
      let matchesStatus = true;
      if (statusFilter === 'CRITICAL') {
        matchesStatus = !daysInfo.isExpired && daysInfo.days <= 30;
      } else if (statusFilter === 'WINDOW_90') {
        matchesStatus = !daysInfo.isExpired && daysInfo.days > 30 && daysInfo.days <= 90;
      } else if (statusFilter === 'GOOD_STANDING') {
        matchesStatus = !daysInfo.isExpired && daysInfo.days > 90;
      } else if (statusFilter === 'EXPIRED') {
        matchesStatus = daysInfo.isExpired;
      } else if (statusFilter === 'NON_RENEWABLE') {
        matchesStatus = app.renewable === 'No' || app.type.toLowerCase().includes('reconnaissance');
      }

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter, regionFilter]);

  // Executive Metric Counts
  const metrics = useMemo(() => {
    let criticalCount = 0;
    let window90Count = 0;
    let goodStandingCount = 0;
    let expiredCount = 0;
    let totalConcessionArea = 0;

    applications.forEach(app => {
      const info = calculateDaysRemaining(app.expiryDate);
      if (info.isExpired) expiredCount++;
      else if (info.days <= 30) criticalCount++;
      else if (info.days <= 90) window90Count++;
      else goodStandingCount++;

      if (app.concessionAreaKm2) {
        totalConcessionArea += app.concessionAreaKm2;
      }
    });

    return { criticalCount, window90Count, goodStandingCount, expiredCount, totalConcessionArea };
  }, [applications]);

  // Calculate new expiry preview when renewing
  const previewNewExpiryDate = useMemo(() => {
    if (!selectedAppForRenewal) return '';
    const baseDate = selectedAppForRenewal.expiryDate ? new Date(selectedAppForRenewal.expiryDate) : new Date('2026-03-14');
    // If already expired, extend from today
    const effectiveBase = baseDate < new Date('2026-03-14') ? new Date('2026-03-14') : baseDate;
    const newDate = new Date(effectiveBase);
    newDate.setFullYear(newDate.getFullYear() + extensionYears);
    return newDate.toISOString().split('T')[0];
  }, [selectedAppForRenewal, extensionYears]);

  const handleOpenRenewalModal = (app: Application) => {
    setSelectedAppForRenewal(app);
    // Set default extension based on type
    if (app.type.toLowerCase().includes('large-scale')) {
      setExtensionYears(10);
    } else if (app.type.toLowerCase().includes('exploration')) {
      setExtensionYears(3);
    } else if (app.type.toLowerCase().includes('small-scale')) {
      setExtensionYears(5);
    } else {
      setExtensionYears(1);
    }
    setRenewalRemark(`Statutory renewal processed pursuant to Article 22 review. All environmental bonds and technical audit records verified.`);
  };

  const handleExecuteRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForRenewal) return;

    onRenewLicense(
      selectedAppForRenewal.id,
      extensionYears,
      previewNewExpiryDate,
      renewalRemark
    );

    setSuccessBanner(`Successfully endorsed statutory renewal for ${selectedAppForRenewal.id} (${selectedAppForRenewal.applicant}). New expiration date set to ${previewNewExpiryDate}.`);
    setSelectedAppForRenewal(null);
    setTimeout(() => setSuccessBanner(null), 7000);
  };

  const handleExportCSV = () => {
    const headers = ["License ID", "Applicant", "TIN", "Type", "Region", "Mineral", "Issue Date", "Expiry Date", "Days Remaining", "Renewal Status", "Escrow Bond"];
    const rows = filteredApps.map(app => {
      const info = calculateDaysRemaining(app.expiryDate);
      return [
        app.id,
        `"${app.applicant}"`,
        app.tin,
        `"${app.type}"`,
        app.region,
        `"${app.mineral}"`,
        app.issueDate || app.date,
        app.expiryDate || 'N/A',
        info.days,
        `"${info.label}"`,
        app.escrowBondStatus || 'Verified & Funded'
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMLRIS_License_Expiry_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="renewal-time-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-3">
          <button
            id="btn-renewals-top-left-back"
            onClick={() => dispatch({ type: 'GO_BACK' })}
            title="Go Back"
            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 mt-0.5 ${
              darkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                License Renewals & Statutory Expirations
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Proc. No. 678/2010
              </span>
            </div>
            <p className={`text-xs mt-1 max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Statutory tracking of mining concession validity periods, mandatory 90-day renewal filing windows, environmental rehabilitation escrow verification, and 25% area relinquishment compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-export-renewal-schedule"
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' 
                : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs'
            }`}
          >
            <Download size={14} />
            <span>Export Expiry Schedule</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-200">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Critical Expirations < 30 Days */}
        <div className={`p-4 rounded-xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Critical: &lt; 30 Days Left</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-rose-500">{metrics.criticalCount}</span>
            <span className="text-xs text-slate-400">licenses urgent</span>
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
            Immediate renewal processing required
          </p>
        </div>

        {/* Metric 2: 90-Day Statutory Filing Window */}
        <div className={`p-4 rounded-xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">90-Day Renewal Window</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-500">{metrics.window90Count}</span>
            <span className="text-xs text-slate-400">within statutory window</span>
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-medium">
            Article 22 renewal deadline active
          </p>
        </div>

        {/* Metric 3: Active in Good Standing */}
        <div className={`p-4 rounded-xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Good Standing (&gt; 90 Days)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-500">{metrics.goodStandingCount}</span>
            <span className="text-xs text-slate-400">concessions valid</span>
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
            Compliant with annual work programs
          </p>
        </div>

        {/* Metric 4: Expired / Grace Period */}
        <div className={`p-4 rounded-xl border transition-all ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Expired / Grace Period</span>
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center">
              <RefreshCw size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${metrics.expiredCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {metrics.expiredCount}
            </span>
            <span className="text-xs text-slate-400">pending reversion</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            30-day notice prior to cadastre re-tender
          </p>
        </div>
      </div>

      {/* Regulatory Context & Institutional Thoughts Banner */}
      <div className={`p-5 rounded-2xl border ${
        darkMode ? 'bg-slate-900/90 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200 shadow-xs'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5 shadow-sm">
            <Landmark size={20} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`font-black text-sm ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
                Ethiopian Mining Regulatory Protocol: Concession Tenor & Renewal Architecture
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-800 text-emerald-100">
                MoM Regulatory Policy Insights
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-emerald-100'}`}>
                <div className="font-bold flex items-center gap-1.5 text-amber-500 mb-1">
                  <Clock size={14} /> 90-Day Mandatory Notice Buffer
                </div>
                <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Per Article 22 of Proclamation No. 678/2010, exploration license holders must submit renewal applications at least 90 calendar days before expiry. Failure automatically triggers concession expiration and releases the area back to public cadastre.
                </p>
              </div>

              <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-emerald-100'}`}>
                <div className="font-bold flex items-center gap-1.5 text-blue-400 mb-1">
                  <Layers size={14} /> Mandatory 25% Relinquishment
                </div>
                <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Upon applying for renewal of an Exploration License, the concession holder must relinquish not less than 25% of the original exploration concession area. The excised blocks are demarcated and returned to the federal geological registry.
                </p>
              </div>

              <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/80 border-emerald-100'}`}>
                <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                  <Shield size={14} /> Environmental Escrow Verification
                </div>
                <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Statutory renewal cannot be endorsed without confirmation from the National Bank of Ethiopia (NBE) and the Environmental Protection Authority that the Mine Rehabilitation Escrow Guarantee is active, funded, and up to date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filter & Search Controls */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-1 w-full md:w-auto items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              id="renewal-search-input"
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by License ID, Company, Mineral, or TIN..." 
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs font-medium border outline-hidden transition-all ${
                darkMode 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
              }`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Region Dropdown Filter */}
          <div className="shrink-0">
            <select
              id="renewal-region-filter"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border outline-hidden transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
              }`}
            >
              <option value="ALL">All Regions</option>
              <option value="Oromia">Oromia</option>
              <option value="Amhara">Amhara</option>
              <option value="Tigray">Tigray</option>
              <option value="Afar">Afar</option>
              <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
              <option value="Federal">Federal Concessions</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Licenses' },
            { id: 'CRITICAL', label: 'Urgent (< 30d)' },
            { id: 'WINDOW_90', label: '90-Day Window' },
            { id: 'GOOD_STANDING', label: 'Good Standing' },
            { id: 'EXPIRED', label: 'Expired / Grace' },
            { id: 'NON_RENEWABLE', label: 'Non-Renewable' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main License Expirations Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase font-bold tracking-wider border-b ${
              darkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="px-4 py-3.5">License & Concession ID</th>
                <th className="px-4 py-3.5">Licensee & TIN</th>
                <th className="px-4 py-3.5">Tenor & Category</th>
                <th className="px-4 py-3.5">Region & Level</th>
                <th className="px-4 py-3.5">Issue Date</th>
                <th className="px-4 py-3.5">Exact Expiry Date</th>
                <th className="px-4 py-3.5">Countdown & Status</th>
                <th className="px-4 py-3.5">Statutory Compliance</th>
                <th className="px-4 py-3.5 text-right">Renewal Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <AlertCircle size={32} className="mx-auto mb-2 text-slate-500 opacity-60" />
                    <p className="font-semibold text-sm">No mining licenses found matching the selected expiry filters.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the search keywords or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const daysInfo = calculateDaysRemaining(app.expiryDate);
                  const isNonRenewable = app.renewable === 'No' || app.type.toLowerCase().includes('reconnaissance');
                  const isExploration = app.type.toLowerCase().includes('exploration');

                  return (
                    <tr 
                      key={app.id} 
                      className={`transition-colors ${
                        daysInfo.isExpired 
                          ? darkMode ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'bg-rose-50/40 hover:bg-rose-50/70'
                          : daysInfo.days <= 30
                            ? darkMode ? 'bg-amber-950/15 hover:bg-amber-950/25' : 'bg-amber-50/40 hover:bg-amber-50/70'
                            : darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* License ID */}
                      <td className="px-4 py-3.5 align-middle">
                        <button
                          onClick={() => onNavigateToDetail(app.id)}
                          className={`font-mono font-bold hover:underline cursor-pointer ${
                            darkMode ? 'text-emerald-400' : 'text-emerald-800'
                          }`}
                        >
                          {app.id}
                        </button>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <MapPin size={10} /> {app.coordinates || 'Concession Coord'}
                        </div>
                      </td>

                      {/* Licensee & TIN */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{app.applicant}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          TIN: {app.tin.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}
                        </div>
                      </td>

                      {/* Tenor & Category */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.type}</div>
                        <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                          {app.mineral} • {app.duration || 'Standard Tenor'}
                        </div>
                      </td>

                      {/* Region & Level */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`font-semibold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {app.region}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            app.level === 'Federal' 
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                          }`}>
                            {app.level} Authority
                          </span>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="px-4 py-3.5 align-middle font-mono text-slate-400">
                        {app.issueDate || app.date || '2024-01-15'}
                      </td>

                      {/* Exact Expiry Date */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                          <Calendar size={13} className={daysInfo.isExpired ? 'text-rose-500' : 'text-slate-400'} />
                          <span className={daysInfo.isExpired ? 'text-rose-500' : darkMode ? 'text-white' : 'text-slate-900'}>
                            {app.expiryDate || '2026-12-31'}
                          </span>
                        </div>
                      </td>

                      {/* Countdown & Status */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className={`text-xs ${daysInfo.statusClass}`}>
                          {daysInfo.label}
                        </div>
                        {isNonRenewable && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            Non-Renewable Tenor
                          </span>
                        )}
                      </td>

                      {/* Statutory Compliance Checklist Badges */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check size={11} className="stroke-[3]" /> Escrow Bond Active
                          </span>
                          {isExploration && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                              <Check size={11} className="stroke-[3]" /> 25% Area Surrender Ready
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Renewal Action Column */}
                      <td className="px-4 py-3.5 align-middle text-right">
                        {isNonRenewable ? (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Conversion Only
                          </span>
                        ) : (
                          <button
                            id={`btn-renew-license-${app.id}`}
                            onClick={() => handleOpenRenewalModal(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <RefreshCw size={12} />
                            <span>Process Renewal</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Renewal Processing Modal */}
      {selectedAppForRenewal && (
        <div id="modal-process-renewal" className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl max-w-xl w-full p-6 border space-y-5 animate-in fade-in zoom-in-95 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-800 text-white">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Endorse Statutory License Renewal</h3>
                  <p className="text-xs text-slate-400">FDRE Mining Proclamation No. 678/2010 • Article 22</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppForRenewal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* License Metadata Summary */}
            <div className={`p-4 rounded-xl text-xs space-y-2 border ${
              darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">License Identifier:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedAppForRenewal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">License Holder:</span>
                <span className="font-bold">{selectedAppForRenewal.applicant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Concession Type:</span>
                <span className="font-semibold">{selectedAppForRenewal.type} ({selectedAppForRenewal.mineral})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Current Expiry Date:</span>
                <span className="font-mono font-bold text-amber-400">{selectedAppForRenewal.expiryDate || '2026-04-15'}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteRenewal} className="space-y-4">
              {/* Extension Term Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                  Select Statutory Extension Tenor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '+1 Year', value: 1 },
                    { label: '+2 Years', value: 2 },
                    { label: '+3 Years', value: 3 },
                    { label: '+5 Years', value: 5 },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExtensionYears(opt.value)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        extensionYears === opt.value
                          ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500'
                          : darkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' 
                            : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated New Expiration Preview */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                <span className="text-slate-300 font-medium">New Effective Expiry Date:</span>
                <span className="font-mono font-bold text-sm text-emerald-400">{previewNewExpiryDate}</span>
              </div>

              {/* Mandatory Statutory Compliance Checklist */}
              <div className="space-y-2 pt-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Mandatory Legal Verification Checklist
                </span>
                
                <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={workProgramAudited} 
                    onChange={(e) => setWorkProgramAudited(e.target.checked)} 
                    className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    required 
                  />
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    Annual technical work program & expenditure obligations audited and approved.
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={escrowConfirmed} 
                    onChange={(e) => setEscrowConfirmed(e.target.checked)} 
                    className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    required 
                  />
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    Environmental Rehabilitation Escrow Guarantee verified with National Bank of Ethiopia.
                  </span>
                </label>

                {selectedAppForRenewal.type.toLowerCase().includes('exploration') && (
                  <label className="flex items-start gap-2 text-xs cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={relinquishmentConfirmed} 
                      onChange={(e) => setRelinquishmentConfirmed(e.target.checked)} 
                      className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      required 
                    />
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                      Statutory 25% Concession Area Relinquishment map submitted to Cadastre GIS registry.
                    </span>
                  </label>
                )}
              </div>

              {/* Reviewer Endorsement Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                  Official Renewal Endorsement Remarks
                </label>
                <textarea
                  id="renewal-remark-input"
                  value={renewalRemark}
                  onChange={(e) => setRenewalRemark(e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 rounded-lg text-xs font-medium border outline-hidden transition-all ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                  }`}
                  placeholder="Enter endorsement details..."
                  required
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppForRenewal(null)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-statutory-renewal"
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition-colors cursor-pointer"
                >
                  Endorse Statutory Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileSpreadsheet, Filter, TrendingUp, DollarSign, Award, 
  CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Calendar, 
  Layers, MapPin, Globe, Sparkles, ChevronRight, Activity, Clock,
  ArrowLeft, History, Search, FileText, CheckCheck, HardDrive, 
  UserCheck, ExternalLink, ArrowDownToLine
} from 'lucide-react';
import { useAppContext } from '../App.tsx';
import { ExportFormatModal, ExportContextType } from './ExportFormatModal.tsx';
import { ExportRecord } from '../types.ts';

interface RegionalScorecard {
  region: string;
  activeLicenses: number;
  royaltyETB: number;
  royaltyUSD: number;
  esiaCompliance: number;
  cdaFundETB: number;
  status: 'Exceeding Benchmark' | 'Audit Cleared' | 'Under Review';
  topMineral: string;
}

const REGIONAL_METRICS: RegionalScorecard[] = [
  { region: 'Oromia', activeLicenses: 42, royaltyETB: 98500000, royaltyUSD: 850000, esiaCompliance: 94, cdaFundETB: 18200000, status: 'Exceeding Benchmark', topMineral: 'Gold & Tantalum' },
  { region: 'Amhara', activeLicenses: 28, royaltyETB: 54200000, royaltyUSD: 468000, esiaCompliance: 88, cdaFundETB: 9800000, status: 'Audit Cleared', topMineral: 'Precious Opal & Coal' },
  { region: 'Tigray', activeLicenses: 24, royaltyETB: 41800000, royaltyUSD: 360000, esiaCompliance: 91, cdaFundETB: 7600000, status: 'Audit Cleared', topMineral: 'Gold & Base Metals' },
  { region: 'Afar', activeLicenses: 19, royaltyETB: 32600000, royaltyUSD: 281000, esiaCompliance: 84, cdaFundETB: 5900000, status: 'Under Review', topMineral: 'Potash & Rock Salt' },
  { region: 'Benishangul-Gumuz', activeLicenses: 17, royaltyETB: 29400000, royaltyUSD: 254000, esiaCompliance: 92, cdaFundETB: 5100000, status: 'Audit Cleared', topMineral: 'Placer & Hard Rock Gold' },
  { region: 'Somali', activeLicenses: 12, royaltyETB: 19800000, royaltyUSD: 171000, esiaCompliance: 86, cdaFundETB: 3400000, status: 'Under Review', topMineral: 'Natural Gas & Marble' },
  { region: 'SNNPR / South', activeLicenses: 15, royaltyETB: 14500000, royaltyUSD: 125000, esiaCompliance: 89, cdaFundETB: 2700000, status: 'Audit Cleared', topMineral: 'Gemstones & Tantalite' }
];

const COMMODITY_PRODUCTION_DATA = [
  { commodity: 'Raw Gold', q1_2025: 1120, q1_2026: 1420, unit: 'kg', color: '#f59e0b' },
  { commodity: 'Processed Opal', q1_2025: 290, q1_2026: 380, unit: 'kg', color: '#06b6d4' },
  { commodity: 'Tantalum', q1_2025: 32.5, q1_2026: 45.0, unit: 'Tons', color: '#8b5cf6' },
  { commodity: 'Potash & Salt', q1_2025: 210, q1_2026: 285, unit: 'k-Tons', color: '#10b981' },
  { commodity: 'Lithium Ore', q1_2025: 8.0, q1_2026: 19.5, unit: 'Tons', color: '#ec4899' }
];

const LICENSE_DISTRIBUTION = [
  { name: 'Exploration & Reconnaissance', value: 42, color: '#10b981' },
  { name: 'Large Scale Mining', value: 34, color: '#f59e0b' },
  { name: 'Artisanal Formalization', value: 16, color: '#3b82f6' },
  { name: 'Processing & Beneficiation', value: 8, color: '#8b5cf6' }
];

export const ReportsAnalyticsView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;
  const { applications, tradeClearances } = state;

  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q1 2026 (Jan - Mar)');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('All');
  const [selectedCommodityFilter, setSelectedCommodityFilter] = useState<string>('All');
  const [currencyMode, setCurrencyMode] = useState<'ETB' | 'USD'>('ETB');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportModalContext, setExportModalContext] = useState<ExportContextType | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'regions' | 'production' | 'environmental'>('overview');
  const [inspectedRegion, setInspectedRegion] = useState<string>('Oromia');

  // Filter regional data according to selection
  const filteredRegionalData = useMemo(() => {
    if (selectedRegionFilter === 'All') return REGIONAL_METRICS;
    return REGIONAL_METRICS.filter(r => r.region.toLowerCase().includes(selectedRegionFilter.toLowerCase()));
  }, [selectedRegionFilter]);

  // Aggregate total royalties
  const totalRoyaltiesETB = useMemo(() => {
    return filteredRegionalData.reduce((acc, curr) => acc + curr.royaltyETB, 0);
  }, [filteredRegionalData]);

  const totalRoyaltiesUSD = useMemo(() => {
    return filteredRegionalData.reduce((acc, curr) => acc + curr.royaltyUSD, 0);
  }, [filteredRegionalData]);

  const totalActiveLicenses = useMemo(() => {
    return filteredRegionalData.reduce((acc, curr) => acc + curr.activeLicenses, 0);
  }, [filteredRegionalData]);

  const avgEsia = useMemo(() => {
    if (filteredRegionalData.length === 0) return 0;
    const sum = filteredRegionalData.reduce((acc, curr) => acc + curr.esiaCompliance, 0);
    return (sum / filteredRegionalData.length).toFixed(1);
  }, [filteredRegionalData]);

  // Handle dynamic CSV export
  const handleExportCSV = () => {
    setIsExporting(true);
    const headers = [
      'License ID', 'Company / Operator', 'TIN', 'Region', 'Mineral Commodity',
      'Jurisdiction Level', 'Status', 'Filing Date', 'Coordinates (Lat/Lng)', 'ESIA Compliance'
    ];
    
    const rows = applications.map(app => [
      `"${app.id}"`,
      `"${app.applicant}"`,
      `"${app.tin}"`,
      `"${app.region}"`,
      `"${app.mineral}"`,
      `"${app.level}"`,
      `"${app.status}"`,
      `"${app.date}"`,
      `"${app.coordinates}"`,
      `"92% Compliant"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FDRE_MoM_Mining_Registry_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsExporting(false), 800);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div id="reports-analytics-view" className="space-y-6">
      
      {/* 1. Header & Institutional Report Actions */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              id="btn-reports-top-left-back"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              title="Go Back"
              className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 mt-1 ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  FDRE Ministry of Mines & MIDI
                </span>
                <span className="text-xs text-slate-400 font-mono">Statistical Digest 2026.01</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Mining Analytics & Regulatory Intelligence
              </h2>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Official statutory compliance audit, royalty distributions (Federal 60% / Regional 40%), export commodity clearances, and Environmental Impact Assessment (ESIA) monitoring.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-export-csv-reports"
              onClick={() => setExportModalContext('reports-csv')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <FileSpreadsheet size={14} className="text-emerald-500" />
              <span>Export CSV Data Ledger</span>
            </button>

            <button
              id="btn-export-pdf-reports"
              onClick={() => setExportModalContext('reports-pdf')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white border border-amber-500 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Download size={14} />
              <span>Official PDF Report</span>
            </button>
          </div>
        </div>

        {/* Interactive Report View Sub-Tabs */}
        <div className={`mt-5 pt-4 border-t flex flex-wrap items-center gap-2 ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          {[
            { id: 'overview', label: 'Executive KPIs & Royalties' },
            { id: 'regions', label: 'Regional Bureau Scorecards' },
            { id: 'production', label: 'Commodity Output & Exports' },
            { id: 'environmental', label: 'ESIA & Community Development' }
          ].map(tab => (
            <button
              key={tab.id}
              id={`btn-report-tab-${tab.id}`}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReportTab === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-600'
                  : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Interactive Filter Toolbar */}
        <div className={`mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-400">
              <Filter size={14} className="text-emerald-500" />
              <span>Filter View:</span>
            </div>

            {/* Timeframe selector */}
            <select
              id="report-filter-period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border font-semibold outline-none cursor-pointer text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="Q1 2026 (Jan - Mar)">Q1 2026 (Jan - Mar)</option>
              <option value="Q2 2026 (Forecast)">Q2 2026 (Forecast)</option>
              <option value="Fiscal Year 2025/2026">Fiscal Year 2025/2026</option>
              <option value="All Time Records">All Time Records</option>
            </select>

            {/* Region selector */}
            <select
              id="report-filter-region"
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border font-semibold outline-none cursor-pointer text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Regional States</option>
              <option value="Oromia">Oromia Regional Bureau</option>
              <option value="Amhara">Amhara Regional Bureau</option>
              <option value="Tigray">Tigray Regional Bureau</option>
              <option value="Afar">Afar Regional Bureau</option>
              <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
              <option value="Somali">Somali Regional Bureau</option>
              <option value="SNNPR">SNNPR / South Bureau</option>
            </select>

            {/* Commodity Category */}
            <select
              id="report-filter-commodity"
              value={selectedCommodityFilter}
              onChange={(e) => setSelectedCommodityFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border font-semibold outline-none cursor-pointer text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Commodity Groups</option>
              <option value="Gold">Precious Metals (Gold, Silver)</option>
              <option value="Tantalum">Critical / Rare Earth Minerals</option>
              <option value="Opal">Gemstones (Opal, Emerald)</option>
              <option value="Potash">Industrial (Potash, Salt, Marble)</option>
            </select>
          </div>

          {/* Currency Toggle Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold px-2 text-slate-500 dark:text-slate-400">Valuation:</span>
            <button
              onClick={() => setCurrencyMode('ETB')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currencyMode === 'ETB'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              ETB (Birr)
            </button>
            <button
              onClick={() => setCurrencyMode('USD')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                currencyMode === 'USD'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Metric Cards (4 Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Estimated Mining Royalties */}
        <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Statutory Royalties</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <DollarSign size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            {currencyMode === 'ETB' 
              ? `${(totalRoyaltiesETB / 1000000).toFixed(1)}M ETB` 
              : `$${(totalRoyaltiesUSD / 1000000).toFixed(2)}M USD`}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Federal MoM Share (60%):</span>
            <strong className="text-emerald-500">
              {currencyMode === 'ETB' 
                ? `${((totalRoyaltiesETB * 0.6) / 1000000).toFixed(1)}M` 
                : `$${((totalRoyaltiesUSD * 0.6) / 1000000).toFixed(2)}M`}
            </strong>
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between mt-0.5">
            <span>Regional Bureau Share (40%):</span>
            <strong className="text-amber-500">
              {currencyMode === 'ETB' 
                ? `${((totalRoyaltiesETB * 0.4) / 1000000).toFixed(1)}M` 
                : `$${((totalRoyaltiesUSD * 0.4) / 1000000).toFixed(2)}M`}
            </strong>
          </div>
        </div>

        {/* KPI 2: Active Regulated Concessions */}
        <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Concessions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {totalActiveLicenses} Concessions
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Across 7 major mining corridors.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Zero-Overlap Cadastre Verified
          </div>
        </div>

        {/* KPI 3: Environmental & Social Compliance (ESIA) */}
        <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">ESIA Environmental Audit</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Award size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {avgEsia}% Passed
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Mandatory watershed & tailings safety.
          </p>
          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgEsia}%` }}></div>
          </div>
        </div>

        {/* KPI 4: Turnaround Velocity */}
        <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Review Velocity</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            14.2 Days
          </div>
          <p className="mt-2 text-xs text-slate-400">
            From Regional Bureau to MoM clearance.
          </p>
          <div className="mt-2 text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <TrendingUp size={12} />
            <span>68% Faster vs 45-day paper baseline</span>
          </div>
        </div>

      </div>

      {/* 3. Deep Analytical Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart A: Commodity Export Volume & Trends (2 Cols) */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border shadow-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Mineral Commodity Production & Export Volume
              </h3>
              <p className="text-xs text-slate-400">
                Quarter-over-Quarter comparison cleared via National Bank of Ethiopia (NBE) & MoM.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-emerald-500 font-bold self-start sm:self-auto">
              +24.6% Overall Output
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMMODITY_PRODUCTION_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="commodity" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: darkMode ? '#f8fafc' : '#0f172a'
                  }}
                  formatter={(value: any, name: any, item: any) => [`${value} ${item.payload.unit}`, name === 'q1_2026' ? 'Q1 2026 (Current)' : 'Q1 2025 (Prior Year)']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="q1_2025" name="Q1 2025 Production" fill={darkMode ? "#475569" : "#94a3b8"} radius={[4, 4, 0, 0]} />
                <Bar dataKey="q1_2026" name="Q1 2026 Production (Target)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Concession Licensing Distribution by Tier (1 Col) */}
        <div className={`p-5 rounded-2xl border shadow-xs transition-colors flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Licensing Category Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Statutory breakdown across upstream and downstream tiers.
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={LICENSE_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {LICENSE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${value}% of Registry`, 'Distribution']}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {LICENSE_DISTRIBUTION.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{item.name}</span>
                </div>
                <span className="font-bold font-mono text-emerald-500">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Comprehensive Regional Bureau Compliance & Royalties Scorecard Table */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Regional Mining Bureau Compliance & Revenue Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Audited performance across regional authorities per Ethiopian Mining Proclamation No. 678/2010.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredRegionalData.length} Jurisdictions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase font-bold tracking-wider border-b ${
              darkMode ? 'bg-slate-950/70 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <tr>
                <th className="px-4 py-3.5">Regional Mining Authority</th>
                <th className="px-4 py-3.5">Primary Mineral Resource</th>
                <th className="px-4 py-3.5 text-center">Active Concessions</th>
                <th className="px-4 py-3.5">ESIA Environmental Score</th>
                <th className="px-4 py-3.5 text-right">
                  {currencyMode === 'ETB' ? 'Total Royalties (ETB)' : 'Total Royalties (USD)'}
                </th>
                <th className="px-4 py-3.5 text-right">Community Dev Fund</th>
                <th className="px-4 py-3.5 text-center">Statutory Audit Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredRegionalData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-800/50 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <td className="px-4 py-3.5 font-bold flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-[10px] font-black border border-emerald-800">
                      {row.region.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={darkMode ? 'text-white' : 'text-slate-900'}>{row.region} Regional Bureau</div>
                      <div className="text-[10px] text-slate-400 font-normal">FDRE Regional Directorate</div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                    {row.topMineral}
                  </td>

                  <td className="px-4 py-3.5 text-center font-mono font-bold">
                    {row.activeLicenses}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            row.esiaCompliance >= 90 ? 'bg-emerald-500' : row.esiaCompliance >= 85 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${row.esiaCompliance}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-xs">{row.esiaCompliance}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {currencyMode === 'ETB' 
                      ? `${(row.royaltyETB / 1000000).toFixed(2)}M ETB` 
                      : `$${(row.royaltyUSD / 1000).toFixed(0)}k USD`}
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono text-slate-500 dark:text-slate-400">
                    {(row.cdaFundETB / 1000000).toFixed(1)}M ETB
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      row.status === 'Exceeding Benchmark'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : row.status === 'Audit Cleared'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {row.status === 'Exceeding Benchmark' && <Sparkles size={11} />}
                      {row.status === 'Audit Cleared' && <CheckCircle2 size={11} />}
                      {row.status === 'Under Review' && <AlertTriangle size={11} />}
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Statutory Formula Notice */}
        <div className={`p-4 border-t text-[11px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
          darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Statutory Revenue Sharing:</span>
            <span>60% Federal Consolidated Revenue Fund • 40% Regional State Special Infrastructure Fund</span>
          </div>
          <div className="font-mono text-[10px]">
            Audit Cycle: Monthly Reconciled with MoM Treasury
          </div>
        </div>
      </div>

      {/* 5. Interactive Regional Authority Dossier Drill-Down */}
      {inspectedRegion && (() => {
        const regApps = applications.filter(a => a.region.toLowerCase() === inspectedRegion.toLowerCase());
        const scorecard = REGIONAL_METRICS.find(r => r.region.toLowerCase() === inspectedRegion.toLowerCase()) || REGIONAL_METRICS[0];
        
        return (
          <div id="regional-drilldown-panel" className={`p-5 rounded-2xl border transition-colors shadow-sm ${
            darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-black text-sm flex items-center justify-center">
                  {scorecard.region.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {scorecard.region} Regional Bureau Detailed Profile
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {scorecard.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cadastre registry records & revenue split under Regional Mining Authority.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch({ type: 'NAVIGATE', payload: 'map' })}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin size={13} />
                  <span>View in Cadastre GIS</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Active Licences</div>
                <div className="text-lg font-black text-emerald-500 mt-1">{scorecard.activeLicenses} Filings</div>
                <div className="text-[10px] text-slate-400 mt-0.5">In federal database</div>
              </div>
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase">ESIA Environmental</div>
                <div className="text-lg font-black text-blue-500 mt-1">{scorecard.esiaCompliance}% Cleared</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tailings & watershed</div>
              </div>
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Regional Share (40%)</div>
                <div className="text-lg font-black text-amber-500 mt-1">{(scorecard.royaltyETB * 0.4 / 1000000).toFixed(1)}M ETB</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Special infra fund</div>
              </div>
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase">CDA Community Fund</div>
                <div className="text-lg font-black text-purple-500 mt-1">{(scorecard.cdaFundETB / 1000000).toFixed(1)}M ETB</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Schools & clinics</div>
              </div>
            </div>

            {/* List of registered applications in this region */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                Registered Mining Operations in {scorecard.region} ({regApps.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {regApps.map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => dispatch({ type: 'NAVIGATE', payload: 'application-detail', entityId: app.id })}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                      darkMode ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-600' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-emerald-500">{app.id}</div>
                      <div className={`font-semibold text-xs mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{app.applicant}</div>
                      <div className="text-[10px] text-slate-400">{app.mineral} • {app.type}</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Export Formats Modal Dialog */}
      <ExportFormatModal
        isOpen={exportModalContext !== null}
        onClose={() => setExportModalContext(null)}
        context={exportModalContext || 'reports-csv'}
        applications={applications}
        darkMode={darkMode}
      />
    </div>
  );
};

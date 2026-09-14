import React, { useState } from 'react';
import { 
  Globe, ArrowRightLeft, ShieldCheck, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, Plus, Download, FileText, ExternalLink, Building2, Truck, 
  DollarSign, Check, X, Eye
} from 'lucide-react';
import { useAppContext } from '../App.tsx';
import { TradeClearance } from '../types.ts';

const INITIAL_TRADE_CLEARANCES: TradeClearance[] = [
  {
    id: 'EXP-2026-0041',
    companyName: 'EthioGold Mining Share Co.',
    tin: '0048291047',
    type: 'Commercial Mineral Export',
    commodityOrEquipment: 'Refined Gold Dore Bars (92.4% Purity)',
    quantity: '250.0 kg',
    valuationUSD: '$17,250,000',
    valuationETB: '2,070,000,000 ETB',
    portOrDestination: 'Bole Cargo Hub → Zurich Refinery (Switzerland)',
    status: 'NBE Forex Cleared & Export Approved',
    date: '2026-03-02',
    nbeReference: 'NBE/FX/EXP-88912',
    customsDecNo: 'ECC-CD-2026-10492',
    country: 'Switzerland'
  },
  {
    id: 'IMP-2026-0019',
    companyName: 'Midroc Gold Mine Operations PLC',
    tin: '0019283741',
    type: 'Duty-Free Equipment Import',
    commodityOrEquipment: 'Komatsu PC2000-11 Mining Excavator & Crushers',
    quantity: '4 Units',
    valuationUSD: '$4,800,000',
    valuationETB: '576,000,000 ETB',
    portOrDestination: 'Port of Djibouti → Lega Dembi Mine Site, Oromia',
    status: 'Duty-Free BoQ Approved',
    date: '2026-03-04',
    nbeReference: 'NBE/DF/BOQ-4412',
    customsDecNo: 'ECC-CD-2026-08174',
    country: 'Japan'
  },
  {
    id: 'EXP-2026-0042',
    companyName: 'Danakil Salt & Potash Share Co.',
    tin: '0077210948',
    type: 'Commercial Mineral Export',
    commodityOrEquipment: 'Industrial Grade Muriate of Potash (MOP)',
    quantity: '12,500 Metric Tons',
    valuationUSD: '$3,875,000',
    valuationETB: '465,000,000 ETB',
    portOrDestination: 'Semera Hub → Port of Djibouti → Mumbai, India',
    status: 'Under Customs Physical Inspection',
    date: '2026-03-05',
    nbeReference: 'NBE/FX/EXP-89004',
    customsDecNo: 'ECC-CD-2026-11204',
    country: 'India'
  },
  {
    id: 'EXP-2026-0043',
    companyName: 'Abyssinia Tantalum Consortium',
    tin: '0033918274',
    type: 'Commercial Mineral Export',
    commodityOrEquipment: 'Columbite-Tantalite Concentrate (42% Ta2O5)',
    quantity: '35.0 Tons',
    valuationUSD: '$2,450,000',
    valuationETB: '294,000,000 ETB',
    portOrDestination: 'Bole Cargo Hub → Singapore Processing Terminal',
    status: 'Assay & Origin Verified',
    date: '2026-03-06',
    nbeReference: 'NBE/FX/EXP-89021',
    customsDecNo: 'ECC-CD-2026-11388',
    country: 'Singapore'
  },
  {
    id: 'IMP-2026-0020',
    companyName: 'Kenticha Lithium & Rare Metals Industries',
    tin: '0081294710',
    type: 'Duty-Free Equipment Import',
    commodityOrEquipment: 'Flotation Beneficiation Plant & Chemical Reagents',
    quantity: '1 Complete Plant Set',
    valuationUSD: '$8,200,000',
    valuationETB: '984,000,000 ETB',
    portOrDestination: 'Port of Djibouti → Kenticha Site, Southern Oromia',
    status: 'Duty-Free BoQ Approved',
    date: '2026-02-28',
    nbeReference: 'NBE/DF/BOQ-4389',
    customsDecNo: 'ECC-CD-2026-07821',
    country: 'Germany'
  },
  {
    id: 'EXP-2026-0044',
    companyName: 'Horn of Africa Gemstones Union',
    tin: '0062839102',
    type: 'Commercial Mineral Export',
    commodityOrEquipment: 'Faceted & Cut Welo Opals & Fine Emeralds',
    quantity: '1,200 Carats',
    valuationUSD: '$950,000',
    valuationETB: '114,000,000 ETB',
    portOrDestination: 'Bole International Cargo → Dubai DMCC, UAE',
    status: 'NBE Forex Cleared & Export Approved',
    date: '2026-03-07',
    nbeReference: 'NBE/FX/EXP-89045',
    customsDecNo: 'ECC-CD-2026-11492',
    country: 'United Arab Emirates'
  },
  {
    id: 'IMP-2026-0021',
    companyName: 'Kurmuk Gold Development PLC',
    tin: '0054719283',
    type: 'Duty-Free Equipment Import',
    commodityOrEquipment: 'Atlas Copco Hydraulic Core Drilling Rig System',
    quantity: '2 Drill Units',
    valuationUSD: '$1,650,000',
    valuationETB: '198,000,000 ETB',
    portOrDestination: 'Port of Djibouti → Asosa, Benishangul-Gumuz',
    status: 'Pending Bank Guarantee',
    date: '2026-03-08',
    nbeReference: 'NBE/DF/BOQ-4450',
    customsDecNo: 'ECC-CD-2026-11501',
    country: 'Sweden'
  }
];

export const TradeView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { darkMode } = state;

  const [clearances, setClearances] = useState<TradeClearance[]>(
    state.tradeClearances && state.tradeClearances.length > 0
      ? state.tradeClearances
      : INITIAL_TRADE_CLEARANCES
  );

  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [inspectItem, setInspectItem] = useState<TradeClearance | null>(null);

  // New clearance form state
  const [newCompany, setNewCompany] = useState('');
  const [newTin, setNewTin] = useState('');
  const [newType, setNewType] = useState<'Commercial Mineral Export' | 'Duty-Free Equipment Import'>('Commercial Mineral Export');
  const [newCommodity, setNewCommodity] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newValuationUSD, setNewValuationUSD] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newCountry, setNewCountry] = useState('Switzerland');

  const filteredClearances = clearances.filter(item => {
    const matchesSearch = 
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.commodityOrEquipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tin.includes(searchQuery);

    const matchesType = 
      filterType === 'all' || 
      (filterType === 'export' && item.type === 'Commercial Mineral Export') ||
      (filterType === 'import' && item.type === 'Duty-Free Equipment Import');

    const matchesStatus = 
      filterStatus === 'all' || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateClearance = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = newType === 'Commercial Mineral Export' 
      ? `EXP-2026-00${clearances.length + 45}` 
      : `IMP-2026-00${clearances.length + 22}`;

    const parsedUSD = parseFloat(newValuationUSD.replace(/[^0-9.]/g, '')) || 500000;
    const estETB = (parsedUSD * 120).toLocaleString() + ' ETB';

    const newItem: TradeClearance = {
      id: newId,
      companyName: newCompany,
      tin: newTin || '0098234190',
      type: newType,
      commodityOrEquipment: newCommodity,
      quantity: newQty,
      valuationUSD: `$${parsedUSD.toLocaleString()}`,
      valuationETB: estETB,
      portOrDestination: newDestination,
      status: newType === 'Commercial Mineral Export' ? 'Assay & Origin Verified' : 'Duty-Free BoQ Approved',
      date: new Date().toISOString().split('T')[0],
      nbeReference: `NBE/FX/${newId.replace('EXP-', 'EX-').replace('IMP-', 'DF-')}`,
      customsDecNo: `ECC-CD-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      country: newCountry
    };

    setClearances([newItem, ...clearances]);
    setShowRegisterModal(false);
    // Reset form
    setNewCompany('');
    setNewCommodity('');
    setNewQty('');
    setNewValuationUSD('');
    setNewDestination('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NBE Forex Cleared & Export Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-700 dark:text-emerald-400" />
            NBE Forex Cleared & Approved
          </span>
        );
      case 'Duty-Free BoQ Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
            <ShieldCheck size={13} className="text-blue-700 dark:text-blue-400" />
            Duty-Free BoQ Approved
          </span>
        );
      case 'Assay & Origin Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            <Clock size={13} className="text-amber-700 dark:text-amber-400" />
            Assay & Origin Verified
          </span>
        );
      case 'Under Customs Physical Inspection':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800">
            <AlertCircle size={13} className="text-purple-700 dark:text-purple-400" />
            Customs Physical Inspection
          </span>
        );
      case 'Pending Bank Guarantee':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <Clock size={13} className="text-slate-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div id="trade-import-export-container" className="space-y-6">
      {/* Top Banner Header */}
      <div className={`p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-800 text-white rounded-xl shadow-xs">
            <Globe size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">Mineral Import / Export Clearances</h2>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded font-mono">
                NBE & CUSTOMS SINGLE-WINDOW
              </span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Verified company clearances, duty-free equipment imports, and commercial mineral export approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            id="btn-export-trade-sheet"
            onClick={() => window.print()}
            className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Download size={14} /> Export Digest
          </button>
          <button 
            id="btn-new-clearance-filing"
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus size={15} /> File Trade Clearance
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border border-l-4 border-l-emerald-600 shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Commercial Export Value</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">$24.52M USD</h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg dark:bg-emerald-950 dark:text-emerald-300">
              <Globe size={18} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">NBE foreign currency repatriation accounts verified</p>
        </div>

        <div className={`p-4 rounded-xl border border-l-4 border-l-blue-600 shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Duty-Free BoQ Approvals</p>
              <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5">$14.65M USD</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-lg dark:bg-blue-950 dark:text-blue-300">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Heavy mining equipment exempt from customs tariffs</p>
        </div>

        <div className={`p-4 rounded-xl border border-l-4 border-l-amber-600 shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Active Authorized Companies</p>
              <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{clearances.length} Entities</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-800 rounded-lg dark:bg-amber-950 dark:text-amber-300">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Licensed commercial exporters & mining concessionaires</p>
        </div>
      </div>

      {/* Horizontal Filter Tabs & Search Bar */}
      <div className={`p-4 rounded-xl border shadow-xs space-y-3 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search by Company Name or ID */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-company-trade"
              type="text"
              placeholder="Search company name, TIN, or permit ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none font-medium ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All Operations' },
              { id: 'export', label: 'Commercial Mineral Exports' },
              { id: 'import', label: 'Duty-Free Equipment Imports' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  filterType === tab.id
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
      </div>

      {/* Companies & Clearances Table */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Registered Companies & Trade Regulatory Status
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing {filteredClearances.length} licensed company clearances
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase font-bold border-b ${
              darkMode 
                ? 'bg-slate-950 text-slate-400 border-slate-800' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="px-4 py-3">Permit ID</th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Operation Type</th>
                <th className="px-4 py-3">Commodity / Machinery</th>
                <th className="px-4 py-3">Valuation (USD)</th>
                <th className="px-4 py-3">Regulatory Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredClearances.map((item) => (
                <tr 
                  key={item.id} 
                  className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {item.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      <span>{item.companyName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      TIN: {item.tin}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.type === 'Commercial Mineral Export'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{item.commodityOrEquipment}</div>
                    <div className="text-[10px] text-slate-400">{item.quantity} • Dest: {item.country}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {item.valuationUSD}
                    <div className="text-[10px] text-slate-400 font-normal font-sans">{item.valuationETB}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      id={`btn-inspect-trade-${item.id}`}
                      onClick={() => setInspectItem(item)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded font-semibold text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Eye size={12} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Clearance Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-lg w-full rounded-2xl border shadow-2xl p-6 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  FDRE Single-Window Dossier
                </span>
                <h3 className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-400">
                  {inspectItem.id}
                </h3>
              </div>
              <button 
                onClick={() => setInspectItem(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border ${
                darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Licensed Company</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{inspectItem.companyName}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Taxpayer ID (TIN): {inspectItem.tin}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2.5 rounded-lg border ${
                  darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Commodity / Machinery</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{inspectItem.commodityOrEquipment}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{inspectItem.quantity}</p>
                </div>
                <div className={`p-2.5 rounded-lg border ${
                  darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Valuation</p>
                  <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{inspectItem.valuationUSD}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{inspectItem.valuationETB}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg border space-y-2 ${
                darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <div>{getStatusBadge(inspectItem.status)}</div>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">NBE Reference:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{inspectItem.nbeReference}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Customs Dec No:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{inspectItem.customsDecNo}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Logistics Routing:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{inspectItem.portOrDestination}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
                <p className="font-bold text-xs flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" />
                  Statutory Regulatory Compliance Cleared
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Ministry of Mines Central Laboratory Assay Certificate and National Bank of Ethiopia foreign currency allocation verified.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File New Clearance Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl border shadow-2xl p-6 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black">Register New Import / Export Clearance</h3>
              <button 
                onClick={() => setShowRegisterModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClearance} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurmuk Mining Share Co."
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Taxpayer ID (TIN)</label>
                  <input
                    type="text"
                    required
                    placeholder="0012948291"
                    value={newTin}
                    onChange={(e) => setNewTin(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Operation Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className={`w-full p-2.5 rounded-lg border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Commercial Mineral Export">Commercial Mineral Export</option>
                    <option value="Duty-Free Equipment Import">Duty-Free Equipment Import</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Commodity or Machinery</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Dore Bars 92% or Excavator BoQ"
                  value={newCommodity}
                  onChange={(e) => setNewCommodity(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity / Volume</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 kg or 2 Units"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Valuation (USD)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1500000"
                    value={newValuationUSD}
                    onChange={(e) => setNewValuationUSD(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Logistics Route / Port</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole Cargo Hub → Zurich Refinery"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Submit for Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

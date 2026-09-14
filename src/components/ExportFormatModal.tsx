import React, { useState } from 'react';
import { 
  X, Download, Printer, FileText, FileSpreadsheet, Code, Check, 
  Layers, Shield, Eye, Database, Table, Sparkles, ExternalLink 
} from 'lucide-react';
import type { Application, DemoUser, ExportRecord } from '../types';

export type ExportContextType = 
  | 'executive-digest' 
  | 'application-registry' 
  | 'reports-csv' 
  | 'reports-pdf'
  | 'bulk-selection';

interface ExportFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ExportContextType;
  applications: Application[];
  darkMode?: boolean;
  currentUser?: DemoUser | null;
  onExportGenerated?: (record: ExportRecord) => void;
}

interface FormatOption {
  id: string;
  extension: string;
  name: string;
  category: 'Spreadsheet / Tabular' | 'Document / Print' | 'Spatial / GIS' | 'Data Interchange';
  mimeType: string;
  description: string;
  standard: string;
  badgeColor: string;
  icon: React.ElementType;
}

export const ExportFormatModal: React.FC<ExportFormatModalProps> = ({
  isOpen,
  onClose,
  context,
  applications,
  darkMode = false,
  currentUser,
  onExportGenerated
}) => {
  if (!isOpen) return null;

  // Define formats based on the requested export context
  const getFormatsForContext = (): FormatOption[] => {
    switch (context) {
      case 'executive-digest':
        return [
          {
            id: 'pdf-digest',
            extension: '.PDF',
            name: 'Official Executive Mining Digest (Print-Ready PDF)',
            category: 'Document / Print',
            mimeType: 'application/pdf',
            description: 'Formatted executive briefing with FDRE Ministry of Mines watermark, KPI summaries, regional royalty disbursements, and formal ministerial signature blocks.',
            standard: 'MoM Executive Protocol 2026',
            badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
            icon: FileText
          },
          {
            id: 'csv-digest',
            extension: '.CSV',
            name: 'Executive Statistical Aggregate Ledger',
            category: 'Spreadsheet / Tabular',
            mimeType: 'text/csv (UTF-8)',
            description: 'Tabular summary metrics by region, category, royalty share (60% Federal / 40% Regional), and active license counts formatted for Microsoft Excel / Google Sheets.',
            standard: 'FDRE Open Data Standard',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            icon: FileSpreadsheet
          },
          {
            id: 'html-digest',
            extension: '.HTML',
            name: 'Self-Contained Executive Dossier (Offline Web Doc)',
            category: 'Document / Print',
            mimeType: 'text/html',
            description: 'Standalone HTML document with embedded CSS styling for offline cabinet presentation, archival storage, and direct browser review.',
            standard: 'W3C Standalone Document',
            badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
            icon: Code
          },
          {
            id: 'json-digest',
            extension: '.JSON',
            name: 'Cabinet Briefing Metadata Feed',
            category: 'Data Interchange',
            mimeType: 'application/json',
            description: 'Structured JSON payload containing executive indicators, status distributions, and regional metrics for automated government dashboard ingestion.',
            standard: 'RFC 8259 JSON Standard',
            badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
            icon: Database
          }
        ];

      case 'application-registry':
      case 'bulk-selection':
        return [
          {
            id: 'csv-registry',
            extension: '.CSV',
            name: 'Complete Mining Cadastre Registry Sheet',
            category: 'Spreadsheet / Tabular',
            mimeType: 'text/csv (UTF-8 Comma-Delimited)',
            description: 'Full registry ledger with all active records: License ID, Applicant, TIN, Mineral, Jurisdiction Level, Status, Coordinates, and Expiry Dates.',
            standard: 'ISO 4180 CSV / Excel Compatible',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            icon: FileSpreadsheet
          },
          {
            id: 'pdf-roster',
            extension: '.PDF',
            name: 'Official Printed Cadastre Roster (PDF Document)',
            category: 'Document / Print',
            mimeType: 'application/pdf',
            description: 'Formal multi-page statutory registry roster formatted with Ministry letterhead, official table grid, verification seals, and authorized signatures.',
            standard: 'Proc. No. 678/2010 Registry Ledger',
            badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
            icon: FileText
          },
          {
            id: 'tsv-spatial',
            extension: '.TSV',
            name: 'GIS Spatial Coordinates Sheet (Tab-Delimited)',
            category: 'Spatial / GIS',
            mimeType: 'text/tab-separated-values',
            description: 'Demarcated polygon boundary points and centroid coordinates optimized for ingestion into ArcGIS, QGIS, and regional cadastre mapping systems.',
            standard: 'OGC WKT / GIS Boundary Schema',
            badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
            icon: Layers
          },
          {
            id: 'json-registry',
            extension: '.JSON',
            name: 'Federal Mining Registry JSON Data Feed',
            category: 'Data Interchange',
            mimeType: 'application/json',
            description: 'Full machine-readable array of applications with nested metadata (financial proof, escrow status, environmental clearance, and audit trail).',
            standard: 'REST / OpenData Cadastre Schema',
            badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
            icon: Database
          }
        ];

      case 'reports-csv':
        return [
          {
            id: 'csv-operations',
            extension: '.CSV',
            name: 'Comprehensive Mineral Cadastre & Operations Ledger',
            category: 'Spreadsheet / Tabular',
            mimeType: 'text/csv (UTF-8)',
            description: 'All concession filings, operators, tax identification numbers, mineral classifications, approval statuses, and ESIA scores.',
            standard: 'Ministry of Mines Master Ledger',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            icon: FileSpreadsheet
          },
          {
            id: 'csv-royalties',
            extension: '.CSV',
            name: 'Regional Royalty Distribution & Fiscal Split Ledger',
            category: 'Spreadsheet / Tabular',
            mimeType: 'text/csv (UTF-8)',
            description: 'Complete fiscal breakdown of royalties collected: Federal Treasury (60%), Regional Bureau Development Fund (40%), and CDA Escrow Allocations.',
            standard: 'FDRE Ministry of Finance & MoM Accord',
            badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
            icon: Table
          },
          {
            id: 'csv-commodities',
            extension: '.CSV',
            name: 'Mineral Commodity Output & Export Customs Clearance CSV',
            category: 'Spreadsheet / Tabular',
            mimeType: 'text/csv (UTF-8)',
            description: 'Export volume (MT), FOB value (USD), domestic extraction quotas, and assay grades for Gold, Tantalum, Lithium, Potash, and Coal.',
            standard: 'National Bank of Ethiopia & Customs Clearing',
            badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
            icon: Database
          }
        ];

      case 'reports-pdf':
      default:
        return [
          {
            id: 'pdf-official-report',
            extension: '.PDF',
            name: 'FDRE Ministry of Mines Official Statistical & Audit Report',
            category: 'Document / Print',
            mimeType: 'application/pdf (Print-Ready)',
            description: 'Complete quarterly institutional report: Federal & Regional Royalty Distribution, Environmental Rehabilitation Audits, and Concession Validity Rosters with ministerial sign-offs.',
            standard: 'FDRE MoM Quarterly Audit Standard',
            badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
            icon: FileText
          },
          {
            id: 'pdf-regional-scorecard',
            extension: '.PDF',
            name: 'Regional Mining Authority Performance Scorecard (PDF)',
            category: 'Document / Print',
            mimeType: 'application/pdf (Print-Ready)',
            description: 'State bureau comparative dossier: Active operations in Oromia, Amhara, Tigray, Afar, Benishangul-Gumuz, inspection clearance rates, and community fund disbursement.',
            standard: 'Inter-Regional Coordination Protocol',
            badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
            icon: Layers
          },
          {
            id: 'pdf-esia-audit',
            extension: '.PDF',
            name: 'ESIA Environmental & Tailings Compliance Audit Memorandum',
            category: 'Document / Print',
            mimeType: 'application/pdf (Print-Ready)',
            description: 'Environmental impact compliance certificates, watershed protection compliance, and Mine Closure Escrow audits under EPA regulations.',
            standard: 'EPA Ethiopia Environmental Accord',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            icon: Shield
          }
        ];
    }
  };

  const formats = getFormatsForContext();
  const [selectedFormatId, setSelectedFormatId] = useState<string>(formats[0]?.id || '');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const activeFormat = formats.find(f => f.id === selectedFormatId) || formats[0];

  const getContextTitle = () => {
    switch (context) {
      case 'executive-digest':
        return {
          title: 'Download Formats: Executive Mining Digest',
          subtitle: 'Choose your desired document or data format for cabinet briefing & executive reporting'
        };
      case 'application-registry':
        return {
          title: 'Export Sheet Formats: Applications Registry',
          subtitle: 'Download the centralized mining applications register in your preferred format'
        };
      case 'reports-csv':
        return {
          title: 'Download Formats: Reports CSV Data Ledger',
          subtitle: 'Select tabular data ledger format for fiscal accounting, cadastre mapping, or customs auditing'
        };
      case 'reports-pdf':
        return {
          title: 'Download Formats: Official PDF Report',
          subtitle: 'Select official formatted PDF and institutional print dossiers with ministerial authorization seals'
        };
      case 'bulk-selection':
        return {
          title: `Export Batch: ${applications.length} Selected Concessions`,
          subtitle: 'Download custom official ledger and spatial dossier for selected application records'
        };
    }
  };

  const { title, subtitle } = getContextTitle();

  // Trigger file generation and real download
  const handleDownloadSelected = () => {
    const today = new Date().toISOString().split('T')[0];
    let filename = '';
    let content = '';
    let mimeType = 'text/plain';

    if (activeFormat.id.includes('csv') || activeFormat.extension === '.CSV') {
      mimeType = 'text/csv;charset=utf-8;';
      if (activeFormat.id === 'csv-royalties') {
        filename = `FDRE_MoM_Royalty_Distribution_Split_${today}.csv`;
        content = [
          'Region,Active Licenses,Total Royalty (ETB),Federal Treasury Share 60% (ETB),Regional Bureau Share 40% (ETB),CDA Community Fund (ETB),ESIA Compliance',
          'Oromia,42,"142,500,000","85,500,000","57,000,000","18,500,000",94%',
          'Amhara,28,"98,200,000","58,920,000","39,280,000","12,200,000",91%',
          'Tigray,19,"64,800,000","38,880,000","25,920,000","8,900,000",89%',
          'Afar,15,"51,400,000","30,840,000","20,560,000","6,400,000",96%',
          'Benishangul-Gumuz,22,"76,300,000","45,780,000","30,520,000","10,100,000",93%',
          'Federal Concessions,14,"185,000,000","111,000,000","74,000,000","24,000,000",98%'
        ].join('\n');
      } else if (activeFormat.id === 'csv-commodities') {
        filename = `FDRE_MoM_Commodity_Export_Clearances_${today}.csv`;
        content = [
          'Commodity,Type,Export Volume (MT),Export FOB Value (USD),Domestic Reserve % (NBE),Primary Destination,Customs Clearance Port',
          'Gold (Refined 99.9%),Precious Metal,12.4 MT,"$84,500,000",100% to National Bank of Ethiopia,Domestic Reserve / Switzerland,Addis Ababa Bole Int Airport',
          'Lithium (Spodumene Concentrate),Critical Battery Mineral,34500 MT,"$41,200,000",15% Domestic Processing,China / UAE,Djibouti Port Corridor',
          'Tantalum (Tantalite Ore),High-Tech Strategic,850 MT,"$18,700,000",20% Domestic Value Addition,Germany / USA,Djibouti Port Corridor',
          'Potash (MOP/SOP),Agricultural Fertilizer,120000 MT,"$36,000,000",40% Domestic Agriculture,India / Kenya,Djibouti Port Corridor',
          'Coal (Clean Coking),Industrial Fuel,480000 MT,"$29,500,000",100% Domestic Cement Plants,Domestic Ethiopian Factories,Direct Rail to Mugher/Messebo'
        ].join('\n');
      } else {
        filename = `FDRE_Mining_Cadastre_Ledger_${today}.csv`;
        const headers = ['License ID', 'Applicant / Company', 'TIN', 'Category', 'Mineral', 'Region', 'Jurisdiction Level', 'Coordinates', 'Status', 'Filing Date', 'Expiry Date'];
        const rows = applications.map(a => [
          `"${a.id}"`,
          `"${a.applicant}"`,
          `"${a.tin}"`,
          `"${a.type}"`,
          `"${a.mineral}"`,
          `"${a.region}"`,
          `"${a.level}"`,
          `"${a.coordinates}"`,
          `"${a.status}"`,
          `"${a.date}"`,
          `"${a.expiryDate || '2027-12-31'}"`
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      }
    } else if (activeFormat.extension === '.TSV') {
      mimeType = 'text/tab-separated-values;charset=utf-8;';
      filename = `FDRE_Cadastre_GIS_Spatial_Ledger_${today}.tsv`;
      const headers = ['LICENSE_ID', 'OPERATOR', 'MINERAL', 'REGION', 'LEVEL', 'CENTROID_COORDINATES', 'POLYGON_POINTS', 'SURFACE_AREA_KM2'];
      const rows = applications.map(a => [
        a.id,
        a.applicant,
        a.mineral,
        a.region,
        a.level,
        a.coordinates,
        `POLYGON((${a.coordinates}, ${a.coordinates}))`,
        a.concessionAreaKm2 || '45.0'
      ]);
      content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    } else if (activeFormat.extension === '.JSON') {
      mimeType = 'application/json;charset=utf-8;';
      filename = `FDRE_MoM_Cadastre_Snapshot_${today}.json`;
      content = JSON.stringify({
        metadata: {
          system: "EMLRIS - Ethiopian Mining Licensing Registry & Information System",
          authority: "Federal Democratic Republic of Ethiopia Ministry of Mines (MoM)",
          exportDate: new Date().toISOString(),
          recordCount: applications.length,
          legalNotice: "Statutory cadastre records under Proclamation No. 678/2010"
        },
        records: applications
      }, null, 2);
    } else if (activeFormat.extension === '.HTML' || activeFormat.extension === '.PDF') {
      filename = activeFormat.extension === '.PDF' 
        ? `FDRE_MoM_Official_Dossier_${today}.pdf` 
        : `FDRE_MoM_Executive_Report_${today}.html`;

      // Log export record into system history
      if (onExportGenerated) {
        onExportGenerated({
          id: `EXP-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          format: activeFormat.name,
          extension: activeFormat.extension,
          filename: filename,
          user: currentUser?.name || 'Authorized Cadastre Officer',
          userRole: currentUser?.role || 'Federal MoM Authority',
          recordCount: applications.length,
          context: title,
          fileSize: activeFormat.extension === '.PDF' ? '1.4 MB' : '420 KB',
          status: 'Completed'
        });
      }

      // Open printable executive report / download HTML
      handlePrintPreview(activeFormat.name);
      setDownloadSuccess(`Generated ${activeFormat.name} print view and dispatched record.`);
      setTimeout(() => setDownloadSuccess(null), 5000);
      return;
    }

    // Trigger file download via link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log export record into system history
    if (onExportGenerated) {
      onExportGenerated({
        id: `EXP-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        format: activeFormat.name,
        extension: activeFormat.extension,
        filename: filename,
        user: currentUser?.name || 'Authorized Cadastre Officer',
        userRole: currentUser?.role || 'Federal MoM Authority',
        recordCount: applications.length,
        context: title,
        fileSize: `${Math.max(12, Math.round((content.length / 1024) * 10) / 10)} KB`,
        status: 'Completed'
      });
    }

    setDownloadSuccess(`Successfully downloaded "${filename}" (${activeFormat.extension})`);
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  // Generate and print styled official document
  const handlePrintPreview = (docTitle: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle} - FDRE Ministry of Mines</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11px; }
          .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 15px; margin-bottom: 20px; }
          .emblem { font-size: 24px; font-weight: 900; color: #065f46; letter-spacing: 1px; }
          .subhead { font-size: 13px; font-weight: 700; color: #475569; margin-top: 4px; }
          .title { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 10px; }
          .meta-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th { background: #065f46; color: white; text-align: left; padding: 7px 8px; font-weight: bold; text-transform: uppercase; }
          td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
          .badge-active { background: #d1fae5; color: #065f46; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
          .sig-box { width: 220px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="emblem">FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</div>
          <div class="subhead">MINISTRY OF MINES (MoM) • MINERAL INDUSTRY DEVELOPMENT INSTITUTE (MIDI)</div>
          <div class="title">${docTitle}</div>
        </div>

        <div class="meta-bar">
          <span>Official Dispatch Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
          <span>Statutory Authority: Proclamation No. 678/2010</span>
          <span>Active Registry Records: ${applications.length} Concessions</span>
          <span>Security Classification: OFFICIAL GOVERNMENT REGISTRY</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>License ID</th>
              <th>Applicant / Operator</th>
              <th>TIN</th>
              <th>Mineral Commodity</th>
              <th>Concession Category</th>
              <th>Regional State</th>
              <th>Authority Level</th>
              <th>Coordinates</th>
              <th>Status</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${applications.map(a => `
              <tr>
                <td style="font-weight: bold; font-family: monospace;">${a.id}</td>
                <td><strong>${a.applicant}</strong></td>
                <td style="font-family: monospace;">${a.tin}</td>
                <td>${a.mineral}</td>
                <td>${a.type}</td>
                <td>${a.region}</td>
                <td>${a.level}</td>
                <td style="font-family: monospace;">${a.coordinates}</td>
                <td><span class="badge badge-active">${a.status}</span></td>
                <td style="font-family: monospace;">${a.expiryDate || '2027-12-31'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <strong>Cadastre Directorate Officer</strong><br/>
            Verified & Certified
          </div>
          <div class="sig-box">
            <strong>MIDI Technical Lead</strong><br/>
            Geological Data Inspection
          </div>
          <div class="sig-box">
            <strong>Ministry of Mines Executive</strong><br/>
            Authorized Regulatory Endorsement
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div 
      id="modal-export-formats"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className={`rounded-2xl shadow-2xl max-w-3xl w-full border overflow-hidden flex flex-col max-h-[92vh] ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="p-5 border-b flex items-start justify-between gap-4 border-slate-200 dark:border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-white shadow-xs">
              <Download size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">{title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  {formats.length} Formats Available
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check size={16} className="shrink-0" />
            <span className="font-semibold">{downloadSuccess}</span>
          </div>
        )}

        {/* Modal Body: Two Column Format Selector & Detailed Inspector */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Format Selection Cards Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Output Document / Data Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formats.map((fmt) => {
                const IconComponent = fmt.icon;
                const isSelected = fmt.id === selectedFormatId;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormatId(fmt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-800/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                        : darkMode
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      <IconComponent size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate">{fmt.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${fmt.badgeColor}`}>
                          {fmt.extension}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {fmt.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-mono">{fmt.category}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Format Technical Specification Card */}
          {activeFormat && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Format Specification:</span>
                  <span className="font-bold text-xs text-emerald-400">{activeFormat.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${activeFormat.badgeColor}`}>
                  {activeFormat.extension} Standard
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">Encoding / MIME</div>
                  <div className="font-mono font-bold text-[11px] mt-0.5 truncate">{activeFormat.mimeType}</div>
                </div>
                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">Statutory Standard</div>
                  <div className="font-semibold text-[11px] mt-0.5 truncate">{activeFormat.standard}</div>
                </div>
                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">Data Records Count</div>
                  <div className="font-mono font-bold text-[11px] mt-0.5 text-emerald-400">{applications.length} Records</div>
                </div>
                <div className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">File Compatibility</div>
                  <div className="font-semibold text-[11px] mt-0.5">Excel / GIS / PDF</div>
                </div>
              </div>

              {/* Sample Data Columns Preview */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Exported Data Attributes & Columns ({activeFormat.extension === '.JSON' ? 'JSON Key Paths' : 'Table Headers'}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'License ID (UUID/Code)', 'Applicant / Company Name', 'TIN Tax ID', 
                    'Mineral Commodity', 'Concession Level (Federal/Regional)', 'Polygon Coordinates', 
                    'Filing Timestamp', 'Statutory Expiry Date', 'ESIA Environmental Clearance', 
                    'Rehabilitation Escrow Status'
                  ].map((col, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-500" />
            <span>Authorized by FDRE Ministry of Mines Central Cadastre Authority</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close
            </button>

            {activeFormat.extension === '.PDF' ? (
              <button
                id="btn-confirm-print-format"
                onClick={handleDownloadSelected}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Official PDF Document</span>
              </button>
            ) : (
              <button
                id="btn-confirm-download-format"
                onClick={handleDownloadSelected}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Download {activeFormat.extension} File</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useReducer, useMemo, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Shield, Map as MapIcon, FileText, Activity, Clock, Search, Menu, Bell, LogOut, 
  ChevronRight, ChevronLeft, LayoutDashboard, FolderOpen, Truck, ArrowRightLeft, Download, Upload, 
  AlertTriangle, Eye, EyeOff, Plus, History, Lock, MapPin, Database, Sliders, FileSpreadsheet, 
  Globe, Check, Award, X, Sun, Moon, Sparkles, ArrowLeft,
  CheckSquare, Square, CheckCheck, RefreshCw, Radar, Compass
} from 'lucide-react';
import {
  RoleType, DemoUser, LicenseType, Application, TransportPermit, AuditLog, AppState, AppAction, AppContextType, TradeClearance, ExportRecord
} from './types.ts';
import { CadastreMap, ETHIOPIA_REGIONAL_CENTROIDS, calculateHaversineDistanceKm, parseAppCoordinates } from './components/CadastreMap.tsx';
import { TradeView } from './components/TradeView.tsx';
import { ReportsAnalyticsView } from './components/ReportsAnalyticsView.tsx';
import { RenewalTimeView } from './components/RenewalTimeView.tsx';
import { RoleSwitchAuthModal } from './components/RoleSwitchAuthModal.tsx';
import { ExportFormatModal, ExportContextType } from './components/ExportFormatModal.tsx';

const ROLES: Record<string, RoleType> = {
  SUPER_ADMIN: 'Super Admin',
  MOM_OFFICER: 'MoM Officer (Federal)',
  MIDI_OFFICER: 'MIDI Technical Officer',
  REGIONAL_OFFICER: 'Regional Authority Officer',
  AUDITOR: 'External Auditor'
};

const ETHIOPIAN_REGIONS: string[] = [
  'Federal', 'Oromia', 'Amhara', 'SNNPR', 'Tigray', 'Afar', 
  'Benishangul-Gumuz', 'Somali', 'Gambella', 'Harari', 'Sidama', 'South Ethiopia'
];

const DEMO_USERS: DemoUser[] = [
  // Federal / Governmental Portal Users
  { id: 'u1', name: 'Abebe Bikila (Super Admin)', email: 'admin@emlris.gov.et', role: ROLES.SUPER_ADMIN, region: 'Federal', idMask: '0100******88', password: '12345678', portalType: 'governmental' },
  { id: 'u2', name: 'Dr. Alemayehu T. (MoM Director)', email: 'mom.officer@emlris.gov.et', role: ROLES.MOM_OFFICER, region: 'Federal', idMask: '0200******12', password: '12345678', portalType: 'governmental' },
  { id: 'u3', name: 'Eng. Sara M. (MIDI Lead)', email: 'midi.officer@emlris.gov.et', role: ROLES.MIDI_OFFICER, region: 'Federal', idMask: '0300******45', password: '12345678', portalType: 'governmental' },
  { id: 'u6', name: 'Audit Commission Lead', email: 'auditor@emlris.gov.et', role: ROLES.AUDITOR, region: 'Federal', idMask: '0600******33', password: '12345678', portalType: 'governmental' },
  // Regional Bureau Portal Users
  { id: 'u4', name: 'Dawit K. (Oromia Bureau)', email: 'regional.oromia@emlris.gov.et', role: ROLES.REGIONAL_OFFICER, region: 'Oromia', idMask: '0400******99', password: '12345678', portalType: 'regional' },
  { id: 'u5', name: 'Tewodros G. (Amhara Bureau)', email: 'regional.amhara@emlris.gov.et', role: ROLES.REGIONAL_OFFICER, region: 'Amhara', idMask: '0500******77', password: '12345678', portalType: 'regional' },
  { id: 'u7', name: 'Almaz H. (Tigray Bureau)', email: 'regional.tigray@emlris.gov.et', role: ROLES.REGIONAL_OFFICER, region: 'Tigray', idMask: '0700******65', password: '12345678', portalType: 'regional' },
  { id: 'u8', name: 'Mohamed I. (Afar Bureau)', email: 'regional.afar@emlris.gov.et', role: ROLES.REGIONAL_OFFICER, region: 'Afar', idMask: '0800******44', password: '12345678', portalType: 'regional' },
  { id: 'u9', name: 'Girma B. (Benishangul Bureau)', email: 'regional.benishangul@emlris.gov.et', role: ROLES.REGIONAL_OFFICER, region: 'Benishangul-Gumuz', idMask: '0900******22', password: '12345678', portalType: 'regional' },
];

const INITIAL_LICENSE_TYPES: LicenseType[] = [
  { id: 'recon', name: 'Reconnaissance License', category: 'Upstream', defaultLevel: 'Regional', duration: '18 Months', renewable: 'No', 
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'financialProof'],
    documents: ['National ID / Passport', 'Business Registration', 'TIN Certificate', 'Technical Proposal', 'Proof of Financial Capacity'] },
  { id: 'exp', name: 'Exploration License', category: 'Upstream', defaultLevel: 'Regional', duration: '3 Years (Extendable)', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'budget', 'workProgram'],
    documents: ['National ID / Passport', 'Business Registration', 'TIN Certificate', 'Detailed Exploration Work Program', 'Budget Plan', 'Geologist CVs', 'Preliminary Environmental Plan'] },
  { id: 'ret', name: 'Retention License', category: 'Upstream', defaultLevel: 'Regional', duration: '1 Year (Renewable)', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'delayReason'],
    documents: ['National ID / Passport', 'Proven Deposit Evidence', 'Economic Delay Explanation', 'Bankable Delay Assessment'] },
  { id: 'art', name: 'Artisanal Mining License', category: 'Upstream', defaultLevel: 'Regional', duration: '2 Years', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'coopName'],
    documents: ['Kebele ID / Passport', 'Micro-Enterprise / Cooperative Certificate', 'Mining Area Boundary Sketch', 'Regional Kebele Authorization'] },
  { id: 'ssm_special', name: 'Special Small-Scale Mining', category: 'Upstream', defaultLevel: 'Regional', duration: '5 Years', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'machineryCap'],
    documents: ['National ID', 'Previous Artisanal Mining Record', 'Machinery List & Valuation', 'Technical Mining Plan', 'Initial Environmental Study'] },
  { id: 'ssm', name: 'Small-Scale Mining License', category: 'Upstream', defaultLevel: 'Regional', duration: '10 Years', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'capex', 'mineDesign'],
    documents: ['Company Registration', 'TIN Certificate', 'Feasibility Study', 'Environmental Impact Assessment (EIA)', 'Equipment List', 'Work Plan'] },
  { id: 'lsm', name: 'Large-Scale Mining License', category: 'Upstream', defaultLevel: 'Federal', duration: '20 Years', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'coordinates', 'capex', 'oreReserves', 'cdaTerms'],
    documents: ['Bankable Feasibility Study (BFS)', 'Ore Reserve Estimates', 'Environmental & Social Impact Assessment (ESIA)', 'Mine Closure Plan', 'Community Development Agreement (CDA)', 'Investment Permit (EIC)'] },
  { id: 'trade', name: 'Certificate of Competence for Mineral Trading', category: 'Midstream', defaultLevel: 'Regional', duration: '1 Year', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'officeLocation', 'securityDeposit'],
    documents: ['Commercial Registration', 'Physical Storage Inspection Certificate', 'Bank Guarantee / Security Deposit', 'Criminal Record Clearance'] },
  { id: 'trans', name: 'Mineral Transport Permit / Waybill', category: 'Midstream', defaultLevel: 'Regional', duration: 'Single Trip / 30 Days', renewable: 'No',
    fields: ['applicant', 'tin', 'region', 'mineral', 'origin', 'destination', 'quantityTons', 'vehiclePlate', 'driverName', 'driverID'],
    documents: ['Mineral Purchase Receipt', 'Valid Mining License Copy', 'Vehicle Registration', 'Driver ID Copy', 'Regional Royalty Payment Receipt'] },
  { id: 'exp_cert', name: 'Commercial Mineral Exporter License', category: 'Downstream', defaultLevel: 'Federal', duration: '1 Year', renewable: 'Yes',
    fields: ['applicant', 'tin', 'region', 'mineral', 'destCountry', 'assayGrade', 'nbeAccount'],
    documents: ['Certificate of Competence', 'National Bank of Ethiopia (NBE) Registration', 'Assay & Origin Certificate', 'Export Royalty Clearance', 'Customs Document'] },
  { id: 'imp_cert', name: 'Duty-Free Import Certificate (Mining Equipment)', category: 'Downstream', defaultLevel: 'Federal', duration: '1 Year', renewable: 'No',
    fields: ['applicant', 'tin', 'region', 'activeLicenseNo', 'equipmentCategory', 'boqValueUSD'],
    documents: ['Active Mining/Exploration License', 'Approved Equipment Bill of Quantities (BOQ)', 'Proof of Local Unavailability', 'MoM Technical Recommendation'] }
];

const STATUSES = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted - Regional',
  MOM_REVIEW: 'Under MoM Federal Review',
  MIDI_REVIEW: 'Under MIDI Technical Review',
  APPROVED: 'Active / Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  RETURNED: 'Returned for Revisions'
};

const INITIAL_APPLICATIONS: Application[] = [
  { 
    id: 'EMLRIS-2026-00101', 
    applicant: 'EthioGold Mining Share Co.', 
    tin: '0048291047',
    type: 'Large-Scale Mining License', 
    typeId: 'lsm',
    region: 'Oromia', 
    mineral: 'Gold & Copper', 
    status: STATUSES.APPROVED, 
    date: '2024-02-14', 
    issueDate: '2024-02-14',
    expiryDate: '2044-02-14',
    duration: '20 Years',
    renewable: 'Yes',
    renewalStatus: 'Good Standing',
    concessionAreaKm2: 145.8,
    escrowBondStatus: 'Verified & Funded',
    coordinates: '8.5414, 39.2689',
    level: 'Federal',
    capex: '$45,000,000',
    assignedTo: 'MoM Technical Directorate'
  },
  { 
    id: 'EMLRIS-2026-00102', 
    applicant: 'Blue Nile Gemstones Union', 
    tin: '0012948172',
    type: 'Artisanal Mining License', 
    typeId: 'art',
    region: 'Amhara', 
    mineral: 'Opal & Sapphire', 
    status: STATUSES.SUBMITTED, 
    date: '2024-04-10', 
    issueDate: '2024-04-10',
    expiryDate: '2026-04-10',
    duration: '2 Years',
    renewable: 'Yes',
    renewalStatus: 'Critical / Expiring Soon',
    concessionAreaKm2: 2.5,
    escrowBondStatus: 'Verified & Funded',
    coordinates: '11.5942, 37.3872',
    level: 'Regional',
    capex: '500,000 ETB',
    assignedTo: 'Amhara Regional Mining Bureau'
  },
  { 
    id: 'EMLRIS-2026-00103', 
    applicant: 'Horn Mineral Explorations PLC', 
    tin: '0098310482',
    type: 'Exploration License', 
    typeId: 'exp',
    region: 'Tigray', 
    mineral: 'Tantalum & Lithium', 
    status: STATUSES.MIDI_REVIEW, 
    date: '2023-05-18', 
    issueDate: '2023-05-18',
    expiryDate: '2026-05-18',
    duration: '3 Years',
    renewable: 'Yes',
    renewalStatus: 'Renewal Window Open',
    concessionAreaKm2: 88.2,
    escrowBondStatus: 'Verified & Funded',
    relinquishmentCompliant: true,
    coordinates: '14.0322, 38.9831',
    level: 'Regional',
    capex: '$3,200,000',
    assignedTo: 'MIDI Geochemistry Dept'
  },
  { 
    id: 'EMLRIS-2026-00104', 
    applicant: 'Danakil Salt Industries', 
    tin: '0077210948',
    type: 'Small-Scale Mining License', 
    typeId: 'ssm',
    region: 'Afar', 
    mineral: 'Potash & Industrial Salt', 
    status: STATUSES.MOM_REVIEW, 
    date: '2021-08-01', 
    issueDate: '2021-08-01',
    expiryDate: '2031-08-01',
    duration: '10 Years',
    renewable: 'Yes',
    renewalStatus: 'Good Standing',
    concessionAreaKm2: 18.5,
    escrowBondStatus: 'Verified & Funded',
    coordinates: '14.2100, 40.3000',
    level: 'Regional',
    capex: '18,500,000 ETB',
    assignedTo: 'MoM Regulatory Division'
  },
  { 
    id: 'EMLRIS-2026-00105', 
    applicant: 'Abyssinia Mineral Traders', 
    tin: '0033918274',
    type: 'Commercial Mineral Exporter License', 
    typeId: 'exp_cert',
    region: 'Federal', 
    mineral: 'Processed Gemstones', 
    status: STATUSES.APPROVED, 
    date: '2025-03-28', 
    issueDate: '2025-03-28',
    expiryDate: '2026-03-28',
    duration: '1 Year',
    renewable: 'Yes',
    renewalStatus: 'Critical / Expiring Soon',
    escrowBondStatus: 'Verified & Funded',
    coordinates: '9.0300, 38.7400',
    level: 'Federal',
    capex: '12,000,000 ETB',
    assignedTo: 'Federal Mineral Marketing Board'
  },
  { 
    id: 'EMLRIS-2026-00106', 
    applicant: 'Danakil Potash Consortium PLC', 
    tin: '0055194821',
    type: 'Retention License', 
    typeId: 'ret',
    region: 'Afar', 
    mineral: 'Potash & Magnesium', 
    status: STATUSES.EXPIRED, 
    date: '2025-01-15', 
    issueDate: '2025-01-15',
    expiryDate: '2026-01-15',
    duration: '1 Year',
    renewable: 'Yes',
    renewalStatus: 'Expired (Grace Period)',
    concessionAreaKm2: 42.0,
    escrowBondStatus: 'Under Review',
    coordinates: '14.1500, 40.2100',
    level: 'Regional',
    capex: '$8,500,000',
    assignedTo: 'Afar Regional Mining Bureau'
  },
  { 
    id: 'EMLRIS-2026-00107', 
    applicant: 'Wollega Tantalum Cooperative', 
    tin: '0068194012',
    type: 'Special Small-Scale Mining', 
    typeId: 'ssm_special',
    region: 'Oromia', 
    mineral: 'Tantalite & Niobium', 
    status: STATUSES.APPROVED, 
    date: '2022-09-10', 
    issueDate: '2022-09-10',
    expiryDate: '2027-09-10',
    duration: '5 Years',
    renewable: 'Yes',
    renewalStatus: 'Good Standing',
    concessionAreaKm2: 12.6,
    escrowBondStatus: 'Verified & Funded',
    coordinates: '9.0800, 36.5500',
    level: 'Regional',
    capex: '6,400,000 ETB',
    assignedTo: 'Oromia Regional Mining Bureau'
  },
  { 
    id: 'EMLRIS-2026-00108', 
    applicant: 'Abay River Geological Ventures', 
    tin: '0089201948',
    type: 'Reconnaissance License', 
    typeId: 'recon',
    region: 'Benishangul-Gumuz', 
    mineral: 'Base Metals & Gold', 
    status: STATUSES.APPROVED, 
    date: '2024-11-01', 
    issueDate: '2024-11-01',
    expiryDate: '2026-05-01',
    duration: '18 Months',
    renewable: 'No',
    renewalStatus: 'Non-Renewable',
    concessionAreaKm2: 95.0,
    escrowBondStatus: 'Verified & Funded',
    coordinates: '10.0600, 34.5300',
    level: 'Regional',
    capex: '1,800,000 ETB',
    assignedTo: 'Benishangul Regional Mining Bureau'
  }
];

const INITIAL_TRANSPORT_PERMITS: TransportPermit[] = [
  { id: 'TP-2026-8801', applicant: 'EthioGold Mining Share Co.', mineral: 'Raw Gold Ore', quantity: '45.5 Tons', origin: 'Shakiso, Oromia', destination: 'Addis Ababa NBE Vault', vehiclePlate: 'ET-3-48192', driver: 'Mulugeta Tadesse', date: '2026-03-08', status: 'Active' },
  { id: 'TP-2026-8802', applicant: 'Danakil Salt Industries', mineral: 'Industrial Salt', quantity: '120.0 Tons', origin: 'Semera, Afar', destination: 'Djibouti Transit Hub', vehiclePlate: 'ET-3-99120', driver: 'Ibrahim Ahmed', date: '2026-03-07', status: 'Active' }
];

const INITIAL_EXPORT_HISTORY: ExportRecord[] = [
  {
    id: 'EXP-902148',
    timestamp: '2026-03-12 14:35:20',
    format: 'Official Executive Mining Digest (Print-Ready PDF)',
    extension: '.PDF',
    filename: 'FDRE_MoM_Official_Dossier_2026-03-12.pdf',
    user: 'Dr. Alemayehu T. (MoM Director)',
    userRole: 'MoM Officer (Federal)',
    recordCount: 8,
    context: 'Cabinet Ministerial Briefing',
    fileSize: '1.4 MB',
    status: 'Completed'
  },
  {
    id: 'EXP-884912',
    timestamp: '2026-03-11 09:20:15',
    format: 'Complete Mining Cadastre Registry Sheet',
    extension: '.CSV',
    filename: 'FDRE_Mining_Cadastre_Ledger_2026-03-11.csv',
    user: 'Abebe Bikila (Super Admin)',
    userRole: 'Super Admin',
    recordCount: 8,
    context: 'Applications Registry Export',
    fileSize: '64.2 KB',
    status: 'Completed'
  },
  {
    id: 'EXP-772390',
    timestamp: '2026-03-10 16:45:00',
    format: 'GIS Spatial Concession & Boundary Coordinates',
    extension: '.TSV',
    filename: 'FDRE_Cadastre_GIS_Spatial_Ledger_2026-03-10.tsv',
    user: 'Eng. Sara M. (MIDI Lead)',
    userRole: 'MIDI Technical Officer',
    recordCount: 8,
    context: 'National Spatial Cadastre Sync',
    fileSize: '48.1 KB',
    status: 'Completed'
  },
  {
    id: 'EXP-651204',
    timestamp: '2026-03-08 11:10:42',
    format: 'Royalty Distribution & Regional Share Ledger',
    extension: '.CSV',
    filename: 'FDRE_MoM_Royalty_Distribution_Split_2026-03-08.csv',
    user: 'Dawit K. (Oromia Bureau)',
    userRole: 'Regional Authority Officer',
    recordCount: 8,
    context: 'Reports & Fiscal Audit',
    fileSize: '24.8 KB',
    status: 'Completed'
  }
];

const CHART_COLORS = ['#047857', '#d97706', '#2563eb', '#7c3aed', '#db2777', '#0284c7', '#475569'];

const AppContext = createContext<AppContextType | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { 
        ...state, 
        currentUser: action.payload, 
        currentView: 'dashboard', 
        auditLogs: [
          { id: Date.now(), user: action.payload.name, role: action.payload.role, action: `Logged into EMLRIS Portal (${action.payload.region})`, time: new Date().toISOString(), ip: '197.156.70.12' }, 
          ...state.auditLogs
        ] 
      };
    case 'LOGOUT':
      return { ...state, currentUser: null, currentView: 'public', history: [] };
    case 'NAVIGATE': {
      const history = state.history || [];
      const newHistory = action.payload !== state.currentView ? [...history, state.currentView] : history;
      return { 
        ...state, 
        currentView: action.payload, 
        selectedEntityId: action.entityId || null,
        history: newHistory
      };
    }
    case 'GO_BACK': {
      const history = state.history || [];
      if (history.length > 0) {
        const prev = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        return {
          ...state,
          currentView: prev,
          selectedEntityId: null,
          history: newHistory
        };
      }
      if (state.currentView !== 'dashboard' && state.currentUser) {
        return { ...state, currentView: 'dashboard', selectedEntityId: null };
      }
      if (!state.currentUser && state.currentView !== 'public') {
        return { ...state, currentView: 'public', selectedEntityId: null };
      }
      return state;
    }
    case 'ADD_APPLICATION': {
      const newId = `EMLRIS-2026-00${state.applications.length + 106}`;
      const newApp: Application = { 
        id: newId, 
        status: STATUSES.SUBMITTED, 
        date: new Date().toISOString().split('T')[0],
        assignedTo: action.payload.level === 'Federal' ? 'MoM Federal Registry' : `${action.payload.region} Regional Mining Bureau`,
        applicant: action.payload.applicant,
        tin: action.payload.tin,
        type: action.payload.type,
        typeId: action.payload.typeId,
        region: action.payload.region,
        mineral: action.payload.mineral,
        coordinates: action.payload.coordinates || '9.0300, 38.7400',
        level: action.payload.level,
        capex: action.payload.capex,
        budget: action.payload.budget,
        delayReason: action.payload.delayReason,
        machineryCap: action.payload.machineryCap,
        officeLocation: action.payload.officeLocation,
        vehiclePlate: action.payload.vehiclePlate,
        driverName: action.payload.driverName,
        driverID: action.payload.driverID,
        origin: action.payload.origin,
        destination: action.payload.destination,
        quantityTons: action.payload.quantityTons,
        destCountry: action.payload.destCountry,
        assayGrade: action.payload.assayGrade
      };
      return { 
        ...state, 
        applications: [newApp, ...state.applications],
        lastRegisteredId: newId,
        currentView: 'dashboard',
        auditLogs: [
          { id: Date.now(), user: state.currentUser?.name || 'Authorized Officer', role: state.currentUser?.role || 'Officer', action: `Registered New Application ${newId} (${newApp.type})`, time: new Date().toISOString(), ip: '197.156.70.12' },
          ...state.auditLogs
        ]
      };
    }
    case 'UPDATE_STATUS': {
      const updatedApps = state.applications.map(app => 
        app.id === action.payload.id ? { ...app, status: action.payload.newStatus, lastRemark: action.payload.remark || '' } : app
      );
      return {
        ...state,
        applications: updatedApps,
        auditLogs: [
          { id: Date.now(), user: state.currentUser?.name || 'Authorized Officer', role: state.currentUser?.role || 'Officer', action: `Updated Status for ${action.payload.id} -> ${action.payload.newStatus}`, time: new Date().toISOString(), ip: '197.156.70.12' },
          ...state.auditLogs
        ]
      };
    }
    case 'UPDATE_AUTHORITY_CONFIG': {
      const updatedTypes = state.licenseTypes.map(t => 
        t.id === action.payload.typeId ? { ...t, defaultLevel: action.payload.newLevel } : t
      );
      return {
        ...state,
        licenseTypes: updatedTypes,
        auditLogs: [
          { id: Date.now(), user: state.currentUser?.name || 'Administrator', role: state.currentUser?.role || 'Admin', action: `Re-configured Regulatory Authority Level for ${action.payload.typeId} to ${action.payload.newLevel}`, time: new Date().toISOString(), ip: '197.156.70.12' },
          ...state.auditLogs
        ]
      };
    }
    case 'ADD_AUDIT':
      return { ...state, auditLogs: [action.payload, ...state.auditLogs] };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'CLEAR_LAST_REGISTERED':
      return { ...state, lastRegisteredId: null };
    case 'ADD_TRADE_CLEARANCE': {
      return {
        ...state,
        tradeClearances: [action.payload as any, ...(state.tradeClearances || [])],
        auditLogs: [
          { id: Date.now(), user: state.currentUser?.name || 'Officer', role: state.currentUser?.role || 'Officer', action: `Registered Trade Clearance for ${action.payload.companyName}`, time: new Date().toISOString(), ip: '197.156.70.12' },
          ...state.auditLogs
        ]
      };
    }
    case 'ADD_TRANSPORT_PERMIT': {
      const newTP: TransportPermit = {
        id: `TP-2026-${Math.floor(8000 + Math.random() * 1000)}`,
        ...action.payload,
        date: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      return {
        ...state,
        transportPermits: [newTP, ...state.transportPermits],
        currentView: 'renewals',
        auditLogs: [
          { id: Date.now(), user: state.currentUser?.name || 'Officer', role: state.currentUser?.role || 'Officer', action: `Issued Mineral Transport Permit ${newTP.id}`, time: new Date().toISOString(), ip: '197.156.70.12' },
          ...state.auditLogs
        ]
      };
    }
    case 'RENEW_LICENSE': {
      const updatedApps = state.applications.map(app => {
        if (app.id === action.payload.id) {
          return {
            ...app,
            expiryDate: action.payload.newExpiryDate,
            status: STATUSES.APPROVED,
            renewalStatus: 'Good Standing' as const,
            renewalCount: (app.renewalCount || 0) + 1,
            lastRenewalDate: new Date().toISOString().split('T')[0],
            lastRemark: action.payload.remark || app.lastRemark
          };
        }
        return app;
      });
      return {
        ...state,
        applications: updatedApps,
        auditLogs: [
          {
            id: Date.now(),
            user: state.currentUser?.name || 'Authorized Officer',
            role: state.currentUser?.role || 'Officer',
            action: `Statutory License Renewal Endorsed for ${action.payload.id} (+${action.payload.extensionYears} Yrs -> ${action.payload.newExpiryDate})`,
            time: new Date().toISOString(),
            ip: '197.156.70.12'
          },
          ...state.auditLogs
        ]
      };
    }
    case 'SET_LOGIN_PORTAL_PREF': {
      return {
        ...state,
        loginPortalPreference: action.payload
      };
    }
    case 'BULK_UPDATE_STATUS': {
      const { ids, newStatus, remark } = action.payload;
      const updatedApps = state.applications.map(app => 
        ids.includes(app.id) ? { ...app, status: newStatus, lastRemark: remark || app.lastRemark } : app
      );
      return {
        ...state,
        applications: updatedApps,
        auditLogs: [
          {
            id: Date.now(),
            user: state.currentUser?.name || 'Authorized Officer',
            role: state.currentUser?.role || 'Officer',
            action: `Bulk Status Update for ${ids.length} applications -> ${newStatus}${remark ? ` (Remark: ${remark})` : ''}`,
            time: new Date().toISOString(),
            ip: '197.156.70.12'
          },
          ...state.auditLogs
        ]
      };
    }
    case 'LOG_EXPORT': {
      return {
        ...state,
        exportHistory: [action.payload, ...(state.exportHistory || [])],
        auditLogs: [
          {
            id: Date.now(),
            user: action.payload.user,
            role: action.payload.userRole,
            action: `Dispatched Export: ${action.payload.filename} (${action.payload.extension}) [${action.payload.recordCount} Records]`,
            time: new Date().toISOString(),
            ip: '197.156.70.12'
          },
          ...state.auditLogs
        ]
      };
    }
    default:
      return state;
  }
};

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    currentUser: null,
    currentView: 'public',
    selectedEntityId: null,
    applications: INITIAL_APPLICATIONS,
    licenseTypes: INITIAL_LICENSE_TYPES,
    transportPermits: INITIAL_TRANSPORT_PERMITS,
    darkMode: false,
    lastRegisteredId: null,
    tradeClearances: [],
    exportHistory: INITIAL_EXPORT_HISTORY,
    auditLogs: [
      { id: 1, user: 'System Kernel', role: 'System', action: 'EMLRIS Production Database Initialized (FDRE MoM & MIDI)', time: '2026-03-01T08:00:00.000Z', ip: '127.0.0.1' },
      { id: 2, user: 'Dawit K. (Oromia)', role: ROLES.REGIONAL_OFFICER, action: 'Registered Exploration Site Coordinates for EthioGold', time: '2026-03-02T10:15:30.000Z', ip: '197.156.70.12' }
    ]
  });

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f1f5f9';
    }
  }, [state.darkMode]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

interface ButtonProps {
  id?: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ id, children, variant = 'primary', onClick, className = '', type = 'button', disabled = false }) => {
  const { state } = useAppContext();
  const darkMode = state?.darkMode;
  const baseStyle = "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  const variants = {
    primary: "bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700",
    secondary: darkMode 
      ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" 
      : "bg-slate-800 hover:bg-slate-900 text-white border border-slate-700",
    outline: darkMode 
      ? "border border-slate-700 text-slate-100 hover:bg-slate-800 bg-slate-900" 
      : "border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white",
    ghost: darkMode 
      ? "text-slate-200 hover:bg-slate-800 hover:text-white shadow-none" 
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-none",
    gold: "bg-amber-600 hover:bg-amber-700 text-white border border-amber-500",
    danger: "bg-red-700 hover:bg-red-800 text-white"
  };
  return (
    <button id={id} type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

interface CardProps {
  id?: string;
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  subtitle?: string;
}

const Card: React.FC<CardProps> = ({ id, children, className = '', title, action, subtitle }) => {
  const { state } = useAppContext();
  const darkMode = state?.darkMode;
  return (
    <div id={id} className={`rounded-xl shadow-xs border overflow-hidden transition-colors ${
      darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    } ${className}`}>
      {(title || action) && (
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div>
            {title && <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>}
            {subtitle && <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

const Badge: React.FC<{ children: ReactNode; status?: string; className?: string }> = ({ children, status, className = '' }) => {
  let colorClass = "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
  if (status?.includes('Approved') || status?.includes('Active')) colorClass = "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700";
  else if (status?.includes('Review') || status?.includes('Submitted')) colorClass = "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
  else if (status?.includes('Rejected') || status?.includes('Expired')) colorClass = "bg-red-50 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700";
  else if (status?.includes('Federal')) colorClass = "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700";
  else if (status?.includes('Regional')) colorClass = "bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700";

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap leading-tight shrink-0 ${colorClass} ${className}`}>
      {children}
    </span>
  );
};

interface InputProps {
  id?: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'select' | 'textarea';
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string } | string>;
  readOnly?: boolean;
  hint?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({ id, label, type = 'text', name, value, onChange, required, placeholder, options, readOnly, hint, className = '' }) => {
  const { state } = useAppContext();
  const darkMode = state?.darkMode;
  const baseClass = `w-full rounded-lg border px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all disabled:opacity-50 ${
    darkMode 
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 disabled:bg-slate-900' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 disabled:bg-slate-100'
  } ${className}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
          darkMode ? 'text-slate-200' : 'text-slate-700'
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {type === 'select' ? (
        <select id={id} name={name} value={value} onChange={onChange} required={required} disabled={readOnly} className={baseClass}>
          <option value="" className={darkMode ? 'bg-slate-900 text-white' : ''}>Select an option...</option>
          {options?.map((opt, i) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return <option key={`${val}-${i}`} value={val} className={darkMode ? 'bg-slate-900 text-white' : ''}>{lbl}</option>;
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea id={id} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} readOnly={readOnly} rows={3} className={baseClass} />
      ) : (
        <input id={id} type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} readOnly={readOnly} className={baseClass} />
      )}
      {hint && <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{hint}</p>}
    </div>
  );
};

const Disclaimer: React.FC = () => {
  const { state } = useAppContext();
  const darkMode = state?.darkMode;
  return (
    <div id="legal-disclaimer-box" className={`border-l-4 border-amber-500 p-4 rounded-r-lg text-xs shadow-sm max-w-5xl mx-auto my-6 text-left ${
      darkMode ? 'bg-amber-950/40 text-amber-200 border-amber-500' : 'bg-amber-50 text-amber-900 border-amber-600'
    }`}>
      <div className="flex items-start">
        <AlertTriangle size={18} className="mr-2 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold tracking-wide uppercase mb-1">OFFICIAL ETHIOPIAN LEGAL & REGULATORY DISCLAIMER</p>
          <p className="leading-relaxed opacity-95">
            This platform is designed for secure information management, monitoring, coordination, and regulatory workflow support between Regional Mining Authorities, the Ministry of Mines (MoM), and the Mineral Industry Development Institute (MIDI). Final licensing, legal approvals, enforcement, and official decisions remain under the strict authority of relevant Ethiopian government institutions and applicable national laws.
          </p>
        </div>
      </div>
    </div>
  );
};

const PublicLanding: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;

  const handleOpenGovPortal = () => {
    dispatch({ type: 'SET_LOGIN_PORTAL_PREF', payload: 'governmental' });
    dispatch({ type: 'NAVIGATE', payload: 'login' });
  };

  const handleOpenRegionalPortal = () => {
    dispatch({ type: 'SET_LOGIN_PORTAL_PREF', payload: 'regional' });
    dispatch({ type: 'NAVIGATE', payload: 'login' });
  };

  return (
    <div id="emlris-public-landing" className={`min-h-screen flex flex-col font-sans transition-colors ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <header id="public-header" className="bg-emerald-950 text-white border-b border-emerald-900 py-4 px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg z-10">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-amber-600 rounded-lg text-white shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              EMLRIS <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded border border-emerald-700">FDRE</span>
            </h1>
            <p className="text-xs text-emerald-200 tracking-wide font-medium">Ethiopian Mining Licensing & Regulatory Information System</p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <button 
            id="btn-login-regional-nav" 
            onClick={handleOpenRegionalPortal}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-700/60 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MapPin size={14} className="text-purple-300" />
            <span>Regional Bureau Portal</span>
          </button>
          <Button id="btn-login-nav" variant="gold" onClick={handleOpenGovPortal}>
            Federal Gov Portal <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center items-center text-center px-4 py-12 md:py-16 relative overflow-hidden">
        <div className="z-10 max-w-5xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border ${
            darkMode ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}>
            <Award size={14} className="text-emerald-400" /> Authorized National Mining Information Management System
          </div>
          
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Single Data Entry at Regional Level. <br/>
            <span className={darkMode ? 'text-emerald-400' : 'text-emerald-800'}>Unified Federal Visibility for MoM & MIDI.</span>
          </h2>
          
          <p className={`mt-6 text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Connecting regional mining authorities across Oromia, Amhara, Tigray, Afar, and all FDRE regional states directly with the Ministry of Mines and Mineral Industry Development Institute for synchronized regulatory oversight.
          </p>
          
          {/* Dual Dedicated Portal Access Entry Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
            {/* Governmental Portal Card */}
            <div className={`p-6 rounded-2xl border transition-all ${
              darkMode 
                ? 'bg-slate-900/90 border-emerald-900/60 hover:border-emerald-500' 
                : 'bg-white border-emerald-200 shadow-md hover:border-emerald-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-800 text-white shadow-xs">
                  <Shield size={22} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  Federal Mandate
                </span>
              </div>
              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Federal Governmental Portal
              </h3>
              <p className={`text-xs mt-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Ministry of Mines (MoM), MIDI Technical Directorate, Super Admin & Federal Audit Commission. Full statutory authority to approve licenses, issue formal decisions, and manage national cadastre.
              </p>
              <button
                id="btn-cta-gov-portal"
                onClick={handleOpenGovPortal}
                className="mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Enter Governmental Portal</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Regional Portal Card */}
            <div className={`p-6 rounded-2xl border transition-all ${
              darkMode 
                ? 'bg-slate-900/90 border-purple-900/60 hover:border-purple-500' 
                : 'bg-white border-purple-200 shadow-md hover:border-purple-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-800 text-white shadow-xs">
                  <MapPin size={22} />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/30">
                  State Bureau Mandate
                </span>
              </div>
              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Regional State Bureau Portal
              </h3>
              <p className={`text-xs mt-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Oromia, Amhara, Tigray, Afar, Benishangul-Gumuz & Regional State Mining Bureaus. Local field verification, applicant intake, and forwarding dossiers to MIDI and MoM Review.
              </p>
              <button
                id="btn-cta-regional-portal"
                onClick={handleOpenRegionalPortal}
                className="mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-800 hover:bg-purple-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Enter Regional Bureau Portal</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <Disclaimer />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card id="feature-card-registry" className={`border shadow-sm hover:shadow-md transition-shadow ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-emerald-100 bg-white text-slate-900'
            }`}>
              <Database className="text-emerald-400 mb-3" size={32} />
              <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Centralized Registry</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Single repository for upstream exploration, midstream transport permits, and downstream mineral export certificates.</p>
            </Card>
            <Card id="feature-card-rbac" className={`border shadow-sm hover:shadow-md transition-shadow ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-emerald-100 bg-white text-slate-900'
            }`}>
              <Shield className="text-emerald-400 mb-3" size={32} />
              <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Role-Based Access Control</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Masked TIN & National ID numbers ensure sensitive applicant data is accessible only to verified officials.</p>
            </Card>
            <Card id="feature-card-midi" className={`border shadow-sm hover:shadow-md transition-shadow ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-emerald-100 bg-white text-slate-900'
            }`}>
              <Activity className="text-emerald-400 mb-3" size={32} />
              <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>MIDI Technical Monitoring</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Direct pipeline for technical evaluation of feasibility studies, EIA compliance, and ore reserves.</p>
            </Card>
          </div>
        </div>
      </main>
      
      <footer id="public-footer" className="bg-slate-950 text-slate-400 py-6 text-center text-xs border-t border-slate-800">
        <p>&copy; 2026 Ministry of Mines (MoM) & Mineral Industry Development Institute (MIDI), FDRE. All rights reserved.</p>
      </footer>
    </div>
  );
};

const Login: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;

  // Portal login separation state: governmental vs regional
  const [activePortal, setActivePortal] = useState<'governmental' | 'regional'>(
    state?.loginPortalPreference || 'governmental'
  );

  // Filter users based on active portal
  const availableUsers = useMemo(() => {
    return DEMO_USERS.filter(u => u.portalType === activePortal);
  }, [activePortal]);

  const [selectedUser, setSelectedUser] = useState<string>(
    availableUsers[0]?.id || DEMO_USERS[0].id
  );

  // When active portal changes, update selected user default
  useEffect(() => {
    if (!availableUsers.some(u => u.id === selectedUser)) {
      if (availableUsers.length > 0) {
        setSelectedUser(availableUsers[0].id);
      }
    }
  }, [activePortal, availableUsers, selectedUser]);

  const [enteredPassword, setEnteredPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const currentUser = DEMO_USERS.find(u => u.id === selectedUser);

  // Keep password input blank whenever user or portal changes so the user must type it
  useEffect(() => {
    setEnteredPassword('');
    setAuthError(null);
  }, [selectedUser, activePortal]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = currentUser || availableUsers[0] || DEMO_USERS[0];
    const REQUIRED_PASSWORD = '12345678';

    if (!enteredPassword.trim()) {
      setAuthError(`Security Clearance Verification Failed: Password cannot be blank. Access denied.`);
      return;
    }

    if (enteredPassword.trim() !== REQUIRED_PASSWORD) {
      setAuthError(`Security Clearance Verification Failed: Incorrect password entered for ${user.name}. Access denied.`);
      return;
    }

    dispatch({ type: 'LOGIN', payload: user });
  };

  return (
    <div id="login-screen" className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-900'
    }`}>
      <div className={`max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-700 text-slate-900'
      }`}>
        {/* Header with Top Left Back navigation */}
        <div className={`p-6 text-center text-white border-b relative transition-colors ${
          activePortal === 'governmental' ? 'bg-emerald-950 border-emerald-900' : 'bg-purple-950 border-purple-900'
        }`}>
          <button
            id="btn-login-top-left-back"
            type="button"
            onClick={() => dispatch({ type: 'GO_BACK' })}
            title="Go Back to Home Portal"
            className="absolute top-4 left-4 p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/20 cursor-pointer shadow-xs group"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          </button>

          <div className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${
            activePortal === 'governmental' ? 'bg-amber-600' : 'bg-purple-600'
          }`}>
            {activePortal === 'governmental' ? <Shield size={32} /> : <MapPin size={32} />}
          </div>
          
          <h2 className="text-2xl font-black">
            {activePortal === 'governmental' ? 'Federal Governmental Portal' : 'Regional Mining Bureau Portal'}
          </h2>
          <p className="text-xs opacity-80 mt-1">
            {activePortal === 'governmental' 
              ? 'MoM Federal Executive & MIDI Technical Directorate' 
              : 'Oromia, Amhara, Tigray, Afar & Regional State Bureaus'}
          </p>
        </div>

        {/* Segmented Portal Selector Tabs */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              id="tab-login-governmental"
              type="button"
              onClick={() => setActivePortal('governmental')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePortal === 'governmental'
                  ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield size={14} />
              <span>Federal Government</span>
            </button>
            <button
              id="tab-login-regional"
              type="button"
              onClick={() => setActivePortal('regional')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePortal === 'regional'
                  ? 'bg-purple-800 text-white shadow-sm ring-1 ring-purple-600'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin size={14} />
              <span>Regional Bureau</span>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {/* Statutory Policy Callout */}
          <div className={`p-3 rounded-xl text-xs border ${
            activePortal === 'governmental'
              ? darkMode ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : darkMode ? 'bg-purple-950/70 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-900 border-purple-200'
          }`}>
            {activePortal === 'governmental' ? (
              <div>
                <strong>Federal Executive Mandate:</strong> Ministry of Mines and MIDI officers have full statutory authority to inspect technical dossiers, approve & issue active mining licenses, or issue formal rejections.
              </div>
            ) : (
              <div>
                <strong>Regional Bureau Statutory Mandate:</strong> Regional officers handle local applicant intake and site inspections. Per Proclamation No. 678/2010, regional officers forward dossiers to MIDI/MoM. Approval & rejection are federally reserved.
              </div>
            )}
          </div>

          <Input 
            id="login-role-selector"
            label={activePortal === 'governmental' ? 'Select Governmental Official' : 'Select Regional Bureau Official'} 
            type="select" 
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            options={availableUsers.map(u => ({ value: u.id, label: `${u.name} — ${u.region} (${u.role})` }))}
          />

          <div className={`p-3 rounded-xl text-xs space-y-1.5 border ${
            darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
             <div className="flex justify-between">
               <span className="text-slate-400">Jurisdiction Region:</span>
               <span className="font-bold text-slate-200">{currentUser?.region}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-400">Authorized Role:</span>
               <span className="font-semibold">{currentUser?.role}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-400">Portal Security Tier:</span>
               <span className="font-mono text-emerald-400">{currentUser?.portalType?.toUpperCase()}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-400">Masked National ID:</span>
               <span className="font-mono">{currentUser?.idMask}</span>
             </div>
          </div>
          
          <Input id="login-email-input" label="Institutional Email" type="email" value={currentUser?.email || ''} readOnly />
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Security Password
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                <Lock size={11} className="text-amber-500" />
                <span>Clearance Protected</span>
              </span>
            </div>
            <div className="relative">
              <input 
                id="login-password-input" 
                type={showPassword ? 'text' : 'password'} 
                value={enteredPassword} 
                onChange={(e) => {
                  setEnteredPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Enter security clearance password..."
                className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-mono font-bold border outline-hidden transition-all ${
                  authError
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5 text-rose-300'
                    : darkMode 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {authError && (
              <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center gap-1.5 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          <button 
            id="btn-submit-auth" 
            type="submit" 
            className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-md transition-colors cursor-pointer ${
              activePortal === 'governmental' ? 'bg-emerald-800 hover:bg-emerald-700' : 'bg-purple-800 hover:bg-purple-700'
            }`}
          >
            {activePortal === 'governmental' ? 'Authenticate & Enter Governmental Portal' : 'Authenticate & Enter Regional Portal'}
          </button>
          
          <div className="text-center pt-2">
            <button id="btn-back-to-public" type="button" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'public' })} className="text-xs text-slate-400 hover:text-emerald-400 underline cursor-pointer">
              Return to Public Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface HorizontalNavItemProps {
  id?: string;
  icon: React.ElementType;
  label: string;
  view: string;
  currentView: string;
  onClick: (view: string) => void;
  badge?: string;
}

const HorizontalNavItem: React.FC<HorizontalNavItemProps> = ({ id, icon: Icon, label, view, currentView, onClick, badge }) => {
  const active = currentView === view;
  return (
    <button 
      id={id}
      onClick={() => onClick(view)}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
        active 
          ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-500/50' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={16} className={active ? 'text-amber-400' : 'text-slate-400'} />
      <span>{label}</span>
      {badge && <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">{badge}</span>}
    </button>
  );
};

const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, dispatch } = useAppContext();
  const { currentUser, currentView, applications, transportPermits } = state;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRoleAuthOpen, setIsRoleAuthOpen] = useState(false);
  const [targetUserForAuth, setTargetUserForAuth] = useState<DemoUser | null>(null);

  if (!currentUser) return null;

  const handleNav = (view: string) => {
    dispatch({ type: 'NAVIGATE', payload: view });
    setMobileMenuOpen(false);
  };
  const handleLogout = () => dispatch({ type: 'LOGOUT' });

  // Calculate expiring / critical renewals count for badge
  const expiringCount = applications.filter(a => 
    a.renewalStatus === 'Critical / Expiring Soon' || 
    a.renewalStatus === 'Renewal Window Open' || 
    a.renewalStatus === 'Expired (Grace Period)'
  ).length;

  // Define full ordered sequence of horizontal pages based on permissions
  const ALL_PAGES = [
    { id: 'dashboard', label: 'Executive Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications Registry', shortLabel: 'Applications', icon: FolderOpen, badge: `${applications.length}` },
    { id: 'map', label: 'Cadastre GIS Map', shortLabel: 'GIS Map', icon: MapIcon },
    { id: 'renewals', label: 'Renewal Time', shortLabel: 'Renewal Time', icon: Clock, badge: expiringCount > 0 ? `${expiringCount}` : undefined },
    { id: 'trade', label: 'Import / Export', shortLabel: 'Trade', icon: Globe },
    { id: 'reports', label: 'Reports & Analytics', shortLabel: 'Reports', icon: FileSpreadsheet },
    ...(currentUser.role === ROLES.SUPER_ADMIN || currentUser.role === ROLES.AUDITOR ? [
      { id: 'audit', label: 'Audit Logs', shortLabel: 'Audit Logs', icon: History }
    ] : [])
  ];

  // Map sub-views to their parent horizontal page for breadcrumbs and navigation index
  const activeMainView = ['new-application', 'application-detail'].includes(currentView) 
    ? 'applications' 
    : currentView;

  const currentIdx = ALL_PAGES.findIndex(p => p.id === activeMainView);
  const prevPage = currentIdx > 0 ? ALL_PAGES[currentIdx - 1] : null;
  const nextPage = currentIdx >= 0 && currentIdx < ALL_PAGES.length - 1 ? ALL_PAGES[currentIdx + 1] : null;

  const activePageObj = ALL_PAGES.find(p => p.id === activeMainView) || ALL_PAGES[0];

  return (
    <div id="dashboard-layout" className={`min-h-screen flex flex-col font-sans transition-colors ${
      state.darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* 1. Top Institutional Masthead (Horizontal Header) */}
      <header id="main-horizontal-header" className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Top-Left Back Navigation Symbol & FDRE Emblem */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Top-Left Back Symbol */}
            <button
              id="btn-top-left-back"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              title="Go Back to Previous Screen"
              className="p-2 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 hover:text-white border border-emerald-700/80 transition-all flex items-center justify-center cursor-pointer shadow-xs group"
              aria-label="Go Back"
            >
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            </button>

            <button 
              id="btn-toggle-mobile-nav" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-emerald-900 rounded-lg"
              title="Toggle Menu"
            >
              <Menu size={22} />
            </button>
            <div 
              onClick={() => handleNav('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 bg-amber-600 group-hover:bg-amber-500 text-white rounded-lg flex items-center justify-center shadow transition-colors">
                <Shield size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black tracking-wider text-base text-white">EMLRIS</h1>
                  <span className="text-[10px] bg-emerald-800 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-emerald-700 uppercase tracking-wider">FDRE</span>
                </div>
                <p className="text-[10px] text-emerald-300 font-medium tracking-wide">
                  {currentUser.region === 'Federal' ? 'Federal MoM Executive' : `${currentUser.region} Regional Bureau`}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Global Search & Live Sync Indicator */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
            <div className="flex items-center bg-emerald-900/60 rounded-lg px-3 py-1.5 w-full border border-emerald-800/80 focus-within:border-amber-400 focus-within:bg-emerald-900 transition-colors">
              <Search size={15} className="text-emerald-300 mr-2 shrink-0" />
              <input 
                id="global-horizontal-search" 
                type="text" 
                placeholder="Search TIN, Cadastre Polygon, Permit ID..." 
                className="bg-transparent border-none outline-none w-full text-xs text-white placeholder-emerald-400/70" 
              />
            </div>
          </div>

          {/* Right: User Badge, Demo Role Quick Switcher, Dark Mode & Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real-time System Status Pill */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-900/80 border border-emerald-800 text-[11px] font-medium text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Central MoM Sync</span>
            </div>

            {/* Dark Theme Toggle Small Icon */}
            <button 
              id="btn-toggle-dark-mode"
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              title={state.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 hover:text-amber-200 transition-colors border border-emerald-800 flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Toggle Dark Mode"
            >
              {state.darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Role Switcher Quick Pill with Password Auth Protection */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-800 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-emerald-300 text-[10px] uppercase font-bold flex items-center gap-1">
                <Lock size={10} className="text-amber-400" />
                Role:
              </span>
              <button
                id="header-role-switcher"
                type="button"
                onClick={() => {
                  setTargetUserForAuth(null);
                  setIsRoleAuthOpen(true);
                }}
                className="text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Click to authenticate with password to switch official role"
              >
                <span className="truncate max-w-[150px]">{currentUser.name.split('(')[0]}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-800 text-amber-300 border border-emerald-700 font-semibold hover:bg-emerald-700">
                  Switch
                </span>
              </button>
            </div>

            {/* User Avatar Chip */}
            <div className="flex items-center gap-2 pl-1 border-l border-emerald-900/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-emerald-700 shadow-inner">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white truncate max-w-[100px] leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-300 truncate max-w-[100px]">{currentUser.role.split(' ')[0]}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              id="btn-horizontal-logout" 
              onClick={handleLogout} 
              title="Secure Logout"
              className="p-1.5 bg-emerald-900/60 hover:bg-red-950 text-red-300 hover:text-white rounded-lg transition-colors border border-emerald-800"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Primary Horizontal Page Tabs Navigation Bar */}
      <nav id="horizontal-pages-bar" className="bg-slate-950 border-b border-slate-800 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto py-2 no-scrollbar">
          
          {/* Horizontal Page Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {ALL_PAGES.map((page) => (
              <HorizontalNavItem 
                key={page.id}
                id={`nav-tab-${page.id}`}
                icon={page.icon}
                label={page.label}
                view={page.id}
                currentView={activeMainView}
                onClick={handleNav}
                badge={page.badge}
              />
            ))}
          </div>

          {/* Horizontal Quick Pager (Previous / Next Page Horizontal Stepper) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg shrink-0">
            <button
              id="btn-horizontal-prev-page"
              onClick={() => prevPage && handleNav(prevPage.id)}
              disabled={!prevPage}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                prevPage 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={prevPage ? `Go to ${prevPage.label}` : 'First page'}
            >
              <ChevronLeft size={14} />
              <span className="hidden lg:inline">Prev</span>
            </button>

            <span className="text-[11px] font-mono px-2 py-0.5 text-slate-400 bg-slate-950 rounded border border-slate-800">
              {currentIdx + 1}/{ALL_PAGES.length}
            </span>

            <button
              id="btn-horizontal-next-page"
              onClick={() => nextPage && handleNav(nextPage.id)}
              disabled={!nextPage}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                nextPage 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={nextPage ? `Go to ${nextPage.label}` : 'Last page'}
            >
              <span className="hidden lg:inline">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. Horizontal Sub-Header / Breadcrumbs & Quick Action Bar */}
      <div id="horizontal-sub-bar" className={`border-b px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs transition-colors ${
        state.darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          
          {/* Horizontal Breadcrumb Flow */}
          <div className="flex items-center gap-2 font-medium overflow-x-auto">
            <button
              id="btn-subbar-back"
              onClick={() => dispatch({ type: 'GO_BACK' })}
              title="Go Back to Previous Screen"
              className="p-1 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">FDRE Cadastre</span>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <span className="shrink-0">{currentUser.region} Bureau</span>
            <ChevronRight size={12} className="text-slate-400 shrink-0" />
            <span className={`px-2 py-0.5 rounded border shrink-0 font-bold ${
              state.darkMode 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              {currentView === 'new-application' 
                ? 'Dynamic Registration Wizard' 
                : currentView === 'application-detail' 
                  ? `Application Review (${state.selectedEntityId || 'Detail'})` 
                  : activePageObj.label}
            </span>
          </div>

          {/* Quick Horizontal Page Jump & Direct Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {currentView !== 'new-application' && (
              <button 
                id="btn-horizontal-quick-register"
                onClick={() => handleNav('new-application')}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Register License</span>
              </button>
            )}
            {currentView !== 'renewals' && (
              <button 
                id="btn-horizontal-quick-renewals"
                onClick={() => handleNav('renewals')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  state.darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Clock size={13} />
                <span>Renewal Time</span>
                {expiringCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </button>
            )}
            <button 
              id="btn-horizontal-quick-map"
              onClick={() => handleNav('map')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                state.darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <MapIcon size={13} />
              <span>GIS Cadastre</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Fallback when screen is narrow) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-slate-950 text-white flex flex-col shadow-2xl z-50 border-r border-slate-800 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-amber-500" />
                <span className="font-bold text-sm">EMLRIS Pages</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {ALL_PAGES.map(page => {
                const Icon = page.icon;
                const active = activeMainView === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => handleNav(page.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      active ? 'bg-emerald-800 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={active ? 'text-amber-400' : 'text-slate-400'} />
                      <span>{page.label}</span>
                    </div>
                    {page.badge && <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-[10px]">{page.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Horizontal Content Canvas */}
      <main id="main-dashboard-body" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Role Switch Security Verification Modal */}
      <RoleSwitchAuthModal
        isOpen={isRoleAuthOpen}
        onClose={() => setIsRoleAuthOpen(false)}
        currentUser={currentUser}
        targetUser={targetUserForAuth}
        availableUsers={DEMO_USERS}
        onConfirmSwitch={(newUser) => {
          dispatch({ type: 'LOGIN', payload: newUser });
        }}
        darkMode={state.darkMode}
      />
    </div>
  );
};

const DashboardOverview: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { applications, lastRegisteredId, darkMode } = state;
  const [isDigestExportOpen, setIsDigestExportOpen] = useState(false);

  const lastRegisteredApp = lastRegisteredId ? applications.find(a => a.id === lastRegisteredId) : null;

  // Dynamically compute regional counts from live applications
  const baseCounts: Record<string, number> = {
    'Oromia': 38,
    'Amhara': 26,
    'SNNPR': 22,
    'Tigray': 17,
    'Afar': 15,
    'Benishangul': 13,
    'Somali': 8,
    'Sidama': 7
  };

  applications.forEach(app => {
    const regKey = app.region === 'Benishangul-Gumuz' ? 'Benishangul' : app.region;
    if (baseCounts[regKey] !== undefined) {
      baseCounts[regKey] += 1;
    } else {
      baseCounts[regKey] = 1;
    }
  });

  const dataByRegion = Object.keys(baseCounts).map(name => ({ name, count: baseCounts[name] }));

  // Dynamically compute license category distribution
  const typeDistribution = [
    { name: 'Artisanal', value: 380 + applications.filter(a => a.type.toLowerCase().includes('artisanal')).length },
    { name: 'Exploration', value: 290 + applications.filter(a => a.type.toLowerCase().includes('exploration')).length },
    { name: 'Small-Scale', value: 180 + applications.filter(a => a.type.toLowerCase().includes('small-scale')).length },
    { name: 'Large-Scale / Federal', value: 45 + applications.filter(a => a.level === 'Federal').length }
  ];

  const totalRegisteredCount = 1240 + applications.length;
  const pendingReviewCount = applications.filter(a => a.status.includes('Review') || a.status.includes('Submitted')).length;
  const approvedCount = applications.filter(a => a.status.includes('Approved')).length;

  return (
    <div id="dashboard-overview-container" className="space-y-6">
      {/* Real-time Alert for Newly Registered Concessions */}
      {lastRegisteredApp && (
        <div id="new-registration-alert-banner" className={`border-2 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          darkMode ? 'bg-emerald-950/90 border-emerald-500 text-slate-100' : 'bg-emerald-50 border-emerald-500 text-emerald-950'
        }`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
              <Sparkles size={20} className="animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-700 text-amber-300 px-2 py-0.5 rounded shadow-xs">
                  New Concession Registered
                </span>
                <span className="text-xs font-mono font-bold">{lastRegisteredApp.id}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">&bull; {lastRegisteredApp.date}</span>
              </div>
              <p className="text-sm font-black mt-0.5">
                {lastRegisteredApp.applicant} &bull; {lastRegisteredApp.type}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                Region: <span className="font-bold">{lastRegisteredApp.region}</span> | Mineral: <span className="font-bold">{lastRegisteredApp.mineral}</span> | Geographic Centroid: <span className="font-mono font-bold bg-black/10 dark:bg-black/40 px-1.5 py-0.5 rounded">{lastRegisteredApp.coordinates}</span>
              </p>
              <p className="text-[11px] mt-1 font-medium text-emerald-700 dark:text-emerald-300">
                ✓ Live synchronized: Plotted directly onto the interactive Cadastre GIS Map and tallied in regional totals below.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button 
              id="btn-view-cadastre-from-alert"
              onClick={() => dispatch({ type: 'NAVIGATE', payload: 'map', entityId: lastRegisteredApp.id })}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <MapIcon size={14} />
              <span>Inspect on Cadastre Map</span>
            </button>
            <button 
              id="btn-dismiss-alert"
              onClick={() => dispatch({ type: 'CLEAR_LAST_REGISTERED' })}
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Dismiss Alert"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">FDRE Mining Executive Dashboard</h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time centralized tracking of regional & federal mining authorizations across all 12 regional administrations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button id="btn-print-digest" variant="outline" onClick={() => setIsDigestExportOpen(true)}>
            <Download size={14} className="mr-1.5"/> Printable Digest
          </Button>
          <Button id="btn-new-reg-quick" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'new-application' })}><Plus size={14} className="mr-1.5"/> New Regional Registration</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card id="metric-card-total" className="border-l-4 border-l-emerald-700">
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Active Licenses</p>
              <h3 className="text-3xl font-black mt-1">{totalRegisteredCount.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg"><FileText size={20}/></div>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-3">+{applications.length} newly added to registry</p>
        </Card>

        <Card id="metric-card-pending" className="border-l-4 border-l-amber-600">
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending MoM/MIDI Review</p>
              <h3 className="text-3xl font-black mt-1">{pendingReviewCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg"><Clock size={20}/></div>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-3">Action required by technical division</p>
        </Card>

        <Card id="metric-card-permits" className="border-l-4 border-l-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Transport Permits</p>
              <h3 className="text-3xl font-black mt-1">{140 + state.transportPermits.length}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-lg"><Truck size={20}/></div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mt-3">Waybill verification live</p>
        </Card>

        <Card id="metric-card-exporters" className="border-l-4 border-l-purple-600">
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Approved Concessions</p>
              <h3 className="text-3xl font-black mt-1">{approvedCount}</h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg"><Award size={20}/></div>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-400 font-semibold mt-3">Federal & Regional Certified</p>
        </Card>
      </div>

      {/* Registry Health & Statutory Status Distribution Widget */}
      {(() => {
        const totalApps = applications.length;
        const approvedApps = applications.filter(a => a.status === STATUSES.APPROVED).length;
        const pendingReviewApps = applications.filter(a => a.status === STATUSES.MOM_REVIEW || a.status === STATUSES.MIDI_REVIEW).length;
        const intakeApps = applications.filter(a => a.status === STATUSES.SUBMITTED || a.status === STATUSES.DRAFT).length;
        const holdOrExpiredApps = applications.filter(a => a.status === STATUSES.EXPIRED || a.status === STATUSES.REJECTED).length;

        const pctApproved = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;
        const pctPendingReview = totalApps > 0 ? Math.round((pendingReviewApps / totalApps) * 100) : 0;
        const pctIntake = totalApps > 0 ? Math.round((intakeApps / totalApps) * 100) : 0;
        const pctHold = Math.max(0, 100 - pctApproved - pctPendingReview - pctIntake);

        const healthDonutData = [
          { name: 'Approved', value: approvedApps, color: '#10b981', pct: pctApproved },
          { name: 'Pending Review', value: pendingReviewApps, color: '#f59e0b', pct: pctPendingReview },
          { name: 'Intake / Submitted', value: intakeApps, color: '#3b82f6', pct: pctIntake },
          { name: 'Hold / Expired', value: holdOrExpiredApps, color: '#ef4444', pct: pctHold }
        ];

        return (
          <Card 
            id="widget-registry-health"
            className={`border shadow-xs transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Activity size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">Registry Health & Status Distribution</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      SLA: 96.8% Optimal
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Percentage distribution of cadastre records by regulatory lifecycle phase across all jurisdictions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-health-view-registry"
                  onClick={() => dispatch({ type: 'NAVIGATE', payload: 'applications' })}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>Filter Registry</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 items-center">
              {/* Mini-Donut Chart */}
              <div className="md:col-span-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {healthDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{
                          borderRadius: '8px', 
                          border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                          color: darkMode ? '#f8fafc' : '#0f172a',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(val: number, name: string) => [
                          `${val} (${Math.round((val / totalApps) * 100)}%)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                      {pctApproved}%
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Approved
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-semibold">Approved: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{pctApproved}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="font-semibold">Pending Review: <strong className="font-mono text-amber-600 dark:text-amber-400">{pctPendingReview}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="font-semibold">Intake/Screening: <strong className="font-mono text-blue-600 dark:text-blue-400">{pctIntake}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <span className="font-semibold">Hold/Expired: <strong className="font-mono text-rose-600 dark:text-rose-400">{pctHold}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Progress Bars & Health Indicators */}
              <div className="md:col-span-5 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Check size={13} className="stroke-[3]" />
                      Approved & Endorsed Concessions
                    </span>
                    <span className="font-mono font-bold">{approvedApps} ({pctApproved}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${pctApproved}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <Clock size={13} />
                      Pending Technical Review (MoM / MIDI)
                    </span>
                    <span className="font-mono font-bold">{pendingReviewApps} ({pctPendingReview}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                      style={{ width: `${pctPendingReview}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                      <FileText size={13} />
                      Intake & Initial Screening
                    </span>
                    <span className="font-mono font-bold">{intakeApps} ({pctIntake}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${pctIntake}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                      <AlertTriangle size={13} />
                      Expired / Non-Compliance Holds
                    </span>
                    <span className="font-mono font-bold">{holdOrExpiredApps} ({pctHold}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-rose-500 transition-all duration-500" 
                      style={{ width: `${pctHold}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Assurance Badges */}
              <div className={`md:col-span-3 p-3.5 rounded-xl border text-xs space-y-2.5 ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cadastre Integrity:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">100% Verified</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avg Technical SLA:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">4.6 Days</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ESIA Bond Clearance:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">96.2% Funded</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Spatial Overlaps:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0 Collisions</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card id="chart-card-region" title="Regional Distribution of Registered Licenses" subtitle="Aggregated count across FDRE Mining Bureaus (Updated live)">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByRegion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11}} />
                <YAxis tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11}} />
                <RechartsTooltip contentStyle={{
                  borderRadius: '8px', 
                  border: darkMode ? '1px solid #334155' : 'none', 
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}/>
                <Bar dataKey="count" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card id="chart-card-types" title="License Types Breakdown" subtitle="Distribution between Upstream, Midstream and Downstream">
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                  {typeDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{
                  borderRadius: '8px', 
                  border: darkMode ? '1px solid #334155' : 'none', 
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}/>
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card id="recent-applications-card" title="Recent Application Submissions" subtitle="Live feed from Regional Mining Registries (Newest on top)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase border-b ${
              darkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <tr>
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Applicant Company</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Centroid Coordinates</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {applications.slice(0, 6).map((app) => (
                <tr key={app.id} className={`transition-colors ${
                  app.id === lastRegisteredId 
                    ? (darkMode ? 'bg-emerald-950/40 font-semibold' : 'bg-emerald-50/70 font-semibold')
                    : (darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50')
                }`}>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    {app.id}
                    {app.id === lastRegisteredId && (
                      <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] rounded font-sans uppercase">New</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-middle font-semibold">{app.applicant}</td>
                  <td className="px-4 py-3.5 align-middle opacity-90">{app.type}</td>
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-semibold text-xs">{app.region}</span>
                      <Badge status={app.level}>{app.level}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-middle font-mono text-[11px] opacity-80">{app.coordinates}</td>
                  <td className="px-4 py-3.5 align-middle"><Badge status={app.status}>{app.status}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      id={`btn-map-app-${app.id}`}
                      onClick={() => dispatch({ type: 'NAVIGATE', payload: 'map', entityId: app.id })}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-xs cursor-pointer"
                      title="Plot on Ethiopian Cadastre Map"
                    >
                      Map
                    </button>
                    <button 
                      id={`btn-inspect-${app.id}`}
                      onClick={() => dispatch({ type: 'NAVIGATE', payload: 'application-detail', entityId: app.id })}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Printable Digest Export Format Modal */}
      <ExportFormatModal
        isOpen={isDigestExportOpen}
        onClose={() => setIsDigestExportOpen(false)}
        context="executive-digest"
        applications={applications}
        darkMode={darkMode}
      />
    </div>
  );
};

const ApplicationList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;
  const { applications, currentUser } = state;
  const [isRegistryExportOpen, setIsRegistryExportOpen] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Geospatial Radius Filter state
  const loggedInRegion = currentUser?.region && currentUser.region !== 'Federal' ? currentUser.region : 'Oromia';
  const [referenceBureau, setReferenceBureau] = useState<string>(loggedInRegion);
  const [radiusKm, setRadiusKm] = useState<number>(0); // 0 = off / nationwide

  // Batch Selection & Bulk Actions state
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState<boolean>(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>(STATUSES.APPROVED);
  const [bulkRemark, setBulkRemark] = useState<string>('');
  const [isBulkExportOpen, setIsBulkExportOpen] = useState<boolean>(false);
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  // Active bureau coordinates for distance calculation
  const bureauCoords = ETHIOPIA_REGIONAL_CENTROIDS[referenceBureau] || ETHIOPIA_REGIONAL_CENTROIDS['Oromia'];

  const filteredAppsWithDistance = useMemo(() => {
    return applications.map(app => {
      const coords = parseAppCoordinates(app);
      const distance = calculateHaversineDistanceKm(
        bureauCoords.lat,
        bureauCoords.lng,
        coords.lat,
        coords.lng
      );
      return { app, distance, coords };
    });
  }, [applications, bureauCoords]);

  const filteredApps = useMemo(() => {
    return filteredAppsWithDistance.filter(({ app, distance }) => {
      const matchesRegion = filterRegion === 'All' || app.region === filterRegion;
      const matchesSearch = app.applicant.toLowerCase().includes(filterSearch.toLowerCase()) || 
                            app.id.toLowerCase().includes(filterSearch.toLowerCase()) ||
                            app.mineral.toLowerCase().includes(filterSearch.toLowerCase());
      
      let matchesCategory = true;
      if (filterCategory === 'upstream') {
        matchesCategory = app.type.toLowerCase().includes('exploration') || app.type.toLowerCase().includes('mining') || app.type.toLowerCase().includes('artisanal');
      } else if (filterCategory === 'midstream') {
        matchesCategory = app.type.toLowerCase().includes('retention') || app.type.toLowerCase().includes('transport') || app.type.toLowerCase().includes('small-scale');
      } else if (filterCategory === 'downstream') {
        matchesCategory = app.type.toLowerCase().includes('export') || app.type.toLowerCase().includes('clearance') || app.type.toLowerCase().includes('large-scale');
      }

      let matchesStatus = true;
      if (filterStatus === 'approved') matchesStatus = app.status === STATUSES.APPROVED;
      else if (filterStatus === 'review') matchesStatus = app.status === STATUSES.MOM_REVIEW || app.status === STATUSES.MIDI_REVIEW;
      else if (filterStatus === 'submitted') matchesStatus = app.status === STATUSES.SUBMITTED || app.status === STATUSES.DRAFT;

      const matchesRadius = radiusKm === 0 || distance <= radiusKm;

      return matchesRegion && matchesSearch && matchesCategory && matchesStatus && matchesRadius;
    });
  }, [filteredAppsWithDistance, filterRegion, filterSearch, filterCategory, filterStatus, radiusKm]);

  // Bulk selection helpers
  const visibleAppIds = filteredApps.map(f => f.app.id);
  const isAllVisibleSelected = visibleAppIds.length > 0 && visibleAppIds.every(id => selectedAppIds.includes(id));
  const isSomeVisibleSelected = visibleAppIds.some(id => selectedAppIds.includes(id)) && !isAllVisibleSelected;

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedAppIds(prev => prev.filter(id => !visibleAppIds.includes(id)));
    } else {
      setSelectedAppIds(prev => Array.from(new Set([...prev, ...visibleAppIds])));
    }
  };

  const handleToggleApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkStatusUpdate = () => {
    if (selectedAppIds.length === 0) return;
    dispatch({
      type: 'BULK_UPDATE_STATUS',
      payload: {
        ids: selectedAppIds,
        newStatus: bulkTargetStatus,
        remark: bulkRemark.trim() || `Official Bulk Endorsement by ${currentUser?.name || 'Authorized Officer'}`
      }
    });
    setBulkActionSuccess(`Successfully updated ${selectedAppIds.length} application(s) to "${bulkTargetStatus}"`);
    setTimeout(() => setBulkActionSuccess(null), 5000);
    setIsBulkStatusModalOpen(false);
    setSelectedAppIds([]);
    setBulkRemark('');
  };

  const selectedApplicationsList = useMemo(() => {
    return applications.filter(a => selectedAppIds.includes(a.id));
  }, [applications, selectedAppIds]);

  const categories = [
    { id: 'all', label: 'All Operations', count: applications.length },
    { id: 'upstream', label: 'Upstream Exploration & Mining', count: applications.filter(a => a.type.toLowerCase().includes('exploration') || a.type.toLowerCase().includes('mining') || a.type.toLowerCase().includes('artisanal')).length },
    { id: 'midstream', label: 'Midstream Processing & Logistics', count: applications.filter(a => a.type.toLowerCase().includes('retention') || a.type.toLowerCase().includes('transport') || a.type.toLowerCase().includes('small-scale')).length },
    { id: 'downstream', label: 'Downstream Export & Clearances', count: applications.filter(a => a.type.toLowerCase().includes('export') || a.type.toLowerCase().includes('clearance') || a.type.toLowerCase().includes('large-scale')).length },
  ];

  return (
    <div id="applications-registry-container" className="space-y-6 relative pb-20">
      {/* Horizontal Page Header Banner */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl border shadow-xs transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <button
            id="btn-registry-top-left-back"
            onClick={() => dispatch({ type: 'GO_BACK' })}
            title="Go Back"
            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
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
              <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mining Applications Registry</h2>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {filteredApps.length} of {applications.length} Records
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Centralized statutory database with geospatial radius filtering, batch actions, and export streams.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button id="btn-export-apps" variant="outline" onClick={() => setIsRegistryExportOpen(true)} className="text-xs py-2">
            <Download size={14} className="mr-1.5" /> Export Sheet
          </Button>
          <Button id="btn-register-new-app" onClick={() => dispatch({ type: 'NAVIGATE', payload: 'new-application' })}>
            <Plus size={16} className="mr-1.5" /> Register New Application
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {bulkActionSuccess && (
        <div id="bulk-success-toast" className="p-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCheck size={18} />
            <span>{bulkActionSuccess}</span>
          </div>
          <button onClick={() => setBulkActionSuccess(null)} className="p-1 hover:bg-white/20 rounded cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Horizontal Category Navigation Tabs */}
      <div id="horizontal-category-tabs" className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            id={`btn-cat-${cat.id}`}
            onClick={() => setFilterCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
              filterCategory === cat.id
                ? 'bg-emerald-800 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-600'
                : darkMode
                  ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              filterCategory === cat.id ? 'bg-amber-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      <Card id="registry-table-card" className="p-0">
        {/* Horizontal Filters Bar */}
        <div className={`p-4 border-b flex flex-col gap-3.5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-full sm:w-64">
                <Input 
                  id="filter-search-input"
                  type="text" 
                  placeholder="Search Applicant, ID, Mineral..." 
                  value={filterSearch} 
                  onChange={(e) => setFilterSearch(e.target.value)} 
                  className="mb-0 text-xs" 
                />
              </div>
              <div className="w-48">
                <Input 
                  id="filter-region-select"
                  type="select" 
                  value={filterRegion} 
                  onChange={(e) => setFilterRegion(e.target.value)}
                  options={['All', ...ETHIOPIAN_REGIONS]}
                  className="mb-0 text-xs" 
                />
              </div>
            </div>

            {/* Horizontal Status Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'approved', label: 'Approved' },
                { id: 'review', label: 'In Review' },
                { id: 'submitted', label: 'Submitted' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    filterStatus === st.id
                      ? 'bg-emerald-800 text-white'
                      : darkMode
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Geospatial Radius Filter Toolbar */}
          <div 
            id="geospatial-radius-filter-bar"
            className={`p-3 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
              radiusKm > 0 
                ? (darkMode ? 'bg-purple-950/40 border-purple-800/80 text-purple-200' : 'bg-purple-50/80 border-purple-200 text-purple-950')
                : (darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600')
            }`}
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                radiusKm > 0 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
              }`}>
                <Radar size={16} className={radiusKm > 0 ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">Geospatial Radius Filter</span>
                  {radiusKm > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      Active: Within {radiusKm} km
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-85">
                  Origin reference: <strong className="font-semibold">{referenceBureau} Regional Bureau</strong> ({bureauCoords.lat.toFixed(2)}°N, {bureauCoords.lng.toFixed(2)}°E)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
              {/* Bureau Origin Switcher */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium opacity-80">Bureau Origin:</span>
                <select
                  id="select-bureau-origin"
                  value={referenceBureau}
                  onChange={(e) => setReferenceBureau(e.target.value)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {ETHIOPIAN_REGIONS.map(reg => (
                    <option key={reg} value={reg}>{reg} {reg === 'Federal' ? 'MoM HQ' : 'Bureau'}</option>
                  ))}
                </select>
              </div>

              {/* Radius Quick Buttons */}
              <div className="flex items-center gap-1">
                {[
                  { label: 'Off', value: 0 },
                  { label: '50 km', value: 50 },
                  { label: '100 km', value: 100 },
                  { label: '200 km', value: 200 },
                  { label: '350 km', value: 350 },
                  { label: '500 km', value: 500 }
                ].map(r => (
                  <button
                    key={r.value}
                    id={`btn-radius-${r.value}`}
                    onClick={() => setRadiusKm(r.value)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      radiusKm === r.value
                        ? 'bg-purple-700 text-white shadow-xs'
                        : darkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {radiusKm > 0 && (
                <button
                  id="btn-reset-radius"
                  onClick={() => setRadiusKm(0)}
                  className="p-1 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded cursor-pointer"
                  title="Reset Radius Filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Applications Data Table with Checkboxes */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase border-b ${
              darkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    id="checkbox-select-all"
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    ref={el => { if (el) el.indeterminate = isSomeVisibleSelected; }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    title="Select All Filtered Applications"
                  />
                </th>
                <th className="px-3 py-3 min-w-[130px]">App Ref & Date</th>
                <th className="px-3 py-3 min-w-[170px]">Applicant Company / TIN</th>
                <th className="px-3 py-3 min-w-[150px]">License Type</th>
                <th className="px-3 py-3 min-w-[110px]">Target Mineral</th>
                <th className="px-3 py-3 min-w-[140px]">Regional State & Proximity</th>
                <th className="px-3 py-3 min-w-[120px]">Jurisdiction Level</th>
                <th className="px-3 py-3 min-w-[110px]">Status</th>
                <th className="px-3 py-3 min-w-[90px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-amber-500 opacity-80" />
                    <p className="font-bold text-sm">No mining applications match the specified criteria</p>
                    <p className="text-xs mt-1">Try relaxing the search query, region, or increasing the circular radius filter.</p>
                    {radiusKm > 0 && (
                      <button
                        onClick={() => setRadiusKm(0)}
                        className="mt-3 px-3 py-1.5 text-xs font-bold bg-purple-700 text-white rounded-lg cursor-pointer"
                      >
                        Clear {radiusKm} km Radius Limit
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredApps.map(({ app, distance }) => {
                  const isSelected = selectedAppIds.includes(app.id);
                  return (
                    <tr 
                      key={app.id} 
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? (darkMode ? 'bg-emerald-950/40 text-slate-100' : 'bg-emerald-50/80 text-slate-900')
                          : (darkMode ? 'hover:bg-slate-800/60 text-slate-200' : 'hover:bg-slate-50 text-slate-700')
                      }`}
                      onClick={(e) => handleToggleApp(app.id, e)}
                    >
                      <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          id={`checkbox-app-${app.id}`}
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleApp(app.id, e as any)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <div className={`font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>{app.id}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{app.date}</div>
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{app.applicant}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">TIN: {app.tin.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</div>
                      </td>
                      <td className={`px-3 py-3.5 align-middle font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{app.type}</td>
                      <td className={`px-3 py-3.5 align-middle font-semibold ${darkMode ? 'text-amber-400' : 'text-emerald-800'}`}>{app.mineral}</td>
                      <td className="px-3 py-3.5 align-middle whitespace-nowrap">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-purple-400 shrink-0" />
                            <span className={`font-semibold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {app.region}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            distance <= 100 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : (darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')
                          }`}>
                            {Math.round(distance)} km from {referenceBureau}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 align-middle whitespace-nowrap">
                        <Badge status={app.level}>{app.level} Authority</Badge>
                      </td>
                      <td className="px-3 py-3.5 align-middle whitespace-nowrap">
                        <Badge status={app.status}>{app.status}</Badge>
                      </td>
                      <td className="px-3 py-3.5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          id={`btn-review-${app.id}`}
                          variant="outline" 
                          className="px-2.5 py-1 text-xs"
                          onClick={() => dispatch({ type: 'NAVIGATE', payload: 'application-detail', entityId: app.id })}
                        >
                          <Eye size={12} className="mr-1"/> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Floating Bulk Action Menu for Officers */}
      {selectedAppIds.length > 0 && (
        <div 
          id="bulk-actions-floating-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black font-mono tracking-tight bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              {selectedAppIds.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-bulk-update-status"
              onClick={() => setIsBulkStatusModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCheck size={14} />
              <span>Bulk Update Status</span>
            </button>

            <button
              id="btn-bulk-export"
              onClick={() => setIsBulkExportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download size={14} />
              <span>Bulk Export</span>
            </button>

            <button
              id="btn-clear-selection"
              onClick={() => setSelectedAppIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
              title="Deselect all rows"
            >
              <X size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {isBulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`max-w-md w-full rounded-2xl border shadow-2xl p-6 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">Bulk Update Status</h3>
                  <p className="text-xs text-slate-400">Applying changes to {selectedAppIds.length} concessions</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkStatusModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Statutory Status
                </label>
                <select
                  id="select-bulk-target-status"
                  value={bulkTargetStatus}
                  onChange={(e) => setBulkTargetStatus(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                    darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value={STATUSES.APPROVED}>Approved & Statutory License Issued</option>
                  <option value={STATUSES.MOM_REVIEW}>In Ministry of Mines Federal Review</option>
                  <option value={STATUSES.MIDI_REVIEW}>In MIDI Technical Evaluation</option>
                  <option value={STATUSES.SUBMITTED}>Intake & Initial Regional Screening</option>
                  <option value={STATUSES.REJECTED}>Rejected / Regulatory Non-Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Official Endorsement Remark
                </label>
                <textarea
                  id="textarea-bulk-remark"
                  rows={3}
                  value={bulkRemark}
                  onChange={(e) => setBulkRemark(e.target.value)}
                  placeholder="Enter institutional docket note or statutory proclamation reference..."
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border text-[11px] ${
                darkMode ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <strong>Statutory Notice:</strong> This action will update all {selectedAppIds.length} selected dossiers simultaneously and record an entry into the immutable system audit trail.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-status-update"
                onClick={handleExecuteBulkStatusUpdate}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow"
              >
                Confirm Update ({selectedAppIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Registry Export Formats Modal */}
      <ExportFormatModal
        isOpen={isRegistryExportOpen}
        onClose={() => setIsRegistryExportOpen(false)}
        context="application-registry"
        applications={applications}
        darkMode={darkMode}
        currentUser={currentUser}
        onExportGenerated={(record) => dispatch({ type: 'LOG_EXPORT', payload: record })}
      />

      {/* Bulk Selection Export Modal */}
      <ExportFormatModal
        isOpen={isBulkExportOpen}
        onClose={() => setIsBulkExportOpen(false)}
        context="bulk-selection"
        applications={selectedApplicationsList}
        darkMode={darkMode}
        currentUser={currentUser}
        onExportGenerated={(record) => dispatch({ type: 'LOG_EXPORT', payload: record })}
      />
    </div>
  );
};

const NewApplication: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;
  const { licenseTypes, currentUser } = state;

  const [step, setStep] = useState<number>(1);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('exp');
  
  const selectedTypeObj = licenseTypes.find(t => t.id === selectedTypeId) || licenseTypes[0];

  const [formData, setFormData] = useState({
    applicant: '',
    tin: '',
    region: currentUser?.region !== 'Federal' ? (currentUser?.region || 'Oromia') : 'Oromia',
    mineral: 'Gold',
    coordinates: '8.5414, 39.2689',
    capex: '5,000,000 ETB',
    budget: '$500,000',
    delayReason: '',
    machineryCap: '',
    officeLocation: '',
    vehiclePlate: '',
    driverName: '',
    driverID: '',
    origin: '',
    destination: '',
    quantityTons: '',
    destCountry: '',
    assayGrade: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ 
      type: 'ADD_APPLICATION', 
      payload: {
        ...formData,
        type: selectedTypeObj.name,
        typeId: selectedTypeObj.id,
        level: selectedTypeObj.defaultLevel
      } 
    });
  };

  return (
    <div id="new-application-wizard" className="max-w-5xl mx-auto space-y-6">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-xl border shadow-xs transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center space-x-3">
          <button id="btn-back-to-apps" onClick={() => dispatch({type: 'NAVIGATE', payload: 'applications'})} className={`p-2 rounded-lg transition-colors border ${
            darkMode ? 'text-slate-300 hover:bg-slate-800 border-slate-700' : 'text-slate-500 hover:bg-slate-100 border-slate-200'
          }`}>
            <ArrowRightLeft size={18} className="rotate-180"/>
          </button>
          <div>
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Dynamic Registration Wizard</h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Step {step} of 3 — {step === 1 ? 'License Classification' : step === 2 ? 'Technical Geospatial Parameters' : 'Statutory Uploads'}</p>
          </div>
        </div>
        <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          Jurisdiction: <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{currentUser?.region} Bureau</span>
        </div>
      </div>

      {/* Horizontal Interactive Steps Ribbon */}
      <div id="wizard-horizontal-steps" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { stepNum: 1, title: 'Category & Identity', desc: 'Type, Applicant & TIN' },
          { stepNum: 2, title: 'Technical Parameters', desc: 'Coordinates & Dynamic Fields' },
          { stepNum: 3, title: 'Statutory Documents', desc: 'Compliance Dossier & Uploads' }
        ].map((s) => {
          const isActive = step === s.stepNum;
          const isDone = step > s.stepNum;
          return (
            <button
              key={s.stepNum}
              type="button"
              id={`btn-step-${s.stepNum}`}
              onClick={() => setStep(s.stepNum)}
              className={`text-left p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/50'
                  : isDone
                    ? darkMode
                      ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800 hover:bg-emerald-900/50'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
                    : darkMode
                      ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-amber-300' : isDone ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Step 0{s.stepNum}
                </span>
                {isDone && <Check size={14} className={darkMode ? 'text-emerald-400' : 'text-emerald-700'} />}
              </div>
              <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{s.title}</p>
              <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>{s.desc}</p>
            </button>
          );
        })}
      </div>

      <Card id="wizard-form-card">
        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
          
          {step === 1 && (
            <div className="space-y-4">
              <h3 className={`font-bold border-b pb-2 ${darkMode ? 'text-white border-slate-800' : 'text-slate-800 border-slate-200'}`}>
                Step 1: License Category & Basic Identity
              </h3>
              
              <Input 
                id="wizard-type-select"
                label="Select Regulatory License Type" 
                type="select" 
                value={selectedTypeId} 
                onChange={(e) => setSelectedTypeId(e.target.value)} 
                options={licenseTypes.map(t => ({ value: t.id, label: `${t.name} (${t.category} - ${t.defaultLevel})` }))}
                required
              />

              <div className={`p-3 border rounded-lg text-xs space-y-1 ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div><strong>Jurisdiction:</strong> <Badge status={selectedTypeObj.defaultLevel}>{selectedTypeObj.defaultLevel} Authority</Badge></div>
                <div><strong>Standard Duration:</strong> {selectedTypeObj.duration}</div>
                <div><strong>Renewable:</strong> {selectedTypeObj.renewable}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="wizard-applicant-input" label="Applicant / Company Name" name="applicant" value={formData.applicant} onChange={handleInputChange} required placeholder="e.g. Abyssinia Gold Ltd." />
                <Input id="wizard-tin-input" label="Tax Identification Number (TIN)" name="tin" value={formData.tin} onChange={handleInputChange} required placeholder="10-digit TIN" hint="Masked in public views" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="wizard-region-select" label="Regional State Jurisdiction" type="select" name="region" value={formData.region} onChange={handleInputChange} options={ETHIOPIAN_REGIONS} required />
                <Input id="wizard-mineral-input" label="Target Mineral / Commodity" name="mineral" value={formData.mineral} onChange={handleInputChange} required placeholder="e.g. Gold, Lithium, Tantalum, Opal" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className={`font-bold border-b pb-2 ${darkMode ? 'text-white border-slate-800' : 'text-slate-800 border-slate-200'}`}>
                Step 2: Dynamic Requirements for [{selectedTypeObj.name}]
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>The fields below are dynamically generated based on the regulatory requirements engine.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="wizard-coordinates-input" label="Mining Coordinates (Lat, Long)" name="coordinates" value={formData.coordinates} onChange={handleInputChange} required placeholder="e.g. 8.5414, 39.2689" />

                {selectedTypeObj.fields.includes('capex') && (
                  <Input id="wizard-capex-input" label="Estimated CAPEX / Investment" name="capex" value={formData.capex} onChange={handleInputChange} placeholder="e.g. $10,000,000" />
                )}

                {selectedTypeObj.fields.includes('budget') && (
                  <Input id="wizard-budget-input" label="Exploration Budget Plan" name="budget" value={formData.budget} onChange={handleInputChange} placeholder="e.g. $500,000" />
                )}

                {selectedTypeObj.fields.includes('vehiclePlate') && (
                  <>
                    <Input id="wizard-plate-input" label="Vehicle Registration Plate" name="vehiclePlate" value={formData.vehiclePlate} onChange={handleInputChange} placeholder="ET-3-12948" />
                    <Input id="wizard-driver-input" label="Driver Full Name & ID" name="driverName" value={formData.driverName} onChange={handleInputChange} placeholder="Alemayehu Tadesse" />
                  </>
                )}

                {selectedTypeObj.fields.includes('destCountry') && (
                  <Input id="wizard-dest-country-input" label="Destination Country for Export" name="destCountry" value={formData.destCountry} onChange={handleInputChange} placeholder="e.g. Switzerland, UAE" />
                )}
              </div>

              {selectedTypeObj.fields.includes('delayReason') && (
                <Input id="wizard-delay-input" label="Justification for Market Retention Delay" type="textarea" name="delayReason" value={formData.delayReason} onChange={handleInputChange} placeholder="Provide technical/economic rationale..." />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className={`font-bold border-b pb-2 ${darkMode ? 'text-white border-slate-800' : 'text-slate-800 border-slate-200'}`}>
                Step 3: Document Upload Repository
              </h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mandatory document checklist for legal compliance under FDRE Mining Proclamation.</p>

              <div className="space-y-2">
                {selectedTypeObj.documents.map((docName, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-3 border rounded-lg text-xs ${
                    darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-800'}/>
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{docName}</span>
                    </div>
                    <Button id={`btn-attach-doc-${idx}`} variant="outline" className="py-1 px-3 text-[11px]"><Upload size={12} className="mr-1"/> Attach PDF</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`mt-8 flex justify-between pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <Button id="btn-prev-step" variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>Previous Step</Button>
            {step < 3 ? (
              <Button id="btn-next-step" type="submit">Proceed to Technical Setup <ChevronRight size={14} className="ml-1"/></Button>
            ) : (
              <Button id="btn-submit-application" type="submit" variant="primary" className="bg-emerald-800">Submit Application to Database</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

const ApplicationDetail: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;
  const { applications, currentUser, selectedEntityId } = state;
  const [remark, setRemark] = useState('');

  const app = applications.find(a => a.id === selectedEntityId) || applications[0];

  const handleStatusUpdate = (newStatus: string) => {
    dispatch({ 
      type: 'UPDATE_STATUS', 
      payload: { id: app.id, newStatus, remark } 
    });
    setRemark('');
  };

  return (
    <div id="application-detail-view" className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <button id="btn-back-to-registry" onClick={() => dispatch({type: 'GO_BACK'})} className={`p-2 rounded-lg transition-colors cursor-pointer ${
            darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'
          }`} title="Go Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={`text-2xl font-black font-mono ${darkMode ? 'text-emerald-400' : 'text-slate-900'}`}>{app.id}</h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{app.applicant} • {app.type}</p>
          </div>
        </div>
        <Badge status={app.status}>{app.status}</Badge>
      </div>

      {/* Visual Workflow Timeline */}
      <Card id="workflow-timeline-card" className="bg-slate-900 text-white border-none">
        <div className="flex justify-between items-center relative px-4">
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-700 z-0"></div>
          {['Submitted', 'MIDI Review', 'MoM Review', 'Active License'].map((stepName, idx) => {
            const isCompleted = app.status === STATUSES.APPROVED || (idx === 0 && app.status !== STATUSES.DRAFT);
            return (
              <div key={stepName} className="z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isCompleted ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {isCompleted ? <Check size={14}/> : idx + 1}
                </div>
                <span className="text-[11px] mt-2 text-slate-300 font-semibold">{stepName}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card id="app-metadata-card" title="Application Metadata & Technical Parameters">
            <div className="grid grid-cols-2 gap-y-4 text-xs">
              <div><p className="text-slate-400 uppercase font-bold text-[10px]">Applicant Company</p><p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{app.applicant}</p></div>
              <div><p className="text-slate-400 uppercase font-bold text-[10px]">Masked TIN</p><p className={`font-mono font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.tin.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}</p></div>
              <div><p className="text-slate-400 uppercase font-bold text-[10px]">Regional State</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.region}</p></div>
              <div><p className="text-slate-400 uppercase font-bold text-[10px]">Target Mineral</p><p className={`font-semibold ${darkMode ? 'text-amber-400' : 'text-emerald-800'}`}>{app.mineral}</p></div>
              <div><p className="text-slate-400 uppercase font-bold text-[10px]">Coordinates</p><p className={`font-mono font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.coordinates}</p></div>
              <div><p className="text-slate-400 uppercase font-bold text-[10px]">Regulatory Level</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.level}</p></div>
              {app.capex && <div><p className="text-slate-400 uppercase font-bold text-[10px]">CAPEX</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.capex}</p></div>}
              {app.assignedTo && <div><p className="text-slate-400 uppercase font-bold text-[10px]">Current Directorate</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{app.assignedTo}</p></div>}
            </div>
          </Card>

          <Card id="submitted-docs-card" title="Submitted Technical Documents">
            <div className="space-y-2">
              {['Exploration_Work_Program_2026.pdf', 'Feasibility_Study_Report.pdf', 'ESIA_Approval_Certificate.pdf'].map((doc, idx) => (
                <div key={idx} className={`flex justify-between items-center p-3 border rounded-lg text-xs ${
                  darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-800'}/>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{doc}</span>
                  </div>
                  <Button id={`btn-preview-doc-${idx}`} variant="outline" className="py-1 px-2 text-[11px]"><Eye size={12} className="mr-1"/> Preview</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Action Panel for Official Decision */}
        <div>
          <Card id="decision-hub-card" title="Workflow Decision Hub" className={
            darkMode ? 'border border-slate-800 bg-slate-900/90' : 'border-2 border-emerald-100 bg-emerald-50/20'
          }>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Authorized Role: <strong className={darkMode ? 'text-white' : 'text-slate-800'}>{currentUser?.role}</strong>
            </p>

            <Input 
              id="reviewer-remark-textarea"
              label="Reviewer Remarks / Technical Feedback" 
              type="textarea" 
              value={remark} 
              onChange={(e) => setRemark(e.target.value)} 
              placeholder="Enter official comments..." 
            />

            <div className="space-y-2">
              {currentUser?.role !== ROLES.AUDITOR && (
                <>
                  {/* Both Regional and Federal can forward */}
                  <Button id="btn-forward-midi" onClick={() => handleStatusUpdate(STATUSES.MIDI_REVIEW)} variant="gold" className="w-full">
                    Forward to MIDI Technical Review
                  </Button>
                  <Button id="btn-forward-mom" onClick={() => handleStatusUpdate(STATUSES.MOM_REVIEW)} variant="secondary" className="w-full">
                    Forward to MoM Review
                  </Button>

                  {/* Federal / Governmental Portal ONLY: Approve and Reject */}
                  {currentUser?.portalType !== 'regional' ? (
                    <>
                      <Button id="btn-approve-license" onClick={() => handleStatusUpdate(STATUSES.APPROVED)} variant="primary" className="w-full">
                        Approve & Issue Active License
                      </Button>
                      <Button id="btn-reject-app" onClick={() => handleStatusUpdate(STATUSES.REJECTED)} variant="danger" className="w-full">
                        Reject Application
                      </Button>
                    </>
                  ) : (
                    <div id="regional-restriction-notice" className={`p-3 rounded-xl text-xs border mt-3 ${
                      darkMode ? 'bg-purple-950/60 text-purple-200 border-purple-800' : 'bg-purple-50 text-purple-900 border-purple-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Shield size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[11px] uppercase tracking-wide">Regional Portal Statutory Restriction</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                            Per FDRE Mining Proclamation regulations, Regional Mining Bureau officers are authorized to perform field surveys and forward verified dossiers to <strong>MIDI</strong> or <strong>MoM Review</strong>. Final statutory license approval and formal rejection are federally reserved.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TransportPermitView: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const darkMode = state?.darkMode;
  const { transportPermits } = state;

  const [showModal, setShowModal] = useState(false);
  const [newPermit, setNewPermit] = useState({
    applicant: '', mineral: 'Gold Ore', quantity: '', origin: '', destination: '', vehiclePlate: '', driver: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'ADD_TRANSPORT_PERMIT', payload: newPermit });
    setShowModal(false);
  };

  return (
    <div id="transport-permit-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mineral Transport Permits / Waybills</h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Regulatory authorization for legal movement of minerals across FDRE regional checkpoints.</p>
        </div>
        <Button id="btn-open-waybill-modal" onClick={() => setShowModal(true)}><Plus size={16} className="mr-1.5"/> Issue Transport Waybill</Button>
      </div>

      <Card id="transport-permits-card" className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[10px] uppercase border-b ${
              darkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <tr>
                <th className="px-4 py-3">Permit Waybill ID</th>
                <th className="px-4 py-3">Licensee Holder</th>
                <th className="px-4 py-3">Mineral & Volume</th>
                <th className="px-4 py-3">Origin &rarr; Destination</th>
                <th className="px-4 py-3">Vehicle Plate / Driver</th>
                <th className="px-4 py-3">Issued Date</th>
                <th className="px-4 py-3">Verification</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {transportPermits.map((tp) => (
                <tr key={tp.id} className={`transition-colors ${
                  darkMode ? 'hover:bg-slate-800/60 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                }`}>
                  <td className={`px-4 py-3 font-mono font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>{tp.id}</td>
                  <td className={`px-4 py-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{tp.applicant}</td>
                  <td className={`px-4 py-3 font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{tp.mineral} ({tp.quantity})</td>
                  <td className={`px-4 py-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{tp.origin} &rarr; {tp.destination}</td>
                  <td className="px-4 py-3">
                    <div className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{tp.vehiclePlate}</div>
                    <div className="text-[10px] text-slate-400">{tp.driver}</div>
                  </td>
                  <td className="px-4 py-3">{tp.date}</td>
                  <td className="px-4 py-3"><Badge status="Active">Verified Valid</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Waybill Modal Dialog */}
      {showModal && (
        <div id="modal-waybill" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 border space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`font-bold text-lg border-b pb-2 ${darkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
              Issue New Mineral Transport Permit
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input id="tp-applicant-input" label="License Holder Company" value={newPermit.applicant} onChange={(e) => setNewPermit({...newPermit, applicant: e.target.value})} required />
              <Input id="tp-mineral-input" label="Mineral Commodity & Grade" value={newPermit.mineral} onChange={(e) => setNewPermit({...newPermit, mineral: e.target.value})} required />
              <Input id="tp-quantity-input" label="Quantity / Weight (Tons)" value={newPermit.quantity} onChange={(e) => setNewPermit({...newPermit, quantity: e.target.value})} required />
              <div className="grid grid-cols-2 gap-2">
                <Input id="tp-origin-input" label="Origin Location" value={newPermit.origin} onChange={(e) => setNewPermit({...newPermit, origin: e.target.value})} required />
                <Input id="tp-dest-input" label="Destination Vault/Hub" value={newPermit.destination} onChange={(e) => setNewPermit({...newPermit, destination: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input id="tp-plate-input" label="Vehicle Plate Number" value={newPermit.vehiclePlate} onChange={(e) => setNewPermit({...newPermit, vehiclePlate: e.target.value})} required />
                <Input id="tp-driver-input" label="Authorized Driver" value={newPermit.driver} onChange={(e) => setNewPermit({...newPermit, driver: e.target.value})} required />
              </div>
              <div className={`flex justify-end gap-2 pt-3 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <Button id="btn-cancel-waybill" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button id="btn-submit-waybill" type="submit">Issue Official Waybill</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsView: React.FC = () => {
  return <ReportsAnalyticsView />;
};

const AuditLogView: React.FC = () => {
  const { state } = useAppContext();
  const darkMode = state?.darkMode;
  return (
    <Card id="audit-log-card" title="Immutable System Audit Logs" subtitle="Cryptographically logged read/write actions for full security accountability">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className={`text-[10px] uppercase border-b ${
            darkMode ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <tr>
              <th className="px-4 py-3">Timestamp (UTC)</th>
              <th className="px-4 py-3">Official User</th>
              <th className="px-4 py-3">Assigned Role</th>
              <th className="px-4 py-3">Action Details</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {state.auditLogs.map((log) => (
              <tr key={log.id} className={`font-mono transition-colors ${darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                <td className={`px-4 py-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(log.time).toLocaleString()}</td>
                <td className={`px-4 py-3 font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{log.user}</td>
                <td className={`px-4 py-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{log.role}</td>
                <td className={`px-4 py-3 font-sans ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{log.action}</td>
                <td className="px-4 py-3 text-slate-400">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const Router: React.FC = () => {
  const { state } = useAppContext();

  if (state.currentView === 'public') return <PublicLanding />;
  if (state.currentView === 'login') return <Login />;

  return (
    <DashboardLayout>
      {state.currentView === 'dashboard' && <DashboardOverview />}
      {state.currentView === 'applications' && <ApplicationList />}
      {state.currentView === 'new-application' && <NewApplication />}
      {state.currentView === 'application-detail' && <ApplicationDetail />}
      {state.currentView === 'map' && <CadastreMap />}
      {(state.currentView === 'renewals' || state.currentView === 'transport') && <RenewalTimeView />}
      {state.currentView === 'reports' && <ReportsView />}
      {state.currentView === 'audit' && <AuditLogView />}
      {state.currentView === 'trade' && <TradeView />}
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

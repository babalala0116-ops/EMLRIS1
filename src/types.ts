import type { Dispatch } from 'react';

export type RoleType = 
  | 'Super Admin'
  | 'MoM Officer (Federal)'
  | 'MIDI Technical Officer'
  | 'Regional Authority Officer'
  | 'External Auditor';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  region: string;
  idMask: string;
  password?: string;
  portalType?: 'governmental' | 'regional';
}

export interface LicenseType {
  id: string;
  name: string;
  category: 'Upstream' | 'Midstream' | 'Downstream';
  defaultLevel: 'Regional' | 'Federal';
  duration: string;
  renewable: 'Yes' | 'No';
  fields: string[];
  documents: string[];
}

export interface Application {
  id: string;
  applicant: string;
  tin: string;
  type: string;
  typeId: string;
  region: string;
  mineral: string;
  status: string;
  date: string;
  coordinates: string;
  level: string;
  capex?: string;
  budget?: string;
  assignedTo?: string;
  lastRemark?: string;
  delayReason?: string;
  machineryCap?: string;
  officeLocation?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverID?: string;
  origin?: string;
  destination?: string;
  quantityTons?: string;
  destCountry?: string;
  assayGrade?: string;
  issueDate?: string;
  expiryDate?: string;
  duration?: string;
  renewalStatus?: 'Good Standing' | 'Renewal Window Open' | 'Critical / Expiring Soon' | 'Expired (Grace Period)' | 'Non-Renewable';
  renewable?: 'Yes' | 'No';
  renewalCount?: number;
  lastRenewalDate?: string;
  concessionAreaKm2?: number;
  escrowBondStatus?: 'Verified & Funded' | 'Under Review' | 'Pending Deposit';
  relinquishmentCompliant?: boolean;
}

export interface TransportPermit {
  id: string;
  applicant: string;
  mineral: string;
  quantity: string;
  origin: string;
  destination: string;
  vehiclePlate: string;
  driver: string;
  date: string;
  status: string;
}

export interface AuditLog {
  id: number;
  user: string;
  role: string;
  action: string;
  time: string;
  ip: string;
}

export interface TradeClearance {
  id: string;
  companyName: string;
  tin: string;
  type: 'Commercial Mineral Export' | 'Duty-Free Equipment Import';
  commodityOrEquipment: string;
  quantity: string;
  valuationUSD: string;
  valuationETB: string;
  portOrDestination: string;
  status: 'NBE Forex Cleared & Export Approved' | 'Assay & Origin Verified' | 'Under Customs Physical Inspection' | 'Duty-Free BoQ Approved' | 'Pending Bank Guarantee' | 'Rejected / Audit Required';
  date: string;
  nbeReference: string;
  customsDecNo: string;
  country: string;
}

export interface ExportRecord {
  id: string;
  timestamp: string;
  format: string;
  extension: string;
  filename: string;
  user: string;
  userRole: string;
  recordCount: number;
  context: string;
  fileSize?: string;
  status: 'Completed' | 'Archived';
}

export interface AppState {
  currentUser: DemoUser | null;
  currentView: string;
  selectedEntityId: string | null;
  applications: Application[];
  licenseTypes: LicenseType[];
  transportPermits: TransportPermit[];
  auditLogs: AuditLog[];
  darkMode?: boolean;
  lastRegisteredId?: string | null;
  tradeClearances?: TradeClearance[];
  history?: string[];
  loginPortalPreference?: 'governmental' | 'regional';
  exportHistory?: ExportRecord[];
}

export type AppAction =
  | { type: 'LOGIN'; payload: DemoUser }
  | { type: 'LOGOUT' }
  | { type: 'NAVIGATE'; payload: string; entityId?: string }
  | { type: 'GO_BACK' }
  | { type: 'ADD_APPLICATION'; payload: Partial<Application> & { type: string; typeId: string; level: string; region: string; applicant: string; tin: string; mineral: string } }
  | { type: 'UPDATE_STATUS'; payload: { id: string; newStatus: string; remark?: string } }
  | { type: 'BULK_UPDATE_STATUS'; payload: { ids: string[]; newStatus: string; remark?: string } }
  | { type: 'UPDATE_AUTHORITY_CONFIG'; payload: { typeId: string; newLevel: 'Regional' | 'Federal' } }
  | { type: 'ADD_AUDIT'; payload: AuditLog }
  | { type: 'ADD_TRANSPORT_PERMIT'; payload: Omit<TransportPermit, 'id' | 'date' | 'status'> }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'ADD_TRADE_CLEARANCE'; payload: Omit<TradeClearance, 'id' | 'date' | 'nbeReference' | 'customsDecNo'> }
  | { type: 'CLEAR_LAST_REGISTERED' }
  | { type: 'RENEW_LICENSE'; payload: { id: string; extensionYears: number; newExpiryDate: string; remark?: string } }
  | { type: 'SET_LOGIN_PORTAL_PREF'; payload: 'governmental' | 'regional' }
  | { type: 'LOG_EXPORT'; payload: ExportRecord };

export interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Lock, AlertCircle, CheckCircle, Eye, EyeOff, 
  UserCheck, ArrowRight, User
} from 'lucide-react';
import type { DemoUser } from '../types';

interface RoleSwitchAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: DemoUser;
  targetUser: DemoUser | null;
  availableUsers: DemoUser[];
  onConfirmSwitch: (user: DemoUser) => void;
  darkMode?: boolean;
}

export const RoleSwitchAuthModal: React.FC<RoleSwitchAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser: initialTargetUser,
  availableUsers,
  onConfirmSwitch,
  darkMode = false
}) => {
  const [selectedUser, setSelectedUser] = useState<DemoUser>(
    initialTargetUser || availableUsers[0]
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTargetUser) {
      setSelectedUser(initialTargetUser);
    }
  }, [initialTargetUser]);

  useEffect(() => {
    // Reset password & error when selected user changes
    setPasswordInput('');
    setErrorMessage(null);
  }, [selectedUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const REQUIRED_PASSWORD = '12345678';

    if (!passwordInput.trim()) {
      setErrorMessage('Security Clearance Verification Failed: Password cannot be blank. Access denied.');
      return;
    }

    if (passwordInput.trim() !== REQUIRED_PASSWORD) {
      setErrorMessage(
        `Security Clearance Verification Failed: The entered passcode does not match official credentials for ${selectedUser.name}. Access denied.`
      );
      return;
    }

    onConfirmSwitch(selectedUser);
    onClose();
  };

  return (
    <div 
      id="modal-role-switch-auth"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className={`rounded-2xl shadow-2xl max-w-lg w-full border overflow-hidden flex flex-col ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-4 border-slate-200 dark:border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Security Clearance Authentication</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Statutory role change requires individual official password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Regulatory Warning Callout */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-start gap-2.5">
            <Shield size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Mandatory Protocol:</strong> Switching into another official identity (such as Ministry Director or Regional Bureau Officer) is restricted and requires identity password clearance.
            </div>
          </div>

          {/* Current Official vs Target Official Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Session</div>
              <div className="font-bold text-xs mt-1 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5 truncate">{currentUser.role}</div>
            </div>

            <div className={`p-3 rounded-xl border border-amber-500/40 ${darkMode ? 'bg-amber-950/20' : 'bg-amber-50/50'}`}>
              <div className="text-[10px] uppercase font-bold text-amber-500">Target Role To Assume</div>
              <div className="font-bold text-xs mt-1 truncate">{selectedUser.name}</div>
              <div className="text-[10px] text-amber-400 mt-0.5 truncate">{selectedUser.role}</div>
            </div>
          </div>

          {/* Target Official Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Official Role to Assume:
            </label>
            <select
              id="select-target-role-auth"
              value={selectedUser.id}
              onChange={(e) => {
                const found = availableUsers.find(u => u.id === e.target.value);
                if (found) setSelectedUser(found);
              }}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-hidden transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
              }`}
            >
              <optgroup label="Federal Governmental Officials (MoM / MIDI)">
                {availableUsers.filter(u => u.portalType === 'governmental').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role} ({u.region})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Regional Bureau Mining Officials">
                {availableUsers.filter(u => u.portalType === 'regional').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role} ({u.region})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Official Clearance Details Card */}
          <div className={`p-3 rounded-xl text-xs space-y-1.5 border ${
            darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between">
              <span className="text-slate-400">Institutional Email:</span>
              <span className="font-mono text-slate-300">{selectedUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jurisdiction Authority:</span>
              <span className="font-bold text-emerald-400">{selectedUser.region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">National ID Mask:</span>
              <span className="font-mono">{selectedUser.idMask}</span>
            </div>
          </div>

          {/* Password Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Security Password:
              </label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                <Lock size={10} className="text-amber-500" />
                <span>Clearance Required</span>
              </span>
            </div>

            <div className="relative">
              <input
                id="input-role-switch-password"
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter security clearance password..."
                autoFocus
                className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs font-mono font-bold border outline-hidden transition-all ${
                  errorMessage
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

            {errorMessage && (
              <div className="mt-2 text-[11px] text-rose-500 font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              id="btn-submit-role-switch-auth"
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck size={15} />
              <span>Verify & Switch Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

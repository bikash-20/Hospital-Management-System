import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Shield,
  User,
  Database,
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-display text-surface-900 dark:text-white">Settings</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          System configuration and user preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary-400" />
          Appearance
        </h2>
        <div className="flex items-center justify-between p-4 card-inset">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">Theme</p>
              <p className="text-xs text-surface-500">{isDark ? 'Dark mode' : 'Light mode'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isDark ? 'bg-primary-600' : 'bg-surface-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-400" />
          Profile
        </h2>
        <div className="space-y-3">
          <InfoRow label="Name" value={user?.fullName ?? ''} />
          <InfoRow label="Email" value={user?.email ?? ''} />
          <InfoRow label="Role" value={user?.role ?? ''} />
          <InfoRow label="User ID" value={user?.id ?? ''} />
        </div>
      </div>

      {/* Permissions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          Role Permissions
        </h2>
        <div className="text-sm text-surface-500 space-y-2">
          <p>Your role <span className="font-mono text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">{user?.role}</span> has access to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            {user?.role === 'ADMIN' && (
              <>
                <li>Full system access and configuration</li>
                <li>User management and audit logs</li>
                <li>Bed management and revenue reports</li>
                <li>All clinical and billing modules</li>
              </>
            )}
            {user?.role === 'DOCTOR' && (
              <>
                <li>Patient consultation and EHR access</li>
                <li>Prescription writing</li>
                <li>Lab order creation</li>
                <li>Queue view</li>
              </>
            )}
            {user?.role === 'RECEPTIONIST' && (
              <>
                <li>Patient registration</li>
                <li>Appointment scheduling</li>
                <li>Queue management</li>
                <li>Basic billing view</li>
              </>
            )}
            {user?.role === 'LAB_TECH' && (
              <>
                <li>Lab order processing</li>
                <li>Report upload and management</li>
                <li>Patient result viewing</li>
              </>
            )}
            {user?.role === 'CASHIER' && (
              <>
                <li>Invoice and billing management</li>
                <li>Payment processing</li>
                <li>Discount approvals</li>
                <li>Revenue reporting</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* System Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary-400" />
          System Information
        </h2>
        <div className="space-y-3">
          <InfoRow label="Application" value="CareBridge RMS" />
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Frontend" value="React 19 + TypeScript + Tailwind CSS v4" />
          <InfoRow label="Backend" value="Spring Boot 4.1 + Java 25" />
          <InfoRow label="Database" value="PostgreSQL 17" />
          <InfoRow label="Environment" value="Production (Supabase)" />
          <InfoRow label="Developed by" value="Bikash Talukder" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-100 dark:border-[#2A2F38] last:border-0">
      <span className="text-sm text-surface-500">{label}</span>
      <span className="text-sm font-medium text-surface-900 dark:text-white">{value}</span>
    </div>
  );
}

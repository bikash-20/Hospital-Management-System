import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersApi, createUserApi, updateUserApi, toggleUserEnabledApi, deleteUserApi } from '@/api/api';
import type { ManagedUser, UserRole } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  X,
  AlertTriangle,
} from 'lucide-react';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  DOCTOR: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  RECEPTIONIST: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  LAB_TECH: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  CASHIER: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  LAB_TECH: 'Lab Tech',
  CASHIER: 'Cashier',
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ManagedUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsersApi,
  });

  const filtered = users?.filter(u =>
    !searchQuery ||
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof updateUserApi>[1]) =>
      updateUserApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUserEnabledApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteConfirm(null);
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-surface-900 dark:text-white">User Management</h1>
          <p className="text-body text-surface-500 dark:text-surface-400 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-600/20 focus-ring"
          style={{ minHeight: '44px' }}
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-[#2A2F38]">
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="skeleton w-10 h-10 rounded-full" />
                          <div className="skeleton w-32 h-5 rounded" />
                          <div className="skeleton w-20 h-6 rounded-full" />
                          <div className="skeleton w-16 h-5 rounded" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : !filtered || filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-surface-500">No users found</p>
                  </td>
                </tr>
              ) : (
                <StaggerContainer>
                  {filtered.map((user) => (
                    <StaggerItem key={user.id}>
                      <tr className="border-b border-surface-50 dark:border-[#1A1F26] table-row-hover">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900 dark:text-white">{user.fullName}</p>
                              <p className="text-xs text-surface-500">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            user.enabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {user.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleMutation.mutate(user.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.enabled
                                  ? 'hover:bg-amber-500/10 text-surface-400 hover:text-amber-500'
                                  : 'hover:bg-emerald-500/10 text-surface-400 hover:text-emerald-500'
                              }`}
                              title={user.enabled ? 'Disable user' : 'Enable user'}
                            >
                              {user.enabled ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-flat p-4 space-y-2">
                  <div className="skeleton w-32 h-5 rounded" />
                  <div className="skeleton w-24 h-5 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filtered?.map((user) => (
                <div key={user.id} className="card-flat p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {user.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-white">{user.fullName}</p>
                        <p className="text-xs text-surface-500">@{user.username}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex-1 py-2 text-xs font-medium rounded-lg border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(user.id)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border ${
                        user.enabled
                          ? 'border-amber-200 text-amber-600'
                          : 'border-emerald-200 text-emerald-600'
                      }`}
                    >
                      {user.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="py-2 px-3 text-xs font-medium rounded-lg border border-red-200 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingUser) && (
          <UserFormModal
            user={editingUser}
            onClose={() => { setShowCreateModal(false); setEditingUser(null); }}
            onCreate={(data) => createMutation.mutate(data)}
            onUpdate={(data) => editingUser && updateMutation.mutate({ id: editingUser.id, ...data })}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            user={deleteConfirm}
            onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
            onCancel={() => setDeleteConfirm(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onCreate,
  onUpdate,
  isPending,
}: {
  user: ManagedUser | null;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    username: user?.username ?? '',
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'RECEPTIONIST' as UserRole,
    enabled: user?.enabled ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onUpdate({
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        enabled: form.enabled,
        ...(form.password ? { password: form.password } : {}),
      });
    } else {
      onCreate(form);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="card w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-surface-100 dark:border-[#2A2F38] flex items-center justify-between">
            <h2 className="text-heading text-surface-900 dark:text-white">
              {user ? 'Edit User' : 'Create User'}
            </h2>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-white/5 text-surface-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {!user && (
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Password {user ? '(leave blank to keep)' : '*'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required={!user}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-[#111820] border border-surface-200 dark:border-[#2A2F38] rounded-xl text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="ADMIN">Admin</option>
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="LAB_TECH">Lab Tech</option>
                <option value="CASHIER">Cashier</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="text-sm text-surface-700 dark:text-surface-300">Active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 font-medium">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white rounded-xl font-medium">
                {isPending ? 'Saving...' : user ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
  isPending,
}: {
  user: ManagedUser;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="card w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Delete User</h3>
            <p className="text-sm text-surface-500">
              Are you sure you want to delete <span className="font-medium text-surface-900 dark:text-white">{user.fullName}</span>?
              This action cannot be undone.
            </p>
          </div>
          <div className="p-5 border-t border-surface-100 dark:border-[#2A2F38] flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-[#2A2F38] text-surface-600 dark:text-surface-400 font-medium">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isPending} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white rounded-xl font-medium">
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

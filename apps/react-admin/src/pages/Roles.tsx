import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import api from '@/services/api';
import type { RolePermission } from '@/types';
import type { Column } from '@/components/common/DataTable';
import { toast } from 'react-toastify';

const allPermissions = [
  'users.read', 'users.write',
  'transactions.read', 'transactions.write',
  'loans.read', 'loans.write',
  'products.read', 'products.write',
  'audit.read',
  'roles.read', 'roles.write',
];

const roleDescriptions: Record<string, string> = {
  super_admin: 'Full system access with all permissions',
  admin: 'Administrative access to most features',
  moderator: 'Can manage users and moderate content',
  support: 'Read-only access to user and transaction data',
  viewer: 'Read-only access to all data',
};

export default function Roles() {
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  const { data: roles, isLoading } = useQuery<RolePermission[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/admin/roles');
      return res.data;
    },
    placeholderData: [
      { role: 'super_admin', permissions: ['*'], description: 'Full system access with all permissions' },
      { role: 'admin', permissions: ['users.read', 'users.write', 'transactions.read', 'transactions.write', 'loans.read', 'loans.write', 'products.read', 'products.write', 'audit.read', 'roles.read', 'roles.write'], description: 'Administrative access to most features' },
      { role: 'moderator', permissions: ['users.read', 'users.write', 'transactions.read', 'loans.read', 'loans.write', 'audit.read'], description: 'Can manage users and moderate content' },
      { role: 'support', permissions: ['users.read', 'transactions.read', 'loans.read'], description: 'Read-only access to user and transaction data' },
      { role: 'viewer', permissions: ['users.read', 'transactions.read', 'loans.read', 'products.read', 'audit.read'], description: 'Read-only access to all data' },
    ],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { role: string; permissions: string[] }) => {
      await api.put(`/admin/roles/${data.role}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      setModalOpen(false);
    },
    onError: () => toast.error('Failed to update role'),
  });

  const handleEdit = (role: RolePermission) => {
    setEditingRole(role);
    setEditedPermissions([...role.permissions]);
    setModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    setEditedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleSave = () => {
    if (!editingRole) return;
    // super_admin always has all permissions
    const perms = editingRole.role === 'super_admin' ? ['*'] : editedPermissions;
    updateMutation.mutate({ role: editingRole.role, permissions: perms });
  };

  const columns: Column<RolePermission>[] = [
    {
      key: 'role',
      header: 'Role',
      render: (r) => (
        <div>
          <p className="font-medium text-surface-900 capitalize">{r.role.replace('_', ' ')}</p>
          <p className="text-xs text-surface-500 mt-0.5">{roleDescriptions[r.role] || ''}</p>
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.permissions.length === 1 && r.permissions[0] === '*' ? (
            <span className="badge bg-primary-100 text-primary-700">All permissions</span>
          ) : (
            r.permissions.map((perm) => (
              <span key={perm} className="badge bg-surface-100 text-surface-600">
                {perm}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          onClick={() => handleEdit(r)}
          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Roles & Permissions</h1>
        <p className="text-surface-500 text-sm mt-1">Manage role-based access control</p>
      </div>

      <DataTable<RolePermission>
        columns={columns}
        data={roles ?? []}
        loading={isLoading}
        keyExtractor={(r) => r.role}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Edit ${editingRole?.role.replace('_', ' ')} permissions`}
        size="lg"
      >
        {editingRole && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">{roleDescriptions[editingRole.role]}</p>

            {editingRole.role === 'super_admin' ? (
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700 font-medium">Super Admin has all permissions by default.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allPermissions.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={editedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-surface-700 font-mono">{perm}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

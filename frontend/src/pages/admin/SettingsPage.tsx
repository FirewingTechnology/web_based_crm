import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Users, ShieldCheck, Key, UserCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { usersApi } from '../../api/users';
import { User, UserCreateInput, UserRole } from '../../types/user';

export const SettingsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<UserCreateInput>({
    name: '',
    email: '',
    password: 'User@123',
    role: 'Sales Executive',
    phone: '',
    firm_name: '',
  });

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await usersApi.createUser(newUser);
    setIsModalOpen(false);
    fetchUsers();
  };

  const handleToggleActive = async (user: User) => {
    await usersApi.updateUser(user.id, { is_active: !user.is_active });
    fetchUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Delete this user account?')) {
      await usersApi.deleteUser(id);
      fetchUsers();
    }
  };

  const roleVariant: Record<string, 'purple' | 'blue' | 'emerald' | 'amber'> = {
    Admin: 'purple',
    Manager: 'blue',
    'Sales Executive': 'emerald',
    Broker: 'amber',
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User Name & Email',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-white">{row.original.name}</p>
          <p className="text-slate-400 text-xs">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={roleVariant[row.original.role] || 'blue'}>{row.original.role}</Badge>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone / Firm',
      cell: ({ row }) => (
        <span className="text-xs text-slate-300">
          {row.original.phone || 'N/A'} {row.original.firm_name ? `(${row.original.firm_name})` : ''}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'emerald' : 'rose'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(row.original)}
          >
            {row.original.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <button
            onClick={() => handleDeleteUser(row.original.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const roleOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Sales Executive', value: 'Sales Executive' },
    { label: 'Broker', value: 'Broker' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Users</h1>
          <p className="text-xs text-slate-400 mt-1">Manage user access permissions, roles & lead acquisition channels</p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create User Account
        </Button>
      </div>

      {/* Users Data Table */}
      <DataTable columns={columns} data={users} searchPlaceholder="Search user name, email, role..." />

      {/* User Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User Account"
        subtitle="Set user credentials & assign portal role access"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Ramesh Kumar"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="ramesh@brokeros.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <Input
            label="Password *"
            type="password"
            placeholder="User@123"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Role Permission *"
              options={roleOptions}
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

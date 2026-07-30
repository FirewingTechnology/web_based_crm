import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Copy, Check, Share2, Sparkles, UserPlus, Send } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { UserCreateInput, UserRole } from '../../types/user';
import { usersApi } from '../../api/users';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultRole?: UserRole;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'Sales Executive',
}) => {
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput>({
    defaultValues: {
      role: defaultRole,
      password: 'Sales@123',
    },
  });

  const onFormSubmit = async (data: UserCreateInput) => {
    try {
      await usersApi.createUser(data);
      setCreatedCredentials({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user account');
    }
  };

  const handleClose = () => {
    setCreatedCredentials(null);
    setCopied(false);
    reset({
      name: '',
      email: '',
      phone: '',
      password: 'Sales@123',
      role: defaultRole,
    });
    onClose();
  };

  const getShareText = () => {
    if (!createdCredentials) return '';
    const loginUrl = 'http://localhost:5174/login';
    return `Welcome to BrokerOS CRM!\n\nHere are your Sales Executive portal login credentials:\n\nPortal URL: ${loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nPlease log in and change your password upon first login.`;
  };

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdCredentials ? 'Account Created & Credentials Ready!' : 'Add New Sales Executive Account'}
      subtitle={
        createdCredentials
          ? 'Share these login details with the new team member'
          : 'Only Admin can register sales team members & grant portal access'
      }
      maxWidth="md"
    >
      {createdCredentials ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-900/40 to-slate-900 border border-blue-500/40 text-slate-100 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Sparkles className="h-5 w-5" /> Sales Executive Account Activated
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-semibold text-white">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Portal Link:</span>
                <span className="font-semibold text-blue-400">http://localhost:5174/login</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-bold text-emerald-400">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Initial Password:</span>
                <span className="font-mono font-bold text-amber-400">{createdCredentials.password}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCopyCredentials}
              icon={copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
            </Button>
            <Button
              variant="primary"
              onClick={handleShareWhatsApp}
              icon={<Send className="h-4 w-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 border-none"
            >
              Share via WhatsApp
            </Button>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <Input
            label="Sales Executive Full Name *"
            placeholder="e.g. Rahul Sharma"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Email Address *"
              type="email"
              placeholder="rahul@brokeros.com"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Initial Password *"
              type="text"
              placeholder="Sales@123"
              {...register('password', { required: 'Password is required' })}
              error={errors.password?.message}
            />
            <Select
              label="Assigned Role *"
              options={[
                { label: 'Sales Executive', value: 'Sales Executive' },
                { label: 'Manager', value: 'Manager' },
              ]}
              {...register('role')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={<UserPlus className="h-4 w-4" />}>
              Create Account & Generate Credentials
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

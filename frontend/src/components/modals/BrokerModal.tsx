import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BrokerProfile, BrokerCreateInput } from '../../types/broker';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BrokerCreateInput) => Promise<void>;
  initialBroker?: BrokerProfile | null;
  defaultSingleMode?: boolean;
}

export const BrokerModal: React.FC<BrokerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBroker,
  defaultSingleMode = false,
}) => {
  const [brokerCategory, setBrokerCategory] = useState<'single' | 'firm'>(
    defaultSingleMode ? 'single' : 'firm'
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrokerCreateInput>();

  useEffect(() => {
    setBrokerCategory(defaultSingleMode ? 'single' : 'firm');
    if (initialBroker) {
      const isIndiv = initialBroker.firm_name.includes('Independent') || initialBroker.firm_name === initialBroker.contact_person;
      setBrokerCategory(isIndiv ? 'single' : 'firm');
      reset({
        firm_name: initialBroker.firm_name,
        contact_person: initialBroker.contact_person,
        phone: initialBroker.phone,
        email: initialBroker.email,
        address: initialBroker.address,
        commission_rate: initialBroker.commission_rate,
      });
    } else {
      reset({
        firm_name: '',
        contact_person: '',
        phone: '',
        email: '',
        password: 'Broker@123',
        address: '',
        commission_rate: 1.5,
      });
    }
  }, [initialBroker, isOpen, defaultSingleMode, reset]);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onFormSubmit = async (data: BrokerCreateInput) => {
    setSubmitError(null);
    try {
      const payload = {
        ...data,
        commission_rate: Number(data.commission_rate) || 1.5,
      };
      if (brokerCategory === 'single') {
        if (!payload.firm_name && payload.contact_person) {
          payload.firm_name = `${payload.contact_person} (Independent Broker)`;
        } else if (!payload.contact_person && payload.firm_name) {
          payload.contact_person = payload.firm_name;
          payload.firm_name = `${payload.firm_name} (Independent Broker)`;
        }
      }
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error('Broker submit error:', err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') : err.message || 'Failed to save broker. Please check required fields.');
      setSubmitError(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialBroker
          ? 'Edit Broker Profile'
          : brokerCategory === 'single'
          ? 'Add Single Broker Partner'
          : 'Register Brokerage Firm'
      }
      subtitle="Configure CP broker details, contact info & override commission %"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {submitError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
            <span>⚠️ {submitError}</span>
            <button type="button" onClick={() => setSubmitError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}
        {/* Category Radio Toggle */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-semibold text-slate-300">Broker Category:</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
            <input
              type="radio"
              name="category"
              value="single"
              checked={brokerCategory === 'single'}
              onChange={() => setBrokerCategory('single')}
              className="text-blue-500 focus:ring-blue-500"
            />
            Single / Independent Broker
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
            <input
              type="radio"
              name="category"
              value="firm"
              checked={brokerCategory === 'firm'}
              onChange={() => setBrokerCategory('firm')}
              className="text-blue-500 focus:ring-blue-500"
            />
            Brokerage Firm / Agency
          </label>
        </div>

        {/* Dynamic Name Inputs */}
        {brokerCategory === 'single' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Broker Full Name *"
              placeholder="e.g. Ramesh Kumar"
              {...register('contact_person', { required: 'Broker name is required' })}
              error={errors.contact_person?.message}
            />
            <Input
              label="Firm / Display Name (Optional)"
              placeholder="e.g. Ramesh Kumar Realty"
              {...register('firm_name')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Brokerage Firm Name *"
              placeholder="e.g. Apex Realty Advisors"
              {...register('firm_name', { required: 'Firm name is required' })}
              error={errors.firm_name?.message}
            />
            <Input
              label="Contact Person Name *"
              placeholder="e.g. Karan Malhotra"
              {...register('contact_person', { required: 'Contact person is required' })}
              error={errors.contact_person?.message}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Phone Number *"
            placeholder="+91 98765 43210"
            {...register('phone', { required: 'Phone is required' })}
            error={errors.phone?.message}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="broker@brokeros.com"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
        </div>

        {!initialBroker && (
          <Input
            label="Portal Login Password *"
            type="password"
            placeholder="Broker@123"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Broker Commission Share (%) *"
            type="number"
            step="0.1"
            placeholder="1.5"
            {...register('commission_rate', { valueAsNumber: true, required: 'Commission rate is required' })}
            error={errors.commission_rate?.message}
          />
          <Input label="Office / City Address" placeholder="e.g. Noida, Uttar Pradesh" {...register('address')} />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialBroker ? 'Save Changes' : brokerCategory === 'single' ? 'Add Single Broker' : 'Register Broker Firm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

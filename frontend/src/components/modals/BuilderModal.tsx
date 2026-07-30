import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Builder, BuilderCreateInput } from '../../types/builder';

interface BuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BuilderCreateInput) => Promise<void>;
  initialBuilder?: Builder | null;
}

export const BuilderModal: React.FC<BuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBuilder,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BuilderCreateInput>();

  useEffect(() => {
    if (initialBuilder) {
      reset({
        name: initialBuilder.name,
        company: initialBuilder.company,
        contact_person: initialBuilder.contact_person,
        phone: initialBuilder.phone,
        email: initialBuilder.email,
        address: initialBuilder.address,
        commission_rate: initialBuilder.commission_rate,
        notes: initialBuilder.notes,
      });
    } else {
      reset({
        name: '',
        company: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        commission_rate: 3.5,
        notes: '',
      });
    }
  }, [initialBuilder, isOpen, reset]);

  const onFormSubmit = async (data: BuilderCreateInput) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialBuilder ? 'Edit Builder Partner' : 'Add New Real Estate Builder'}
      subtitle="Configure builder contact details & default CP commission %"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Builder Brand Name *"
            placeholder="e.g. Godrej Properties"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Company Legal Name *"
            placeholder="e.g. Godrej Properties Ltd"
            {...register('company', { required: 'Company is required' })}
            error={errors.company?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Contact Person Name *"
            placeholder="e.g. Vikram Ahuja"
            {...register('contact_person', { required: 'Contact person is required' })}
            error={errors.contact_person?.message}
          />
          <Input
            label="Phone Number *"
            placeholder="+91 98765 43210"
            {...register('phone', { required: 'Phone is required' })}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Email Address *"
            type="email"
            placeholder="vikram@godrejproperties.com"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label="Default Commission Rate (%) *"
            type="number"
            step="0.1"
            placeholder="3.5"
            {...register('commission_rate', { valueAsNumber: true, required: 'Commission rate is required' })}
            error={errors.commission_rate?.message}
          />
        </div>

        <Input
          label="Corporate Address"
          placeholder="e.g. Godrej One, Vikhroli East, Mumbai"
          {...register('address')}
        />

        <Input
          label="Notes / Payment Terms"
          placeholder="e.g. Payouts processed within 30 days of booking token."
          {...register('notes')}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialBuilder ? 'Save Changes' : 'Add Builder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

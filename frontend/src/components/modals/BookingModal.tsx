import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { BookingCreateInput } from '../../types/booking';
import { Lead } from '../../types/lead';
import { Project } from '../../types/project';
import { User } from '../../types/user';
import { BrokerProfile } from '../../types/broker';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingCreateInput) => Promise<void>;
  leads?: Lead[];
  projects?: Project[];
  executives?: User[];
  brokers?: BrokerProfile[];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leads = [],
  projects = [],
  executives = [],
  brokers = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingCreateInput>();

  useEffect(() => {
    if (isOpen) {
      reset({
        lead_id: leads[0]?.id || 1,
        project_id: projects[0]?.id || 1,
        assigned_executive_id: executives[0]?.id || 1,
        broker_id: undefined,
        unit_number: 'Tower A - 1204',
        total_deal_value: 15000000,
        booking_amount: 500000,
        notes: 'Independence Month token discount applied.',
      });
    }
  }, [isOpen]);

  const onFormSubmit = async (data: BookingCreateInput) => {
    await onSubmit(data);
    onClose();
  };

  const leadOptions = leads.map((l) => ({ label: `${l.name} (${l.phone})`, value: l.id }));
  const projectOptions = projects.map((p) => ({ label: `${p.name} (${p.location})`, value: p.id }));
  const execOptions = executives.map((e) => ({ label: `${e.name} (${e.role})`, value: e.id }));
  const brokerOptions = [
    { label: '-- No External Broker (Direct Deal) --', value: '' },
    ...brokers.map((b) => ({ label: `${b.firm_name} (${b.contact_person})`, value: b.id })),
  ];

  const watchedDealValue = watch('total_deal_value') || 0;
  const estimatedBuilderComm = (watchedDealValue * 0.035).toLocaleString('en-IN');
  const estimatedExecComm = (watchedDealValue * 0.005).toLocaleString('en-IN');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Property Booking"
      subtitle="Generate deal booking token & auto-calculate commission split"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {leadOptions.length > 0 && (
            <Select
              label="Select Buyer Lead *"
              options={leadOptions}
              {...register('lead_id', { valueAsNumber: true, required: 'Lead is required' })}
              error={errors.lead_id?.message}
            />
          )}
          {projectOptions.length > 0 && (
            <Select
              label="Select Project *"
              options={projectOptions}
              {...register('project_id', { valueAsNumber: true, required: 'Project is required' })}
              error={errors.project_id?.message}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {execOptions.length > 0 && (
            <Select
              label="Closing Executive *"
              options={execOptions}
              {...register('assigned_executive_id', { valueAsNumber: true, required: 'Executive required' })}
              error={errors.assigned_executive_id?.message}
            />
          )}
          <Select
            label="Sourcing Broker (Optional)"
            options={brokerOptions}
            {...register('broker_id', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Unit / Flat Number *"
            placeholder="e.g. Tower B - 1402"
            {...register('unit_number', { required: 'Unit number required' })}
            error={errors.unit_number?.message}
          />
          <Input
            label="Total Deal Value (INR) *"
            type="number"
            placeholder="15000000"
            {...register('total_deal_value', { valueAsNumber: true, required: 'Deal value required' })}
            error={errors.total_deal_value?.message}
          />
          <Input
            label="Token Booking Amount (INR) *"
            type="number"
            placeholder="500000"
            {...register('booking_amount', { valueAsNumber: true, required: 'Booking amount required' })}
            error={errors.booking_amount?.message}
          />
        </div>

        {/* Live Commission Split Calculation Preview */}
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1 text-slate-200">
          <p className="font-semibold text-blue-400">⚡ Automatic Commission Split Preview:</p>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <span>• Estimated Builder Comm (3.5%): <strong className="text-white">₹{estimatedBuilderComm}</strong></span>
            <span>• Executive Incentive (0.5%): <strong className="text-white">₹{estimatedExecComm}</strong></span>
          </div>
        </div>

        <Input label="Booking Remarks / Notes" placeholder="e.g. Token received via RTGS ref #998822." {...register('notes')} />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};

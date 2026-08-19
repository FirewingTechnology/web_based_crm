import React, { useEffect, useState } from 'react';
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
import { UserCheck, Sparkles, Building2 } from 'lucide-react';

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingCreateInput>();

  const watchedLeadId = watch('lead_id');
  const watchedProjectId = watch('project_id');
  const watchedDealValue = watch('total_deal_value') || 0;
  const watchedTokenAmount = watch('booking_amount') || 0;

  const selectedLead = leads.find((l) => l.id === Number(watchedLeadId));
  const selectedProject = projects.find((p) => p.id === Number(watchedProjectId));

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen && leads.length > 0) {
      const initialLead = leads[0];
      const initialProjId = initialLead.preferred_project_id || projects[0]?.id || 1;
      const initialExecId = initialLead.assigned_to_id || executives[0]?.id || 1;

      const rawBudget = initialLead.budget_max || initialLead.budget_min;
      let initialDealVal = 3000000;
      if (rawBudget) {
        initialDealVal = rawBudget <= 1000 ? rawBudget * 100000 : rawBudget;
      } else if (projects[0]?.min_price) {
        initialDealVal = projects[0].min_price * 100000;
      }

      reset({
        lead_id: initialLead.id,
        project_id: initialProjId,
        assigned_executive_id: initialExecId,
        broker_id: undefined,
        unit_number: initialLead.preferred_configuration ? `${initialLead.preferred_configuration} - Unit 402` : 'Unit 402',
        total_deal_value: initialDealVal,
        booking_amount: Math.round(initialDealVal * 0.05),
        notes: 'Token booking discount applied.',
      });
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  // When selected lead changes, intelligently auto-populate project, exec, unit, and budget
  const handleLeadChange = (leadIdNum: number) => {
    const lead = leads.find((l) => l.id === leadIdNum);
    if (lead) {
      if (lead.preferred_project_id) {
        setValue('project_id', lead.preferred_project_id);
      }
      if (lead.assigned_to_id) {
        setValue('assigned_executive_id', lead.assigned_to_id);
      }
      const rawBudget = lead.budget_max || lead.budget_min;
      if (rawBudget) {
        const dealVal = rawBudget <= 1000 ? rawBudget * 100000 : rawBudget;
        setValue('total_deal_value', dealVal);
        setValue('booking_amount', Math.round(dealVal * 0.05));
      }
      if (lead.preferred_configuration) {
        setValue('unit_number', `${lead.preferred_configuration} - Unit ${Math.floor(100 + Math.random() * 900)}`);
      }
    }
  };

  const onFormSubmit = async (data: BookingCreateInput) => {
    setSubmitError(null);
    try {
      let dealVal = Number(data.total_deal_value);
      if (dealVal <= 1000) {
        dealVal = dealVal * 100000;
      }

      let bookingAmt = Number(data.booking_amount);
      if (bookingAmt <= 100) {
        bookingAmt = bookingAmt * 100000;
      }

      const payload = {
        ...data,
        lead_id: Number(data.lead_id),
        project_id: Number(data.project_id),
        assigned_executive_id: Number(data.assigned_executive_id),
        broker_id: data.broker_id ? Number(data.broker_id) : undefined,
        total_deal_value: dealVal,
        booking_amount: bookingAmt,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error('Booking submission error:', err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'Failed to create property booking. Please verify all details.';
      setSubmitError(msg);
    }
  };

  const leadOptions = leads.map((l) => {
    const budgetStr = l.budget_max || l.budget_min ? ` (Budget: ₹${l.budget_min || 0}L - ₹${l.budget_max || 0}L)` : '';
    return { label: `${l.name} - ${l.phone}${budgetStr}`, value: l.id };
  });

  const projectOptions = projects.map((p) => ({
    label: `${p.name} (₹${p.min_price}L - ₹${p.max_price}L, ${p.location})`,
    value: p.id,
  }));

  const execOptions = executives.map((e) => ({ label: `${e.name} (${e.role})`, value: e.id }));
  const brokerOptions = [
    { label: '-- Direct Deal (No External Broker) --', value: '' },
    ...brokers.map((b) => ({ label: `${b.firm_name} (${b.contact_person} • ${b.commission_rate}% Comm)`, value: b.id })),
  ];

  // Formatted representations for live user comfort
  const normalizedDealVal = Number(watchedDealValue) <= 1000 ? Number(watchedDealValue) * 100000 : Number(watchedDealValue);
  const normalizedTokenAmt = Number(watchedTokenAmount) <= 100 ? Number(watchedTokenAmount) * 100000 : Number(watchedTokenAmount);

  const formatLakhsCr = (val: number) => {
    if (!val || val <= 0) return '₹0';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr (₹${(val / 100000).toFixed(2)} Lakhs)`;
    }
    return `₹${(val / 100000).toFixed(2)} Lakhs`;
  };

  const estimatedBuilderComm = (normalizedDealVal * 0.035).toLocaleString('en-IN');
  const estimatedExecComm = (normalizedDealVal * 0.005).toLocaleString('en-IN');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Property Booking"
      subtitle="Generate deal booking token matched with buyer's budget & automated commission split"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {submitError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between">
            <span>⚠️ {submitError}</span>
            <button type="button" onClick={() => setSubmitError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* Lead Details Highlight Card */}
        {selectedLead && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              <span className="font-semibold text-white">{selectedLead.name}</span>
              <span className="text-slate-400">({selectedLead.phone})</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <span>
                Customer Budget: <strong className="text-emerald-400">₹{selectedLead.budget_min || 0}L - ₹{selectedLead.budget_max || 0}L</strong>
              </span>
              {selectedLead.preferred_location && (
                <span>Location: <strong className="text-amber-300">{selectedLead.preferred_location}</strong></span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {leadOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Buyer Lead *</label>
              <select
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                {...register('lead_id', {
                  valueAsNumber: true,
                  required: 'Lead is required',
                  onChange: (e) => handleLeadChange(Number(e.target.value)),
                })}
              >
                {leadOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
              label="Closing Sales Executive *"
              options={execOptions}
              {...register('assigned_executive_id', { valueAsNumber: true, required: 'Executive required' })}
              error={errors.assigned_executive_id?.message}
            />
          )}
          <Select
            label="Sourcing Broker / Channel Partner (Optional)"
            options={brokerOptions}
            {...register('broker_id', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Unit / Flat Number *"
            placeholder="e.g. 2 BHK - Unit 402"
            {...register('unit_number', { required: 'Unit number required' })}
            error={errors.unit_number?.message}
          />
          <div>
            <Input
              label="Total Deal Value (INR) *"
              type="number"
              placeholder="3000000 (30 Lakhs)"
              {...register('total_deal_value', { valueAsNumber: true, required: 'Deal value required' })}
              error={errors.total_deal_value?.message}
            />
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              🏷️ Value: {formatLakhsCr(normalizedDealVal)}
            </p>
          </div>

          <div>
            <Input
              label="Token Booking Advance (INR) *"
              type="number"
              placeholder="150000 (1.5 Lakhs)"
              {...register('booking_amount', { valueAsNumber: true, required: 'Booking amount required' })}
              error={errors.booking_amount?.message}
            />
            <p className="text-[11px] text-blue-400 font-medium mt-1">
              💳 Token: ₹{normalizedTokenAmt.toLocaleString('en-IN')} ({normalizedDealVal > 0 ? ((normalizedTokenAmt / normalizedDealVal) * 100).toFixed(1) : 5}%)
            </p>
          </div>
        </div>

        {/* Live Commission Split Calculation Preview */}
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1 text-slate-200">
          <p className="font-semibold text-blue-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Automated Commission & Target Calculation Preview:
          </p>
          <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
            <span>• Estimated Builder Commission (3.5%): <strong className="text-emerald-400 font-semibold">₹{estimatedBuilderComm}</strong></span>
            <span>• Executive Incentive (0.5%): <strong className="text-blue-300 font-semibold">₹{estimatedExecComm}</strong></span>
          </div>
        </div>

        <Input label="Booking Remarks / Payment Notes" placeholder="e.g. Token ₹1,50,000 received via IMPS / Cheque #882910." {...register('notes')} />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm Property Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};

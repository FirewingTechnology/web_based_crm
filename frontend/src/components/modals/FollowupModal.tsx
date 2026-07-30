import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { FollowupCreateInput, FollowupType } from '../../types/followup';
import { Lead } from '../../types/lead';
import { User } from '../../types/user';

interface FollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FollowupCreateInput) => Promise<void>;
  preselectedLead?: Lead | null;
  leads?: Lead[];
  executives?: User[];
}

const getLocalISOString = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const FollowupModal: React.FC<FollowupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedLead,
  leads = [],
  executives = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FollowupCreateInput>();

  useEffect(() => {
    if (isOpen) {
      const defaultDate = new Date();
      defaultDate.setMinutes(defaultDate.getMinutes() + 10);
      const localIso = getLocalISOString(defaultDate);

      reset({
        lead_id: preselectedLead ? preselectedLead.id : leads[0]?.id || 1,
        assigned_to_id: preselectedLead?.assigned_to_id || executives[0]?.id || 1,
        type: 'Call',
        title: preselectedLead ? `Followup with ${preselectedLead.name}` : 'Client Followup Task',
        scheduled_at: localIso,
        notes: '',
      });
    }
  }, [isOpen, preselectedLead]);

  const onFormSubmit = async (data: FollowupCreateInput) => {
    await onSubmit(data);
    onClose();
  };

  const typeOptions = [
    { label: 'Phone Call', value: 'Call' },
    { label: 'WhatsApp Message', value: 'WhatsApp' },
    { label: 'In-person Meeting', value: 'Meeting' },
    { label: 'Site Visit Scheduled', value: 'Site Visit' },
    { label: 'General Task', value: 'Task' },
    { label: 'Reminder', value: 'Reminder' },
  ];

  const leadOptions = leads.map((l) => ({ label: `${l.name} (${l.phone})`, value: l.id }));
  const execOptions = executives.map((e) => ({ label: `${e.name} (${e.role})`, value: e.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Followup Task"
      subtitle="Set call reminders or site visit logistics for buyers"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {!preselectedLead && leadOptions.length > 0 && (
          <Select
            label="Select Lead *"
            options={leadOptions}
            {...register('lead_id', { valueAsNumber: true, required: 'Select a lead' })}
            error={errors.lead_id?.message}
          />
        )}

        <Input
          label="Followup Title *"
          placeholder="e.g. Call to discuss pricing structure"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Followup Type" options={typeOptions} {...register('type')} />
          <Input
            label="Scheduled Date & Time *"
            type="datetime-local"
            {...register('scheduled_at', { required: 'Scheduled date is required' })}
            error={errors.scheduled_at?.message}
          />
        </div>

        {execOptions.length > 0 && (
          <Select
            label="Assigned Executive"
            options={execOptions}
            {...register('assigned_to_id', { valueAsNumber: true })}
          />
        )}

        <Input
          label="Notes / Agenda"
          placeholder="e.g. Share floorplan PDF & check loan eligibility."
          {...register('notes')}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Schedule Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

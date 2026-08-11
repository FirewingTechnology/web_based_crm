import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Lead, LeadCreateInput } from '../../types/lead';
import { User } from '../../types/user';
import { Project } from '../../types/project';
import { projectsApi } from '../../api/projects';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadCreateInput) => Promise<void>;
  initialLead?: Lead | null;
  executives?: User[];
  projects?: Project[];
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialLead,
  executives = [],
  projects = [],
}) => {
  const [projectList, setProjectList] = useState<Project[]>(projects);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadCreateInput>();

  useEffect(() => {
    if (isOpen) {
      projectsApi.getProjects().then((data) => {
        if (data && data.length > 0) {
          setProjectList(data);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialLead) {
      reset({
        name: initialLead.name,
        phone: initialLead.phone,
        email: initialLead.email,
        source: initialLead.source,
        status: initialLead.status,
        priority: initialLead.priority,
        budget_min: initialLead.budget_min,
        budget_max: initialLead.budget_max,
        preferred_location: initialLead.preferred_location,
        preferred_configuration: initialLead.preferred_configuration,
        preferred_project_id: initialLead.preferred_project_id,
        assigned_to_id: initialLead.assigned_to_id,
        tags: initialLead.tags,
      });
    } else {
      reset({
        name: '',
        phone: '',
        email: '',
        source: 'Direct',
        status: 'New',
        priority: 'Medium',
        budget_min: 50,
        budget_max: 150,
        preferred_location: '',
        preferred_configuration: '3 BHK',
        preferred_project_id: null,
        tags: 'High Intent',
      });
    }
  }, [initialLead, isOpen, reset]);

  const onFormSubmit = async (data: LeadCreateInput) => {
    const payload = {
      ...data,
      preferred_project_id: data.preferred_project_id ? Number(data.preferred_project_id) : null,
      assigned_to_id: data.assigned_to_id ? Number(data.assigned_to_id) : null,
    };
    await onSubmit(payload);
    onClose();
  };

  const statusOptions = [
    { label: 'New', value: 'New' },
    { label: 'Contacted', value: 'Contacted' },
    { label: 'Qualified', value: 'Qualified' },
    { label: 'Site Visit Scheduled', value: 'Site Visit Scheduled' },
    { label: 'Negotiation', value: 'Negotiation' },
    { label: 'Booked', value: 'Booked' },
    { label: 'Lost', value: 'Lost' },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

  const sourceOptions = [
    { label: 'Direct', value: 'Direct' },
    { label: 'Referral', value: 'Referral' },
    { label: '99acres', value: '99acres' },
    { label: 'MagicBricks', value: 'MagicBricks' },
    { label: 'Facebook Ads', value: 'Facebook Ads' },
    { label: 'Google Search', value: 'Google Search' },
    { label: 'Walk-in', value: 'Walk-in' },
  ];

  const execOptions = [
    { label: '-- Select Executive --', value: '' },
    ...executives.map((e) => ({ label: `${e.name} (${e.role})`, value: e.id })),
  ];

  const projectOptions = [
    { label: '-- Select Interested Project --', value: '' },
    ...projectList.map((p) => ({ label: `${p.name} (${p.builder_name || 'Builder'})`, value: p.id })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialLead ? 'Edit Lead Details' : 'Add New Real Estate Lead'}
      subtitle="Fill in buyer requirements and assignment details"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Lead Full Name *"
            placeholder="e.g. Rahul Sharma"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Phone Number *"
            placeholder="10-digit mobile number (e.g. 9876543210)"
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: 'Enter a valid 10-digit Indian mobile number starting with 6-9'
              }
            })}
            error={errors.phone?.message}
          />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            placeholder="rahul@example.com"
            {...register('email')}
          />
          <Select label="Lead Source" options={sourceOptions} {...register('source')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Lead Status" options={statusOptions} {...register('status')} />
          <Select label="Priority Level" options={priorityOptions} {...register('priority')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Interested Project"
            options={projectOptions}
            {...register('preferred_project_id', { valueAsNumber: true })}
          />
          <Input
            label="Preferred Location"
            placeholder="e.g. Sector 43, Noida"
            {...register('preferred_location')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Min Budget (in Lakhs INR)"
            type="number"
            placeholder="50"
            {...register('budget_min', { valueAsNumber: true })}
          />
          <Input
            label="Max Budget (in Lakhs INR)"
            type="number"
            placeholder="150"
            {...register('budget_max', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Preferred Configuration"
            placeholder="e.g. 2, 3 BHK Apartments"
            {...register('preferred_configuration')}
          />
          <Select
            label="Assign Executive"
            options={execOptions}
            {...register('assigned_to_id', { valueAsNumber: true })}
          />
        </div>

        <Input
          label="Tags (Comma Separated)"
          placeholder="e.g. VIP, NRI, Ready Buyer"
          {...register('tags')}
        />

        {!initialLead && (
          <Input
            label="Initial Note / Buyer Remarks"
            placeholder="e.g. Client interested in East facing flat with forest view."
            {...register('initial_note')}
          />
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialLead ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

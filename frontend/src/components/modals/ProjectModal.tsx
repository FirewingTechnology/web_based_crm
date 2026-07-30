import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Project, ProjectCreateInput } from '../../types/project';
import { Builder } from '../../types/builder';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectCreateInput) => Promise<void>;
  initialProject?: Project | null;
  builders?: Builder[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
  builders = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreateInput>();

  const watchedBuilderId = watch('builder_id');

  useEffect(() => {
    if (initialProject) {
      reset({
        name: initialProject.name,
        builder_id: initialProject.builder_id,
        location: initialProject.location,
        configuration: initialProject.configuration,
        min_price: initialProject.min_price,
        max_price: initialProject.max_price,
        possession_date: initialProject.possession_date,
        rera_id: initialProject.rera_id,
        status: initialProject.status,
        amenities: initialProject.amenities,
        brochure_url: initialProject.brochure_url,
        description: initialProject.description,
      });
    } else {
      reset({
        name: '',
        builder_id: builders[0]?.id || undefined,
        location: '',
        configuration: '2, 3 BHK Apartments',
        min_price: 100,
        max_price: 250,
        possession_date: 'Dec 2027',
        rera_id: '',
        status: 'Under Construction',
        amenities: 'Clubhouse, Swimming Pool, Gym, EV Charging',
        brochure_url: '',
        description: '',
      });
    }
  }, [initialProject, isOpen, builders, reset]);

  const onFormSubmit = async (data: ProjectCreateInput) => {
    const payload = {
      ...data,
      builder_id: (data.builder_id && String(data.builder_id) !== 'NEW') ? Number(data.builder_id) : undefined,
    };
    await onSubmit(payload as any);
    onClose();
  };

  const builderOptions = builders.map((b) => ({ label: b.name, value: b.id }));

  const statusOptions = [
    { label: 'Under Construction', value: 'Under Construction' },
    { label: 'Ready to Move', value: 'Ready to Move' },
    { label: 'New Launch', value: 'New Launch' },
    { label: 'Sold Out', value: 'Sold Out' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProject ? 'Edit Project Details' : 'Add New Real Estate Project'}
      subtitle="Register project specs, pricing tiers, RERA ID & amenities"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Project Name *"
            placeholder="e.g. Godrej Woods / Avinash Towers"
            {...register('name', { required: 'Project name is required' })}
            error={errors.name?.message}
          />
          {builders.length > 0 ? (
            <Select
              label="Associated Builder *"
              options={[
                ...builderOptions,
                { label: '➕ Add New Builder / Developer', value: 'NEW' },
              ]}
              {...register('builder_id')}
            />
          ) : (
            <Input
              label="Builder / Developer Name *"
              placeholder="e.g. Avinash Developers / Godrej Properties"
              {...register('new_builder_name', { required: 'Builder name is required' })}
              error={errors.new_builder_name?.message}
            />
          )}
        </div>

        {builders.length > 0 && String(watchedBuilderId) === 'NEW' && (
          <Input
            label="New Builder / Developer Name *"
            placeholder="e.g. Avinash Developers / Godrej Properties"
            {...register('new_builder_name', { required: 'Builder name is required' })}
            error={errors.new_builder_name?.message}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Location / Landmark *"
            placeholder="e.g. Sector 43, Noida"
            {...register('location', { required: 'Location is required' })}
            error={errors.location?.message}
          />
          <Input
            label="Configurations *"
            placeholder="e.g. 2, 3 & 4 BHK Apartments"
            {...register('configuration', { required: 'Configuration is required' })}
            error={errors.configuration?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Min Price (Lakhs INR) *"
            type="number"
            placeholder="100"
            {...register('min_price', { valueAsNumber: true, required: 'Min price is required' })}
            error={errors.min_price?.message}
          />
          <Input
            label="Max Price (Lakhs INR) *"
            type="number"
            placeholder="250"
            {...register('max_price', { valueAsNumber: true, required: 'Max price is required' })}
            error={errors.max_price?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Possession Date"
            placeholder="e.g. Dec 2027 or Ready to Move"
            {...register('possession_date')}
          />
          <Input
            label="RERA Registration ID"
            placeholder="e.g. UPRERAPRJ7712"
            {...register('rera_id')}
          />
          <Select label="Construction Status" options={statusOptions} {...register('status')} />
        </div>

        <Input
          label="Amenities (Comma Separated)"
          placeholder="e.g. Forest Trail, Swimming Pool, Clubhouse, Tennis Court"
          {...register('amenities')}
        />

        <Input
          label="Brochure PDF Link"
          placeholder="https://example.com/brochure.pdf"
          {...register('brochure_url')}
        />

        <Input
          label="Description / Marketing Highlights"
          placeholder="e.g. Luxury urban forest residence surrounded by 1000+ trees."
          {...register('description')}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialProject ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

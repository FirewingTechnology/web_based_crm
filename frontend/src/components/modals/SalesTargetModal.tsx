import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { SalesTarget, SalesTargetCreateInput } from '../../types/sales';
import { User } from '../../types/user';

interface SalesTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalesTargetCreateInput) => Promise<void>;
  initialTarget?: SalesTarget | null;
  executives?: User[];
}

export const SalesTargetModal: React.FC<SalesTargetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTarget,
  executives = [],
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalesTargetCreateInput>();

  useEffect(() => {
    if (isOpen) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (initialTarget) {
        reset({
          user_id: initialTarget.user_id,
          month_year: initialTarget.month_year,
          target_amount: initialTarget.target_amount,
          target_bookings: initialTarget.target_bookings,
        });
      } else {
        reset({
          user_id: executives[0]?.id || 1,
          month_year: currentMonth,
          target_amount: 300, // 3 Crores
          target_bookings: 3,
        });
      }
    }
  }, [isOpen, initialTarget]);

  const onFormSubmit = async (data: SalesTargetCreateInput) => {
    await onSubmit(data);
    onClose();
  };

  const execOptions = executives.map((e) => ({ label: `${e.name} (${e.role})`, value: e.id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTarget ? 'Edit Sales Target' : 'Assign Monthly Sales Target'}
      subtitle="Set revenue & booking targets for sales executives"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {execOptions.length > 0 && (
          <Select
            label="Sales Executive *"
            options={execOptions}
            {...register('user_id', { valueAsNumber: true, required: 'Executive is required' })}
            error={errors.user_id?.message}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Target Month (YYYY-MM) *"
            placeholder="e.g. 2026-07"
            {...register('month_year', { required: 'Month is required' })}
            error={errors.month_year?.message}
          />
          <Input
            label="Revenue Target (Lakhs INR) *"
            type="number"
            placeholder="300"
            {...register('target_amount', { valueAsNumber: true, required: 'Revenue target required' })}
            error={errors.target_amount?.message}
          />
        </div>

        <Input
          label="Target Bookings Count *"
          type="number"
          placeholder="4"
          {...register('target_bookings', { valueAsNumber: true, required: 'Bookings target required' })}
          error={errors.target_bookings?.message}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialTarget ? 'Save Changes' : 'Assign Target'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

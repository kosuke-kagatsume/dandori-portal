import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import {
  familyInfoFormInputSchema,
  type FamilyInfoFormInput,
} from '@/lib/validation/onboarding-schemas';

/**
 * useFamilyInfoForm Hook
 *
 * Custom hook for managing Family Info Form state
 * Features:
 * - React Hook Form integration
 * - Zod validation
 * - Auto-save to Zustand store
 * - Real-time validation
 */
export function useFamilyInfoForm() {
  const { familyInfoForm, updateFamilyInfoForm, submitFamilyInfoForm } =
    useOnboardingStore();

  // Initialize React Hook Form with Zod validation
  const form = useForm<FamilyInfoFormInput>({
    resolver: zodResolver(familyInfoFormInputSchema),
    defaultValues: familyInfoForm || {},
    mode: 'onBlur', // Validate on blur for better UX
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    control,
  } = form;

  // Watch all form values for auto-save
  const formValues = watch();

  // Auto-save when form values change
  useEffect(() => {
    if (isDirty && familyInfoForm) {
      const timer = setTimeout(() => {
        updateFamilyInfoForm(formValues);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [formValues, isDirty, familyInfoForm, updateFamilyInfoForm]);

  // Reset form when familyInfoForm changes (e.g., after submission)
  useEffect(() => {
    if (familyInfoForm) {
      reset(familyInfoForm);
    }
  }, [familyInfoForm, reset]);

  // Handle form submission
  const onSubmit = async (data: FamilyInfoFormInput) => {
    try {
      updateFamilyInfoForm(data);
      await submitFamilyInfoForm();
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    formState: form.formState,
    watch,
    control, // For react-hook-form Controller
  };
}

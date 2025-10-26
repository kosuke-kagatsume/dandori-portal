import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import {
  basicInfoFormInputSchema,
  type BasicInfoFormInput,
} from '@/lib/validation/onboarding-schemas';

// Re-export type for external use
export type { BasicInfoFormInput };

/**
 * useBasicInfoForm Hook
 *
 * Custom hook for managing Basic Info Form state
 * Features:
 * - React Hook Form integration
 * - Zod validation
 * - Auto-save to Zustand store
 * - Real-time validation
 */
export function useBasicInfoForm() {
  const { basicInfoForm, updateBasicInfoForm, submitBasicInfoForm } =
    useOnboardingStore();

  // Initialize React Hook Form with Zod validation
  const form = useForm<BasicInfoFormInput>({
    resolver: zodResolver(basicInfoFormInputSchema),
    defaultValues: basicInfoForm || {},
    mode: 'onBlur', // Validate on blur for better UX
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
  } = form;

  // Watch all form values for auto-save
  const formValues = watch();

  // Auto-save when form values change
  useEffect(() => {
    if (isDirty && basicInfoForm) {
      const timer = setTimeout(() => {
        updateBasicInfoForm(formValues);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [formValues, isDirty, basicInfoForm, updateBasicInfoForm]);

  // Reset form when basicInfoForm changes (e.g., after submission)
  useEffect(() => {
    if (basicInfoForm) {
      reset(basicInfoForm);
    }
  }, [basicInfoForm, reset]);

  return {
    register,
    handleSubmit,
    errors,
    formState: form.formState,
    watch,
    // Expose store methods for use in page-level onSubmit
    updateForm: updateBasicInfoForm,
    submitForm: submitBasicInfoForm,
  };
}

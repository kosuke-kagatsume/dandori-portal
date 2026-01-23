import { useEffect } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import {
  commuteRouteFormInputSchema,
  type CommuteRouteFormInput,
} from '@/lib/validation/onboarding-schemas';

// Re-export type for external use
export type { CommuteRouteFormInput };

// Type-safe resolver for Zod schema
const resolver = zodResolver(commuteRouteFormInputSchema) as Resolver<CommuteRouteFormInput>;

/**
 * useCommuteRouteForm Hook
 *
 * Custom hook for managing Commute Route Form state
 * Features:
 * - React Hook Form integration
 * - Zod validation
 * - Auto-save to Zustand store
 * - Real-time validation
 */
export function useCommuteRouteForm() {
  const { commuteRouteForm, updateCommuteRouteForm, submitCommuteRouteForm } =
    useOnboardingStore();

  // Initialize React Hook Form with Zod validation
  const form = useForm<CommuteRouteFormInput>({
    resolver,
    defaultValues: (commuteRouteForm || {}) as CommuteRouteFormInput,
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
    if (isDirty && commuteRouteForm) {
      const timer = setTimeout(() => {
        updateCommuteRouteForm(formValues as Partial<CommuteRouteFormInput>);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [formValues, isDirty, commuteRouteForm, updateCommuteRouteForm]);

  // Reset form when commuteRouteForm changes (e.g., after submission)
  useEffect(() => {
    if (commuteRouteForm) {
      reset(commuteRouteForm as CommuteRouteFormInput);
    }
  }, [commuteRouteForm, reset]);

  return {
    register,
    handleSubmit,
    errors,
    formState: form.formState,
    watch,
    // Expose store methods for use in page-level onSubmit
    updateForm: updateCommuteRouteForm,
    submitForm: submitCommuteRouteForm,
  };
}

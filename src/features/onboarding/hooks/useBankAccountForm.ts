import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import {
  bankAccountFormInputSchema,
  type BankAccountFormInput,
} from '@/lib/validation/onboarding-schemas';

/**
 * useBankAccountForm Hook
 *
 * Custom hook for managing Bank Account Form state
 * Features:
 * - React Hook Form integration
 * - Zod validation
 * - Auto-save to Zustand store
 * - Real-time validation
 */
export function useBankAccountForm() {
  const { bankAccountForm, updateBankAccountForm, submitBankAccountForm } =
    useOnboardingStore();

  // Initialize React Hook Form with Zod validation
  const form = useForm<BankAccountFormInput>({
    resolver: zodResolver(bankAccountFormInputSchema),
    defaultValues: bankAccountForm || {},
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
    if (isDirty && bankAccountForm) {
      const timer = setTimeout(() => {
        updateBankAccountForm(formValues);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [formValues, isDirty, bankAccountForm, updateBankAccountForm]);

  // Reset form when bankAccountForm changes (e.g., after submission)
  useEffect(() => {
    if (bankAccountForm) {
      reset(bankAccountForm);
    }
  }, [bankAccountForm, reset]);

  return {
    register,
    handleSubmit,
    errors,
    formState: form.formState,
    watch,
    // Expose store methods for use in page-level onSubmit
    updateForm: updateBankAccountForm,
    submitForm: submitBankAccountForm,
  };
}

/**
 * Onboarding Store
 *
 * Zustand store for managing onboarding application state
 * Features:
 * - State management for 4 forms
 * - Auto-save functionality (every 30 seconds)
 * - LocalStorage persistence (dev) / Supabase (prod)
 * - Progress tracking
 * - Form submission/approval flow
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  OnboardingApplication,
  BasicInfoForm,
  FamilyInfoForm,
  BankAccountForm,
  CommuteRouteForm,
  OnboardingStatus,
  FormStatus,
  OnboardingProgress,
} from '@/types/onboarding';

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface OnboardingState {
  // Current application
  application: OnboardingApplication | null;

  // 4 Forms
  basicInfoForm: BasicInfoForm | null;
  familyInfoForm: FamilyInfoForm | null;
  bankAccountForm: BankAccountForm | null;
  commuteRouteForm: CommuteRouteForm | null;

  // Auto-save state
  isAutoSaving: boolean;
  lastSavedAt: string | null;
  autoSaveIntervalId: NodeJS.Timeout | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;

  // Error state
  error: string | null;
}

interface OnboardingActions {
  // Application actions
  initializeApplication: (application: OnboardingApplication) => void;
  loadApplication: (applicationId: string) => Promise<void>;
  updateApplicationStatus: (status: OnboardingStatus) => void;
  clearApplication: () => void;

  // Basic Info Form actions
  initializeBasicInfoForm: (form: BasicInfoForm) => void;
  updateBasicInfoForm: (updates: Partial<BasicInfoForm>) => void;
  submitBasicInfoForm: () => Promise<void>;

  // Family Info Form actions
  initializeFamilyInfoForm: (form: FamilyInfoForm) => void;
  updateFamilyInfoForm: (updates: Partial<FamilyInfoForm>) => void;
  submitFamilyInfoForm: () => Promise<void>;

  // Bank Account Form actions
  initializeBankAccountForm: (form: BankAccountForm) => void;
  updateBankAccountForm: (updates: Partial<BankAccountForm>) => void;
  submitBankAccountForm: () => Promise<void>;

  // Commute Route Form actions
  initializeCommuteRouteForm: (form: CommuteRouteForm) => void;
  updateCommuteRouteForm: (updates: Partial<CommuteRouteForm>) => void;
  submitCommuteRouteForm: () => Promise<void>;

  // Auto-save actions
  startAutoSave: () => void;
  stopAutoSave: () => void;
  saveAllForms: () => Promise<void>;

  // Progress tracking
  getProgress: () => OnboardingProgress;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetStore: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: OnboardingState = {
  application: null,
  basicInfoForm: null,
  familyInfoForm: null,
  bankAccountForm: null,
  commuteRouteForm: null,
  isAutoSaving: false,
  lastSavedAt: null,
  autoSaveIntervalId: null,
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
  error: null,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate form completion percentage
 */
function calculateFormProgress(form: any, totalFields: number): number {
  if (!form) return 0;

  let completedFields = 0;
  const checkField = (value: any): boolean => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };

  Object.entries(form).forEach(([key, value]) => {
    if (
      key !== 'id' &&
      key !== 'applicationId' &&
      key !== 'status' &&
      key !== 'savedAt' &&
      key !== 'submittedAt' &&
      key !== 'reviewComment' &&
      key !== 'returnedAt' &&
      key !== 'approvedAt' &&
      key !== 'approvedBy'
    ) {
      if (checkField(value)) completedFields++;
    }
  });

  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Get form status
 */
function getFormStatus(form: any): FormStatus {
  if (!form) return 'draft';
  return form.status || 'draft';
}

/**
 * Calculate days until deadline
 */
function calculateDaysUntilDeadline(deadline: string): number {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * API call to save form data (placeholder)
 * TODO: Replace with actual API call to Supabase
 */
async function saveFormToAPI(formType: string, formData: any): Promise<void> {
  // Development: Save to localStorage
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(`onboarding_${formType}_${formData.id}`, JSON.stringify(formData));
    return;
  }

  // Production: Save to Supabase
  // const response = await fetch(`/api/onboarding/${formType}/${formData.id}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(formData),
  // });
  // if (!response.ok) throw new Error('Failed to save form');
}

/**
 * API call to submit form (placeholder)
 * TODO: Replace with actual API call
 */
async function submitFormToAPI(formType: string, formId: string): Promise<void> {
  // Development: Update localStorage
  if (process.env.NODE_ENV === 'development') {
    const key = `onboarding_${formType}_${formId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const form = JSON.parse(data);
      form.status = 'submitted';
      form.submittedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(form));
    }
    return;
  }

  // Production: Submit to API
  // const response = await fetch(`/api/onboarding/${formType}/${formId}/submit`, {
  //   method: 'POST',
  // });
  // if (!response.ok) throw new Error('Failed to submit form');
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // Application Actions
      // ========================================================================

      initializeApplication: (application) => {
        set({ application });
      },

      loadApplication: async (applicationId) => {
        set({ isLoading: true, error: null });

        try {
          // Development: Load from localStorage
          if (process.env.NODE_ENV === 'development') {
            const appData = localStorage.getItem(`onboarding_application_${applicationId}`);
            const basicData = localStorage.getItem(`onboarding_basic_info_${applicationId}`);
            const familyData = localStorage.getItem(`onboarding_family_info_${applicationId}`);
            const bankData = localStorage.getItem(`onboarding_bank_account_${applicationId}`);
            const commuteData = localStorage.getItem(`onboarding_commute_route_${applicationId}`);

            set({
              application: appData ? JSON.parse(appData) : null,
              basicInfoForm: basicData ? JSON.parse(basicData) : null,
              familyInfoForm: familyData ? JSON.parse(familyData) : null,
              bankAccountForm: bankData ? JSON.parse(bankData) : null,
              commuteRouteForm: commuteData ? JSON.parse(commuteData) : null,
              isLoading: false,
            });
            return;
          }

          // Production: Load from API
          // const response = await fetch(`/api/onboarding/${applicationId}`);
          // if (!response.ok) throw new Error('Failed to load application');
          // const data = await response.json();
          // set({
          //   application: data.application,
          //   basicInfoForm: data.basicInfoForm,
          //   familyInfoForm: data.familyInfoForm,
          //   bankAccountForm: data.bankAccountForm,
          //   commuteRouteForm: data.commuteRouteForm,
          //   isLoading: false,
          // });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      updateApplicationStatus: (status) => {
        const { application } = get();
        if (!application) return;

        set({
          application: {
            ...application,
            status,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      clearApplication: () => {
        get().stopAutoSave();
        set({ ...initialState });
      },

      // ========================================================================
      // Basic Info Form Actions
      // ========================================================================

      initializeBasicInfoForm: (form) => {
        set({ basicInfoForm: form });
      },

      updateBasicInfoForm: (updates) => {
        const { basicInfoForm } = get();
        if (!basicInfoForm) return;

        set({
          basicInfoForm: {
            ...basicInfoForm,
            ...updates,
            savedAt: new Date().toISOString(),
          },
        });
      },

      submitBasicInfoForm: async () => {
        const { basicInfoForm } = get();
        if (!basicInfoForm) return;

        set({ isSubmitting: true, error: null });

        try {
          await submitFormToAPI('basic_info', basicInfoForm.id);
          set({
            basicInfoForm: {
              ...basicInfoForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit form',
            isSubmitting: false,
          });
        }
      },

      // ========================================================================
      // Family Info Form Actions
      // ========================================================================

      initializeFamilyInfoForm: (form) => {
        set({ familyInfoForm: form });
      },

      updateFamilyInfoForm: (updates) => {
        const { familyInfoForm } = get();
        if (!familyInfoForm) return;

        set({
          familyInfoForm: {
            ...familyInfoForm,
            ...updates,
            savedAt: new Date().toISOString(),
          },
        });
      },

      submitFamilyInfoForm: async () => {
        const { familyInfoForm } = get();
        if (!familyInfoForm) return;

        set({ isSubmitting: true, error: null });

        try {
          await submitFormToAPI('family_info', familyInfoForm.id);
          set({
            familyInfoForm: {
              ...familyInfoForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit form',
            isSubmitting: false,
          });
        }
      },

      // ========================================================================
      // Bank Account Form Actions
      // ========================================================================

      initializeBankAccountForm: (form) => {
        set({ bankAccountForm: form });
      },

      updateBankAccountForm: (updates) => {
        const { bankAccountForm } = get();
        if (!bankAccountForm) return;

        set({
          bankAccountForm: {
            ...bankAccountForm,
            ...updates,
            savedAt: new Date().toISOString(),
          },
        });
      },

      submitBankAccountForm: async () => {
        const { bankAccountForm } = get();
        if (!bankAccountForm) return;

        set({ isSubmitting: true, error: null });

        try {
          await submitFormToAPI('bank_account', bankAccountForm.id);
          set({
            bankAccountForm: {
              ...bankAccountForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit form',
            isSubmitting: false,
          });
        }
      },

      // ========================================================================
      // Commute Route Form Actions
      // ========================================================================

      initializeCommuteRouteForm: (form) => {
        set({ commuteRouteForm: form });
      },

      updateCommuteRouteForm: (updates) => {
        const { commuteRouteForm } = get();
        if (!commuteRouteForm) return;

        set({
          commuteRouteForm: {
            ...commuteRouteForm,
            ...updates,
            savedAt: new Date().toISOString(),
          },
        });
      },

      submitCommuteRouteForm: async () => {
        const { commuteRouteForm } = get();
        if (!commuteRouteForm) return;

        set({ isSubmitting: true, error: null });

        try {
          await submitFormToAPI('commute_route', commuteRouteForm.id);
          set({
            commuteRouteForm: {
              ...commuteRouteForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit form',
            isSubmitting: false,
          });
        }
      },

      // ========================================================================
      // Auto-save Actions
      // ========================================================================

      startAutoSave: () => {
        const { autoSaveIntervalId } = get();
        if (autoSaveIntervalId) return; // Already running

        const intervalId = setInterval(async () => {
          await get().saveAllForms();
        }, 30000); // 30 seconds

        set({ autoSaveIntervalId: intervalId, isAutoSaving: true });
      },

      stopAutoSave: () => {
        const { autoSaveIntervalId } = get();
        if (autoSaveIntervalId) {
          clearInterval(autoSaveIntervalId);
          set({ autoSaveIntervalId: null, isAutoSaving: false });
        }
      },

      saveAllForms: async () => {
        const {
          basicInfoForm,
          familyInfoForm,
          bankAccountForm,
          commuteRouteForm,
        } = get();

        set({ isSaving: true, error: null });

        try {
          const savePromises = [];

          if (basicInfoForm && basicInfoForm.status === 'draft') {
            savePromises.push(saveFormToAPI('basic_info', basicInfoForm));
          }
          if (familyInfoForm && familyInfoForm.status === 'draft') {
            savePromises.push(saveFormToAPI('family_info', familyInfoForm));
          }
          if (bankAccountForm && bankAccountForm.status === 'draft') {
            savePromises.push(saveFormToAPI('bank_account', bankAccountForm));
          }
          if (commuteRouteForm && commuteRouteForm.status === 'draft') {
            savePromises.push(saveFormToAPI('commute_route', commuteRouteForm));
          }

          await Promise.all(savePromises);

          set({
            isSaving: false,
            lastSavedAt: new Date().toISOString(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save forms',
            isSaving: false,
          });
        }
      },

      // ========================================================================
      // Progress Tracking
      // ========================================================================

      getProgress: () => {
        const {
          application,
          basicInfoForm,
          familyInfoForm,
          bankAccountForm,
          commuteRouteForm,
        } = get();

        if (!application) {
          return {
            applicationId: '',
            completedForms: 0,
            totalForms: 4,
            progressPercentage: 0,
            forms: [],
            daysUntilDeadline: 0,
          };
        }

        const forms = [
          {
            formType: 'basic_info' as const,
            name: '入社案内',
            status: getFormStatus(basicInfoForm),
            progress: calculateFormProgress(basicInfoForm, 39),
          },
          {
            formType: 'family_info' as const,
            name: '家族情報',
            status: getFormStatus(familyInfoForm),
            progress: calculateFormProgress(familyInfoForm, 10),
          },
          {
            formType: 'bank_account' as const,
            name: '給与振込口座',
            status: getFormStatus(bankAccountForm),
            progress: calculateFormProgress(bankAccountForm, 11),
          },
          {
            formType: 'commute_route' as const,
            name: '通勤経路',
            status: getFormStatus(commuteRouteForm),
            progress: calculateFormProgress(commuteRouteForm, 27),
          },
        ];

        const completedForms = forms.filter(
          (f) => f.status === 'submitted' || f.status === 'approved'
        ).length;

        const totalProgress =
          forms.reduce((sum, f) => sum + f.progress, 0) / forms.length;

        let nextAction: string | undefined;
        const draftForm = forms.find((f) => f.status === 'draft');
        const returnedForm = forms.find((f) => f.status === 'returned');

        if (returnedForm) {
          nextAction = `${returnedForm.name}を修正してください`;
        } else if (draftForm) {
          nextAction = `${draftForm.name}を入力してください`;
        } else if (completedForms === 4) {
          nextAction = 'すべて完了しました';
        }

        return {
          applicationId: application.id,
          completedForms,
          totalForms: 4,
          progressPercentage: Math.round(totalProgress),
          forms,
          nextAction,
          daysUntilDeadline: calculateDaysUntilDeadline(application.deadline),
        };
      },

      // ========================================================================
      // Utility Actions
      // ========================================================================

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      resetStore: () => {
        get().stopAutoSave();
        set({ ...initialState });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist necessary data (exclude auto-save interval)
        application: state.application,
        basicInfoForm: state.basicInfoForm,
        familyInfoForm: state.familyInfoForm,
        bankAccountForm: state.bankAccountForm,
        commuteRouteForm: state.commuteRouteForm,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);

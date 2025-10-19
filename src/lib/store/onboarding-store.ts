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
 * - API integration for production mode
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
import {
  getApplication,
  getBasicInfoForm,
  getFamilyInfoForm,
  getBankAccountForm,
  getCommuteRouteForm,
  submitBasicInfoForm as apiSubmitBasicInfoForm,
  submitFamilyInfoForm as apiSubmitFamilyInfoForm,
  submitBankAccountForm as apiSubmitBankAccountForm,
  submitCommuteRouteForm as apiSubmitCommuteRouteForm,
  updateBasicInfoForm as apiUpdateBasicInfoForm,
  updateFamilyInfoForm as apiUpdateFamilyInfoForm,
  updateBankAccountForm as apiUpdateBankAccountForm,
  updateCommuteRouteForm as apiUpdateCommuteRouteForm,
  approveBasicInfoForm as apiApproveBasicInfoForm,
  approveFamilyInfoForm as apiApproveFamilyInfoForm,
  approveBankAccountForm as apiApproveBankAccountForm,
  approveCommuteRouteForm as apiApproveCommuteRouteForm,
  returnBasicInfoForm as apiReturnBasicInfoForm,
  returnFamilyInfoForm as apiReturnFamilyInfoForm,
  returnBankAccountForm as apiReturnBankAccountForm,
  returnCommuteRouteForm as apiReturnCommuteRouteForm,
} from '@/lib/api/onboarding';
import { APIError } from '@/lib/api/client';

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

  // HR Admin actions (approval/return)
  approveForm: (formType: string, approvedBy: string) => void;
  returnForm: (formType: string, comment: string, returnedBy: string) => void;
  approveAllForms: (approvedBy: string) => void;

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
 * Check if running in demo mode
 */
function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * API call to save form data
 * Demo mode: Save to localStorage
 * Production mode: Save to API
 */
async function saveFormToAPI(formType: string, formData: any): Promise<void> {
  if (isDemoMode()) {
    // Demo mode: Save to localStorage
    localStorage.setItem(`onboarding_${formType}_${formData.id}`, JSON.stringify(formData));
    return;
  }

  // Production mode: Save to API
  try {
    const applicationId = formData.applicationId;

    switch (formType) {
      case 'basic_info':
        await apiUpdateBasicInfoForm(applicationId, formData);
        break;
      case 'family_info':
        await apiUpdateFamilyInfoForm(applicationId, formData);
        break;
      case 'bank_account':
        await apiUpdateBankAccountForm(applicationId, formData);
        break;
      case 'commute_route':
        await apiUpdateCommuteRouteForm(applicationId, formData);
        break;
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error [${error.status}]: ${error.message}`, error.details);
    }
    throw error;
  }
}

/**
 * API call to submit form
 * Demo mode: Update localStorage
 * Production mode: Submit to API
 */
async function submitFormToAPI(formType: string, formId: string, formData: any): Promise<void> {
  if (isDemoMode()) {
    // Demo mode: Update localStorage
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

  // Production mode: Submit to API
  try {
    const applicationId = formData.applicationId;

    switch (formType) {
      case 'basic_info':
        await apiSubmitBasicInfoForm(applicationId, formData);
        break;
      case 'family_info':
        await apiSubmitFamilyInfoForm(applicationId, formData);
        break;
      case 'bank_account':
        await apiSubmitBankAccountForm(applicationId, formData);
        break;
      case 'commute_route':
        await apiSubmitCommuteRouteForm(applicationId, formData);
        break;
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error [${error.status}]: ${error.message}`, error.details);
    }
    throw error;
  }
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
          if (isDemoMode()) {
            // Demo mode: Load from localStorage
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

          // Production mode: Load from API
          const application = await getApplication(applicationId);

          // Load all forms in parallel
          const [basicInfo, familyInfo, bankAccount, commuteRoute] = await Promise.allSettled([
            getBasicInfoForm(applicationId),
            getFamilyInfoForm(applicationId),
            getBankAccountForm(applicationId),
            getCommuteRouteForm(applicationId),
          ]);

          set({
            application,
            basicInfoForm: basicInfo.status === 'fulfilled' ? basicInfo.value : null,
            familyInfoForm: familyInfo.status === 'fulfilled' ? familyInfo.value : null,
            bankAccountForm: bankAccount.status === 'fulfilled' ? bankAccount.value : null,
            commuteRouteForm: commuteRoute.status === 'fulfilled' ? commuteRoute.value : null,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? `API Error: ${error.message}`
            : error instanceof Error
            ? error.message
            : 'Failed to load application';

          set({
            error: errorMessage,
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
          await submitFormToAPI('basic_info', basicInfoForm.id, basicInfoForm);

          // Update local state
          set({
            basicInfoForm: {
              ...basicInfoForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? `API Error: ${error.message}`
            : error instanceof Error
            ? error.message
            : 'Failed to submit form';

          set({
            error: errorMessage,
            isSubmitting: false,
          });
          throw error;
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
          await submitFormToAPI('family_info', familyInfoForm.id, familyInfoForm);

          // Update local state
          set({
            familyInfoForm: {
              ...familyInfoForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? `API Error: ${error.message}`
            : error instanceof Error
            ? error.message
            : 'Failed to submit form';

          set({
            error: errorMessage,
            isSubmitting: false,
          });
          throw error;
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
          await submitFormToAPI('bank_account', bankAccountForm.id, bankAccountForm);

          // Update local state
          set({
            bankAccountForm: {
              ...bankAccountForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? `API Error: ${error.message}`
            : error instanceof Error
            ? error.message
            : 'Failed to submit form';

          set({
            error: errorMessage,
            isSubmitting: false,
          });
          throw error;
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
          await submitFormToAPI('commute_route', commuteRouteForm.id, commuteRouteForm);

          // Update local state
          set({
            commuteRouteForm: {
              ...commuteRouteForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isSubmitting: false,
          });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? `API Error: ${error.message}`
            : error instanceof Error
            ? error.message
            : 'Failed to submit form';

          set({
            error: errorMessage,
            isSubmitting: false,
          });
          throw error;
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

      // ========================================================================
      // HR Admin Actions (Approval/Return)
      // ========================================================================

      approveForm: (formType, approvedBy) => {
        const now = new Date().toISOString();

        switch (formType) {
          case 'basic_info':
            const basicInfo = get().basicInfoForm;
            if (basicInfo) {
              set({
                basicInfoForm: {
                  ...basicInfo,
                  status: 'approved',
                  approvedAt: now,
                  approvedBy,
                },
              });
            }
            break;
          case 'family_info':
            const familyInfo = get().familyInfoForm;
            if (familyInfo) {
              set({
                familyInfoForm: {
                  ...familyInfo,
                  status: 'approved',
                  approvedAt: now,
                  approvedBy,
                },
              });
            }
            break;
          case 'bank_account':
            const bankAccount = get().bankAccountForm;
            if (bankAccount) {
              set({
                bankAccountForm: {
                  ...bankAccount,
                  status: 'approved',
                  approvedAt: now,
                  approvedBy,
                },
              });
            }
            break;
          case 'commute_route':
            const commuteRoute = get().commuteRouteForm;
            if (commuteRoute) {
              set({
                commuteRouteForm: {
                  ...commuteRoute,
                  status: 'approved',
                  approvedAt: now,
                  approvedBy,
                },
              });
            }
            break;
        }

        // Check if all forms are approved
        const state = get();
        const allApproved =
          state.basicInfoForm?.status === 'approved' &&
          state.familyInfoForm?.status === 'approved' &&
          state.bankAccountForm?.status === 'approved' &&
          state.commuteRouteForm?.status === 'approved';

        if (allApproved && state.application) {
          set({
            application: {
              ...state.application,
              status: 'approved',
              updatedAt: now,
            },
          });
        }
      },

      returnForm: (formType, comment, returnedBy) => {
        const now = new Date().toISOString();

        switch (formType) {
          case 'basic_info':
            const basicInfo = get().basicInfoForm;
            if (basicInfo) {
              set({
                basicInfoForm: {
                  ...basicInfo,
                  status: 'returned',
                  returnedAt: now,
                  reviewComment: comment,
                },
              });
            }
            break;
          case 'family_info':
            const familyInfo = get().familyInfoForm;
            if (familyInfo) {
              set({
                familyInfoForm: {
                  ...familyInfo,
                  status: 'returned',
                  returnedAt: now,
                  reviewComment: comment,
                },
              });
            }
            break;
          case 'bank_account':
            const bankAccount = get().bankAccountForm;
            if (bankAccount) {
              set({
                bankAccountForm: {
                  ...bankAccount,
                  status: 'returned',
                  returnedAt: now,
                  reviewComment: comment,
                },
              });
            }
            break;
          case 'commute_route':
            const commuteRoute = get().commuteRouteForm;
            if (commuteRoute) {
              set({
                commuteRouteForm: {
                  ...commuteRoute,
                  status: 'returned',
                  returnedAt: now,
                  reviewComment: comment,
                },
              });
            }
            break;
        }

        // Update application status to 'returned'
        const state = get();
        if (state.application) {
          set({
            application: {
              ...state.application,
              status: 'returned',
              updatedAt: now,
            },
          });
        }
      },

      approveAllForms: (approvedBy) => {
        const now = new Date().toISOString();
        const state = get();

        // Approve all forms
        if (state.basicInfoForm) {
          set({
            basicInfoForm: {
              ...state.basicInfoForm,
              status: 'approved',
              approvedAt: now,
              approvedBy,
            },
          });
        }
        if (state.familyInfoForm) {
          set({
            familyInfoForm: {
              ...state.familyInfoForm,
              status: 'approved',
              approvedAt: now,
              approvedBy,
            },
          });
        }
        if (state.bankAccountForm) {
          set({
            bankAccountForm: {
              ...state.bankAccountForm,
              status: 'approved',
              approvedAt: now,
              approvedBy,
            },
          });
        }
        if (state.commuteRouteForm) {
          set({
            commuteRouteForm: {
              ...state.commuteRouteForm,
              status: 'approved',
              approvedAt: now,
              approvedBy,
            },
          });
        }

        // Update application status
        if (state.application) {
          set({
            application: {
              ...state.application,
              status: 'approved',
              updatedAt: now,
            },
          });
        }
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

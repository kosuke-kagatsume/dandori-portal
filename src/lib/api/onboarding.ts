/**
 * Onboarding API Client
 *
 * API endpoints for onboarding forms and applications.
 * Provides type-safe methods for CRUD operations on:
 * - Onboarding applications
 * - Basic info forms
 * - Family info forms
 * - Bank account forms
 * - Commute route forms
 */

import { apiClient } from './client';
import type {
  OnboardingApplication,
  BasicInfoForm,
  FamilyInfoForm,
  BankAccountForm,
  CommuteRouteForm,
} from '@/types';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateApplicationRequest {
  applicantEmail: string;
  applicantName: string;
  hireDate: string;
  department?: string;
  position?: string;
}

export interface UpdateApplicationStatusRequest {
  status: 'draft' | 'submitted' | 'returned' | 'approved' | 'registered';
  comment?: string;
}

export interface SubmitFormRequest<T> {
  formData: T;
}

export interface ApproveFormRequest {
  comment?: string;
}

export interface ReturnFormRequest {
  comment: string;
  reason: string;
}

export interface ListApplicationsParams {
  status?: 'draft' | 'submitted' | 'returned' | 'approved' | 'registered';
  applicantEmail?: string;
  hireDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Onboarding Application API
// ============================================================================

/**
 * List all onboarding applications
 */
export async function listApplications(
  params?: ListApplicationsParams
): Promise<PaginatedResponse<OnboardingApplication>> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status);
  if (params?.applicantEmail) queryParams.append('applicantEmail', params.applicantEmail);
  if (params?.hireDate) queryParams.append('hireDate', params.hireDate);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  const endpoint = `/onboarding/applications${query ? `?${query}` : ''}`;

  return apiClient.get<PaginatedResponse<OnboardingApplication>>(endpoint);
}

/**
 * Get a single onboarding application by ID
 */
export async function getApplication(
  applicationId: string
): Promise<OnboardingApplication> {
  return apiClient.get<OnboardingApplication>(
    `/onboarding/applications/${applicationId}`
  );
}

/**
 * Create a new onboarding application
 */
export async function createApplication(
  data: CreateApplicationRequest
): Promise<OnboardingApplication> {
  return apiClient.post<OnboardingApplication, CreateApplicationRequest>(
    '/onboarding/applications',
    data
  );
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  data: UpdateApplicationStatusRequest
): Promise<OnboardingApplication> {
  return apiClient.patch<OnboardingApplication, UpdateApplicationStatusRequest>(
    `/onboarding/applications/${applicationId}/status`,
    data
  );
}

/**
 * Delete an application
 */
export async function deleteApplication(
  applicationId: string
): Promise<void> {
  return apiClient.delete(`/onboarding/applications/${applicationId}`);
}

// ============================================================================
// Basic Info Form API
// ============================================================================

/**
 * Get basic info form
 */
export async function getBasicInfoForm(
  applicationId: string
): Promise<BasicInfoForm> {
  return apiClient.get<BasicInfoForm>(
    `/onboarding/applications/${applicationId}/basic-info`
  );
}

/**
 * Submit basic info form
 */
export async function submitBasicInfoForm(
  applicationId: string,
  data: Partial<BasicInfoForm>
): Promise<BasicInfoForm> {
  return apiClient.post<BasicInfoForm, Partial<BasicInfoForm>>(
    `/onboarding/applications/${applicationId}/basic-info`,
    data
  );
}

/**
 * Update basic info form
 */
export async function updateBasicInfoForm(
  applicationId: string,
  data: Partial<BasicInfoForm>
): Promise<BasicInfoForm> {
  return apiClient.patch<BasicInfoForm, Partial<BasicInfoForm>>(
    `/onboarding/applications/${applicationId}/basic-info`,
    data
  );
}

/**
 * Approve basic info form
 */
export async function approveBasicInfoForm(
  applicationId: string,
  data?: ApproveFormRequest
): Promise<BasicInfoForm> {
  return apiClient.post<BasicInfoForm, ApproveFormRequest | undefined>(
    `/onboarding/applications/${applicationId}/basic-info/approve`,
    data
  );
}

/**
 * Return basic info form for revision
 */
export async function returnBasicInfoForm(
  applicationId: string,
  data: ReturnFormRequest
): Promise<BasicInfoForm> {
  return apiClient.post<BasicInfoForm, ReturnFormRequest>(
    `/onboarding/applications/${applicationId}/basic-info/return`,
    data
  );
}

// ============================================================================
// Family Info Form API
// ============================================================================

export async function getFamilyInfoForm(
  applicationId: string
): Promise<FamilyInfoForm> {
  return apiClient.get<FamilyInfoForm>(
    `/onboarding/applications/${applicationId}/family-info`
  );
}

export async function submitFamilyInfoForm(
  applicationId: string,
  data: Partial<FamilyInfoForm>
): Promise<FamilyInfoForm> {
  return apiClient.post<FamilyInfoForm, Partial<FamilyInfoForm>>(
    `/onboarding/applications/${applicationId}/family-info`,
    data
  );
}

export async function updateFamilyInfoForm(
  applicationId: string,
  data: Partial<FamilyInfoForm>
): Promise<FamilyInfoForm> {
  return apiClient.patch<FamilyInfoForm, Partial<FamilyInfoForm>>(
    `/onboarding/applications/${applicationId}/family-info`,
    data
  );
}

export async function approveFamilyInfoForm(
  applicationId: string,
  data?: ApproveFormRequest
): Promise<FamilyInfoForm> {
  return apiClient.post<FamilyInfoForm, ApproveFormRequest | undefined>(
    `/onboarding/applications/${applicationId}/family-info/approve`,
    data
  );
}

export async function returnFamilyInfoForm(
  applicationId: string,
  data: ReturnFormRequest
): Promise<FamilyInfoForm> {
  return apiClient.post<FamilyInfoForm, ReturnFormRequest>(
    `/onboarding/applications/${applicationId}/family-info/return`,
    data
  );
}

// ============================================================================
// Bank Account Form API
// ============================================================================

export async function getBankAccountForm(
  applicationId: string
): Promise<BankAccountForm> {
  return apiClient.get<BankAccountForm>(
    `/onboarding/applications/${applicationId}/bank-account`
  );
}

export async function submitBankAccountForm(
  applicationId: string,
  data: Partial<BankAccountForm>
): Promise<BankAccountForm> {
  return apiClient.post<BankAccountForm, Partial<BankAccountForm>>(
    `/onboarding/applications/${applicationId}/bank-account`,
    data
  );
}

export async function updateBankAccountForm(
  applicationId: string,
  data: Partial<BankAccountForm>
): Promise<BankAccountForm> {
  return apiClient.patch<BankAccountForm, Partial<BankAccountForm>>(
    `/onboarding/applications/${applicationId}/bank-account`,
    data
  );
}

export async function approveBankAccountForm(
  applicationId: string,
  data?: ApproveFormRequest
): Promise<BankAccountForm> {
  return apiClient.post<BankAccountForm, ApproveFormRequest | undefined>(
    `/onboarding/applications/${applicationId}/bank-account/approve`,
    data
  );
}

export async function returnBankAccountForm(
  applicationId: string,
  data: ReturnFormRequest
): Promise<BankAccountForm> {
  return apiClient.post<BankAccountForm, ReturnFormRequest>(
    `/onboarding/applications/${applicationId}/bank-account/return`,
    data
  );
}

// ============================================================================
// Commute Route Form API
// ============================================================================

export async function getCommuteRouteForm(
  applicationId: string
): Promise<CommuteRouteForm> {
  return apiClient.get<CommuteRouteForm>(
    `/onboarding/applications/${applicationId}/commute-route`
  );
}

export async function submitCommuteRouteForm(
  applicationId: string,
  data: Partial<CommuteRouteForm>
): Promise<CommuteRouteForm> {
  return apiClient.post<CommuteRouteForm, Partial<CommuteRouteForm>>(
    `/onboarding/applications/${applicationId}/commute-route`,
    data
  );
}

export async function updateCommuteRouteForm(
  applicationId: string,
  data: Partial<CommuteRouteForm>
): Promise<CommuteRouteForm> {
  return apiClient.patch<CommuteRouteForm, Partial<CommuteRouteForm>>(
    `/onboarding/applications/${applicationId}/commute-route`,
    data
  );
}

export async function approveCommuteRouteForm(
  applicationId: string,
  data?: ApproveFormRequest
): Promise<CommuteRouteForm> {
  return apiClient.post<CommuteRouteForm, ApproveFormRequest | undefined>(
    `/onboarding/applications/${applicationId}/commute-route/approve`,
    data
  );
}

export async function returnCommuteRouteForm(
  applicationId: string,
  data: ReturnFormRequest
): Promise<CommuteRouteForm> {
  return apiClient.post<CommuteRouteForm, ReturnFormRequest>(
    `/onboarding/applications/${applicationId}/commute-route/return`,
    data
  );
}

// ============================================================================
// File Upload API
// ============================================================================

/**
 * Upload a file for a form
 */
export async function uploadFormFile(
  applicationId: string,
  formType: 'basic-info' | 'family-info' | 'bank-account' | 'commute-route',
  file: File,
  fieldName: string
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fieldName', fieldName);

  return apiClient.upload<{ url: string; filename: string }>(
    `/onboarding/applications/${applicationId}/${formType}/upload`,
    formData
  );
}

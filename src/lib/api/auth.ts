/**
 * Authentication API Client
 *
 * API endpoints for authentication and authorization.
 * Provides type-safe methods for:
 * - Login/Logout
 * - Token management
 * - User session
 * - Password reset
 */

import { apiClient } from './client';
import type { User, UserRole } from '@/types';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  department?: string;
  position?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// ============================================================================
// Authentication API
// ============================================================================

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse, LoginRequest>(
    '/auth/login',
    data
  );

  // Store the access token in the API client
  apiClient.setToken(response.accessToken);

  return response;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  apiClient.setToken(null);
}

/**
 * Refresh access token
 */
export async function refreshToken(
  data: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<
    RefreshTokenResponse,
    RefreshTokenRequest
  >('/auth/refresh', data);

  // Update the access token in the API client
  apiClient.setToken(response.accessToken);

  return response;
}

/**
 * Register a new user
 */
export async function register(
  data: RegisterRequest
): Promise<LoginResponse> {
  return apiClient.post<LoginResponse, RegisterRequest>('/auth/register', data);
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/auth/me');
}

/**
 * Request password reset email
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }, ForgotPasswordRequest>(
    '/auth/forgot-password',
    data
  );
}

/**
 * Reset password with token
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }, ResetPasswordRequest>(
    '/auth/reset-password',
    data
  );
}

/**
 * Change password for authenticated user
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }, ChangePasswordRequest>(
    '/auth/change-password',
    data
  );
}

/**
 * Verify email with token
 */
export async function verifyEmail(
  data: VerifyEmailRequest
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }, VerifyEmailRequest>(
    '/auth/verify-email',
    data
  );
}

/**
 * Request new verification email
 */
export async function resendVerificationEmail(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/resend-verification');
}

// ============================================================================
// Role Management API (Admin only)
// ============================================================================

export interface UpdateUserRolesRequest {
  roles: UserRole[];
}

/**
 * Update user roles (Admin only)
 */
export async function updateUserRoles(
  userId: string,
  data: UpdateUserRolesRequest
): Promise<User> {
  return apiClient.patch<User, UpdateUserRolesRequest>(
    `/users/${userId}/roles`,
    data
  );
}

/**
 * Revoke user access (Admin only)
 */
export async function revokeUserAccess(userId: string): Promise<void> {
  return apiClient.post(`/users/${userId}/revoke-access`);
}

/**
 * Restore user access (Admin only)
 */
export async function restoreUserAccess(userId: string): Promise<void> {
  return apiClient.post(`/users/${userId}/restore-access`);
}

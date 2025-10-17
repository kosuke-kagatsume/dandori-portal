'use client';

import Link from 'next/link';
import { FormProgress, FormStatus } from '@/types/onboarding';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface FormCardProps {
  form: FormProgress;
  applicationId: string;
  locale: string;
}

/**
 * Form Card Component
 *
 * Displays individual form status and progress
 * Shows:
 * - Form name
 * - Status icon
 * - Progress percentage
 * - Action button
 */
export function FormCard({ form, applicationId, locale }: FormCardProps) {
  const { formType, name, status, progress } = form;

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircleIcon className="h-6 w-6" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: '承認済み',
        };
      case 'submitted':
        return {
          icon: <ClockIcon className="h-6 w-6" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: '提出済み',
        };
      case 'returned':
        return {
          icon: <ExclamationCircleIcon className="h-6 w-6" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: '差し戻し',
        };
      default:
        return {
          icon: <PencilIcon className="h-6 w-6" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: '未提出',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Get form URL based on form type
  const getFormUrl = () => {
    const baseUrl = `/${locale}/onboarding/${applicationId}`;
    switch (formType) {
      case 'basic_info':
        return `${baseUrl}/basic-info`;
      case 'family_info':
        return `${baseUrl}/family-info`;
      case 'bank_account':
        return `${baseUrl}/bank-account`;
      case 'commute_route':
        return `${baseUrl}/commute-route`;
      default:
        return baseUrl;
    }
  };

  // Determine if form is editable
  const isEditable = status === 'draft' || status === 'returned';

  // Get action button text
  const getButtonText = () => {
    if (status === 'approved') return '確認する';
    if (status === 'submitted') return '確認する';
    if (status === 'returned') return '修正する';
    return progress > 0 ? '続きを入力' : '入力開始';
  };

  return (
    <div
      className={`rounded-lg border ${statusDisplay.borderColor} ${statusDisplay.bgColor} p-6 transition-all hover:shadow-md`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={statusDisplay.color}>{statusDisplay.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <span className={`text-sm ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </div>
        </div>
        {isEditable && (
          <span className="text-sm font-medium text-gray-600">
            {progress}%
          </span>
        )}
      </div>

      {/* Progress bar (only for draft/returned) */}
      {isEditable && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Action button */}
      <Link
        href={getFormUrl()}
        className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          isEditable
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {getButtonText()}
      </Link>
    </div>
  );
}

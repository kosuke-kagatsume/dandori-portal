'use client';

import { OnboardingProgress } from '@/types/onboarding';

interface ProgressIndicatorProps {
  progress: OnboardingProgress;
}

/**
 * Progress Indicator Component
 *
 * Displays overall onboarding progress with visual indicator
 * Shows:
 * - Progress bar
 * - Percentage
 * - Completed forms count
 * - Days until deadline
 */
export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const { progressPercentage, completedForms, totalForms, daysUntilDeadline } =
    progress;

  // Determine deadline urgency color
  const getDeadlineColor = () => {
    if (daysUntilDeadline < 0) return 'text-red-600';
    if (daysUntilDeadline === 0) return 'text-orange-600';
    if (daysUntilDeadline <= 2) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // Determine progress bar color
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-600';
    if (progressPercentage >= 75) return 'bg-blue-600';
    if (progressPercentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">入社手続き進捗</h2>
        <span className="text-2xl font-bold text-gray-900">
          {progressPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {completedForms} / {totalForms} フォーム完了
        </span>
        <span className={`font-medium ${getDeadlineColor()}`}>
          {daysUntilDeadline < 0
            ? `期限超過 ${Math.abs(daysUntilDeadline)}日`
            : daysUntilDeadline === 0
              ? '本日が期限'
              : `残り${daysUntilDeadline}日`}
        </span>
      </div>
    </div>
  );
}

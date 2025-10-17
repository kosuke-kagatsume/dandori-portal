'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface NextActionCardProps {
  nextAction?: string;
  deadline: string;
}

/**
 * Next Action Card Component
 *
 * Displays the next recommended action for the user
 * Shows:
 * - Next action message
 * - Deadline information
 */
export function NextActionCard({ nextAction, deadline }: NextActionCardProps) {
  if (!nextAction) return null;

  // Format deadline date
  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <InformationCircleIcon className="h-6 w-6 flex-shrink-0 text-blue-600" />
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-blue-900">次のアクション</h3>
          <p className="mb-2 text-sm text-blue-800">{nextAction}</p>
          <p className="text-xs text-blue-600">
            提出期限: {formatDeadline(deadline)}
          </p>
        </div>
      </div>
    </div>
  );
}

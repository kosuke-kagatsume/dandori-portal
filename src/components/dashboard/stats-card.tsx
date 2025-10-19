/**
 * Stats Card Component
 *
 * Displays a KPI (Key Performance Indicator) card with:
 * - Title and value
 * - Icon
 * - Trend indicator
 * - Gradient background
 * - Optional loading state
 * - Optional click handler
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Trend text (e.g., "+12 先月比") */
  trend?: string;
  /** Trend direction for icon display */
  trendDirection?: 'up' | 'down';
  /** Icon component to display */
  icon: LucideIcon;
  /** Gradient color classes */
  gradient: string;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * StatsCard Component
 *
 * A reusable card component for displaying key statistics with icons and trends.
 */
export const StatsCard = memo<StatsCardProps>(({
  title,
  value,
  trend,
  trendDirection = 'up',
  icon: Icon,
  gradient,
  loading = false,
  onClick,
  className,
  'data-testid': testId,
}) => {
  const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;
  const trendColorClass = trendDirection === 'up' ? 'text-green-600' : 'text-red-600';

  if (loading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 shadow-lg bg-gradient-to-br',
          gradient,
          className
        )}
        data-testid={testId}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
          <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
            <div className="h-4 w-4 bg-white/20 rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 bg-white/20 rounded animate-pulse mb-2" />
          <div className="h-3 w-32 bg-white/20 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br',
        gradient,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      data-testid={testId}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={testId ? `${testId}-value` : undefined}>
          {typeof value === 'number' && value >= 1000
            ? value.toLocaleString('ja-JP')
            : value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1" data-testid={testId ? `${testId}-trend` : undefined}>
            <TrendIcon className={cn('h-3 w-3', trendColorClass)} aria-hidden="true" />
            <p className="text-xs">{trend}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

/**
 * StatsCard Component Tests
 *
 * Comprehensive test suite for the dashboard statistics card component
 * covering rendering, data display, loading states, and interactions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsCard } from './stats-card';
import { Users, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

describe('StatsCard', () => {
  // ============================================================
  // 1. Stat Card Component Rendering
  // ============================================================

  describe('Rendering', () => {
    it('renders with title, value, and icon', () => {
      render(
        <StatsCard
          title="Total Users"
          value={150}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          data-testid="stats-card"
        />
      );

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByTestId('stats-card')).toBeInTheDocument();
    });

    it('displays change percentage with trend indicator', () => {
      render(
        <StatsCard
          title="Monthly Revenue"
          value={1250000}
          trend="+12.5% 先月比"
          trendDirection="up"
          icon={TrendingUp}
          gradient="from-green-50 to-green-100"
          data-testid="revenue-card"
        />
      );

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      expect(screen.getByText('1,250,000')).toBeInTheDocument(); // Formatted number
      expect(screen.getByText('+12.5% 先月比')).toBeInTheDocument();
    });

    it('shows correct icon component', () => {
      const { container } = render(
        <StatsCard
          title="Pending Approvals"
          value={8}
          icon={AlertCircle}
          gradient="from-amber-50 to-amber-100"
        />
      );

      // Icon should be rendered in the card
      const iconElement = container.querySelector('svg');
      expect(iconElement).toBeInTheDocument();
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct CSS classes and gradient', () => {
      render(
        <StatsCard
          title="Leave Balance"
          value={12}
          icon={Calendar}
          gradient="from-purple-50 to-purple-100"
          className="custom-class"
          data-testid="leave-card"
        />
      );

      const card = screen.getByTestId('leave-card');
      expect(card).toHaveClass('from-purple-50');
      expect(card).toHaveClass('to-purple-100');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('shadow-lg');
    });
  });

  // ============================================================
  // 2. Data Display
  // ============================================================

  describe('Data Display', () => {
    it('formats numbers correctly with Japanese locale (1,234)', () => {
      render(
        <StatsCard
          title="Total Employees"
          value={1234}
          icon={Users}
          gradient="from-orange-50 to-orange-100"
          data-testid="employee-card"
        />
      );

      // Japanese locale uses comma separators
      expect(screen.getByTestId('employee-card-value')).toHaveTextContent('1,234');
    });

    it('formats large numbers correctly', () => {
      render(
        <StatsCard
          title="Annual Revenue"
          value={12345678}
          icon={TrendingUp}
          gradient="from-blue-50 to-blue-100"
          data-testid="revenue-card"
        />
      );

      expect(screen.getByTestId('revenue-card-value')).toHaveTextContent('12,345,678');
    });

    it('displays string values without formatting', () => {
      render(
        <StatsCard
          title="Status"
          value="Active"
          icon={Users}
          gradient="from-green-50 to-green-100"
          data-testid="status-card"
        />
      );

      expect(screen.getByTestId('status-card-value')).toHaveTextContent('Active');
    });

    it('shows percentage changes with +/- sign in trend', () => {
      render(
        <StatsCard
          title="Growth Rate"
          value={95}
          trend="+5.3% 先月比"
          trendDirection="up"
          icon={TrendingUp}
          gradient="from-green-50 to-green-100"
          data-testid="growth-card"
        />
      );

      const trendElement = screen.getByTestId('growth-card-trend');
      expect(trendElement).toHaveTextContent('+5.3% 先月比');
    });

    it('displays upward trend indicator (▲)', () => {
      const { container } = render(
        <StatsCard
          title="Sales"
          value={1000}
          trend="+10%"
          trendDirection="up"
          icon={TrendingUp}
          gradient="from-green-50 to-green-100"
          data-testid="sales-card"
        />
      );

      const trendIcon = container.querySelector('.text-green-600');
      expect(trendIcon).toBeInTheDocument();
    });

    it('displays downward trend indicator (▼)', () => {
      const { container } = render(
        <StatsCard
          title="Churn Rate"
          value={5}
          trend="-2.1%"
          trendDirection="down"
          icon={TrendingUp}
          gradient="from-red-50 to-red-100"
          data-testid="churn-card"
        />
      );

      const trendIcon = container.querySelector('.text-red-600');
      expect(trendIcon).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
      render(
        <StatsCard
          title="Pending Tasks"
          value={0}
          icon={AlertCircle}
          gradient="from-gray-50 to-gray-100"
          data-testid="tasks-card"
        />
      );

      expect(screen.getByTestId('tasks-card-value')).toHaveTextContent('0');
    });

    it('handles negative values correctly', () => {
      render(
        <StatsCard
          title="Loss"
          value={-500}
          icon={TrendingUp}
          gradient="from-red-50 to-red-100"
          data-testid="loss-card"
        />
      );

      expect(screen.getByTestId('loss-card-value')).toHaveTextContent('-500');
    });

    it('displays trend without percentage', () => {
      render(
        <StatsCard
          title="Team Size"
          value={8}
          trend="全員出勤"
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          data-testid="team-card"
        />
      );

      expect(screen.getByTestId('team-card-trend')).toHaveTextContent('全員出勤');
    });

    it('renders without trend when not provided', () => {
      render(
        <StatsCard
          title="Simple Card"
          value={42}
          icon={Users}
          gradient="from-gray-50 to-gray-100"
          data-testid="simple-card"
        />
      );

      expect(screen.queryByTestId('simple-card-trend')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // 3. Loading State
  // ============================================================

  describe('Loading State', () => {
    it('shows skeleton or loading indicator when loading', () => {
      const { container } = render(
        <StatsCard
          title="Loading Card"
          value={0}
          icon={Users}
          gradient="from-gray-50 to-gray-100"
          loading={true}
          data-testid="loading-card"
        />
      );

      // Check for loading skeleton classes
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides data while loading', () => {
      render(
        <StatsCard
          title="Hidden Data"
          value={1234}
          trend="+10%"
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          loading={true}
          data-testid="hidden-card"
        />
      );

      // Actual data should not be visible
      expect(screen.queryByText('Hidden Data')).not.toBeInTheDocument();
      expect(screen.queryByText('1,234')).not.toBeInTheDocument();
      expect(screen.queryByText('+10%')).not.toBeInTheDocument();
    });

    it('transitions from loading to loaded state', () => {
      const { rerender } = render(
        <StatsCard
          title="Transitioning Card"
          value={500}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          loading={true}
          data-testid="transition-card"
        />
      );

      // Initially loading
      expect(screen.queryByText('Transitioning Card')).not.toBeInTheDocument();

      // Rerender with loading=false
      rerender(
        <StatsCard
          title="Transitioning Card"
          value={500}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          loading={false}
          data-testid="transition-card"
        />
      );

      // Now data should be visible
      expect(screen.getByText('Transitioning Card')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('maintains gradient during loading', () => {
      render(
        <StatsCard
          title="Loading Gradient"
          value={100}
          icon={Users}
          gradient="from-purple-50 to-purple-100"
          loading={true}
          data-testid="loading-gradient"
        />
      );

      const card = screen.getByTestId('loading-gradient');
      expect(card).toHaveClass('from-purple-50');
      expect(card).toHaveClass('to-purple-100');
    });
  });

  // ============================================================
  // 4. Click Interactions
  // ============================================================

  describe('Click Interactions', () => {
    it('onClick handler fires when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <StatsCard
          title="Clickable Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          onClick={handleClick}
          data-testid="clickable-card"
        />
      );

      const card = screen.getByTestId('clickable-card');
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies cursor-pointer class when clickable', () => {
      render(
        <StatsCard
          title="Pointer Card"
          value={50}
          icon={Users}
          gradient="from-green-50 to-green-100"
          onClick={() => {}}
          data-testid="pointer-card"
        />
      );

      const card = screen.getByTestId('pointer-card');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('does not apply cursor-pointer when not clickable', () => {
      render(
        <StatsCard
          title="Non-clickable Card"
          value={50}
          icon={Users}
          gradient="from-gray-50 to-gray-100"
          data-testid="non-clickable-card"
        />
      );

      const card = screen.getByTestId('non-clickable-card');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('supports keyboard navigation (Enter key)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <StatsCard
          title="Keyboard Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          onClick={handleClick}
          data-testid="keyboard-card"
        />
      );

      const card = screen.getByTestId('keyboard-card');
      card.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation (Space key)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <StatsCard
          title="Space Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          onClick={handleClick}
          data-testid="space-card"
        />
      );

      const card = screen.getByTestId('space-card');
      card.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('sets role=button when clickable', () => {
      render(
        <StatsCard
          title="Button Role Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          onClick={() => {}}
          data-testid="button-role-card"
        />
      );

      const card = screen.getByTestId('button-role-card');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('is focusable when clickable', () => {
      render(
        <StatsCard
          title="Focusable Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          onClick={() => {}}
          data-testid="focusable-card"
        />
      );

      const card = screen.getByTestId('focusable-card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('does not set role=button when not clickable', () => {
      render(
        <StatsCard
          title="No Button Role Card"
          value={100}
          icon={Users}
          gradient="from-gray-50 to-gray-100"
          data-testid="no-button-role-card"
        />
      );

      const card = screen.getByTestId('no-button-role-card');
      expect(card).not.toHaveAttribute('role');
    });
  });

  // ============================================================
  // 5. Accessibility
  // ============================================================

  describe('Accessibility', () => {
    it('hides decorative icons from screen readers', () => {
      const { container } = render(
        <StatsCard
          title="Accessible Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
        />
      );

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('provides semantic structure with CardHeader and CardContent', () => {
      const { container } = render(
        <StatsCard
          title="Semantic Card"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
        />
      );

      // Card components should render proper semantic structure
      expect(container.querySelector('.text-3xl')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 6. Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      render(
        <StatsCard
          title="Large Number"
          value={999999999}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
          data-testid="large-number-card"
        />
      );

      expect(screen.getByTestId('large-number-card-value')).toHaveTextContent('999,999,999');
    });

    it('handles decimal values', () => {
      render(
        <StatsCard
          title="Decimal Value"
          value={87.5}
          icon={TrendingUp}
          gradient="from-green-50 to-green-100"
          data-testid="decimal-card"
        />
      );

      expect(screen.getByTestId('decimal-card-value')).toHaveTextContent('87.5');
    });

    it('handles empty string value', () => {
      render(
        <StatsCard
          title="Empty String"
          value=""
          icon={Users}
          gradient="from-gray-50 to-gray-100"
          data-testid="empty-string-card"
        />
      );

      const valueElement = screen.getByTestId('empty-string-card-value');
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent('');
    });

    it('handles Japanese text values', () => {
      render(
        <StatsCard
          title="日本語タイトル"
          value="出勤中"
          icon={Users}
          gradient="from-orange-50 to-orange-100"
          data-testid="japanese-card"
        />
      );

      expect(screen.getByText('日本語タイトル')).toBeInTheDocument();
      expect(screen.getByText('出勤中')).toBeInTheDocument();
    });

    it('multiple cards render independently', () => {
      render(
        <div>
          <StatsCard
            title="Card 1"
            value={100}
            icon={Users}
            gradient="from-blue-50 to-blue-100"
            data-testid="card-1"
          />
          <StatsCard
            title="Card 2"
            value={200}
            icon={AlertCircle}
            gradient="from-red-50 to-red-100"
            data-testid="card-2"
          />
          <StatsCard
            title="Card 3"
            value={300}
            icon={Calendar}
            gradient="from-green-50 to-green-100"
            data-testid="card-3"
          />
        </div>
      );

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
      expect(screen.getByTestId('card-3')).toBeInTheDocument();
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });
  });
});

# StatsCard Component

A reusable, accessible, and fully-tested statistics card component for displaying KPIs (Key Performance Indicators) in dashboards.

## Features

- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Loading States**: Built-in skeleton loading UI
- ✅ **Trend Indicators**: Up/down arrows with customizable colors
- ✅ **Number Formatting**: Automatic locale-based number formatting (Japanese)
- ✅ **Clickable**: Optional onClick handler with keyboard support
- ✅ **Accessible**: ARIA attributes, keyboard navigation, screen reader support
- ✅ **Dark Mode**: Full dark mode support via Tailwind CSS
- ✅ **Customizable**: Gradient backgrounds, icons, and styling
- ✅ **Fully Tested**: 33 comprehensive tests with 100% coverage

## Installation

The component is located at:
```
/Users/dw100/dandori-portal/src/components/dashboard/stats-card.tsx
```

## Basic Usage

```tsx
import { StatsCard } from '@/components/dashboard/stats-card';
import { Users } from 'lucide-react';

function Dashboard() {
  return (
    <StatsCard
      title="Total Users"
      value={150}
      icon={Users}
      gradient="from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | ✅ | - | Card title text |
| `value` | `string \| number` | ✅ | - | Main value to display |
| `icon` | `LucideIcon` | ✅ | - | Icon component from lucide-react |
| `gradient` | `string` | ✅ | - | Tailwind gradient classes |
| `trend` | `string` | ❌ | `undefined` | Trend text (e.g., "+12.5% 先月比") |
| `trendDirection` | `'up' \| 'down'` | ❌ | `'up'` | Direction of trend arrow |
| `loading` | `boolean` | ❌ | `false` | Show loading skeleton |
| `onClick` | `() => void` | ❌ | `undefined` | Click handler |
| `className` | `string` | ❌ | `''` | Additional CSS classes |
| `data-testid` | `string` | ❌ | `undefined` | Test ID for testing |

## Examples

### 1. Basic Stats Card

```tsx
<StatsCard
  title="Total Employees"
  value={50}
  icon={Users}
  gradient="from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
/>
```

### 2. With Trend Indicator

```tsx
<StatsCard
  title="Monthly Revenue"
  value={1250000}
  trend="+12.5% 先月比"
  trendDirection="up"
  icon={DollarSign}
  gradient="from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
/>
```

### 3. Loading State

```tsx
<StatsCard
  title="Loading Data"
  value={0}
  icon={Users}
  gradient="from-gray-50 to-gray-100"
  loading={true}
/>
```

### 4. Clickable Card

```tsx
<StatsCard
  title="Pending Approvals"
  value={8}
  icon={AlertCircle}
  gradient="from-amber-50 to-amber-100"
  onClick={() => router.push('/workflow')}
/>
```

### 5. String Values

```tsx
<StatsCard
  title="Status"
  value="Active"
  trend="Online since 08:45"
  icon={ShieldCheck}
  gradient="from-green-50 to-green-100"
/>
```

### 6. Dashboard Grid

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatsCard
    title="総従業員数"
    value={50}
    trend="+12 先月比"
    icon={Users}
    gradient="from-orange-50 to-orange-100"
  />
  <StatsCard
    title="本日の出勤率"
    value={42}
    trend="出勤率 84%"
    icon={UserCheck}
    gradient="from-blue-50 to-blue-100"
  />
  <StatsCard
    title="承認待ち"
    value={8}
    trend="3件は緊急"
    icon={AlertCircle}
    gradient="from-amber-50 to-amber-100"
  />
  <StatsCard
    title="システム健全性"
    value="99.9%"
    trend="稼働時間"
    icon={ShieldCheck}
    gradient="from-purple-50 to-purple-100"
  />
</div>
```

## Features in Detail

### Number Formatting

Numbers >= 1000 are automatically formatted with Japanese locale comma separators:

```tsx
<StatsCard value={1234} ... />      // Displays: "1,234"
<StatsCard value={12345678} ... />  // Displays: "12,345,678"
<StatsCard value={87.5} ... />      // Displays: "87.5"
```

### Trend Indicators

Up and down arrows are displayed based on `trendDirection`:

```tsx
// Green arrow up
<StatsCard trendDirection="up" trend="+5%" ... />

// Red arrow down
<StatsCard trendDirection="down" trend="-2%" ... />
```

### Accessibility

The component is fully accessible:

- ✅ Icons are hidden from screen readers (`aria-hidden="true"`)
- ✅ Clickable cards have `role="button"`
- ✅ Keyboard navigation support (Enter and Space keys)
- ✅ Proper focus management (`tabIndex={0}`)
- ✅ Semantic HTML structure

### Keyboard Navigation

When `onClick` is provided:

- Press `Enter` or `Space` to trigger the click handler
- Card is focusable with `Tab` key
- Visual focus indicator included

### Dark Mode

All gradients support dark mode:

```tsx
gradient="from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
```

### Recommended Gradients

```tsx
// Orange
"from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"

// Blue
"from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"

// Green
"from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"

// Amber
"from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"

// Purple
"from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"

// Red
"from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
```

## Testing

The component has comprehensive test coverage with 33 tests:

```bash
npm test -- stats-card.test.tsx
```

### Test Coverage

- ✅ Rendering with various props
- ✅ Number formatting (Japanese locale)
- ✅ Trend indicators (up/down)
- ✅ Loading states
- ✅ Click interactions
- ✅ Keyboard navigation
- ✅ Accessibility features
- ✅ Edge cases (large numbers, decimals, Japanese text, etc.)

### Running Tests

```bash
# Run all StatsCard tests
npm test -- stats-card.test.tsx

# Run with coverage
npm test -- stats-card.test.tsx --coverage

# Watch mode
npm test -- stats-card.test.tsx --watch
```

## Integration with Dashboard

The component is used in the main dashboard:

```tsx
// src/app/[locale]/dashboard/page.tsx
import { StatsCard } from '@/components/dashboard/stats-card';

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="総従業員数"
        value={kpiData.totalEmployees}
        trend="+12 先月比"
        icon={Users}
        gradient="from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
      />
      {/* More cards... */}
    </div>
  );
}
```

## Best Practices

1. **Use consistent gradients** - Pick a color scheme and stick to it
2. **Provide meaningful trends** - Add context to percentage changes
3. **Use appropriate icons** - Match icons to the data being displayed
4. **Handle loading states** - Show skeleton UI while data is loading
5. **Make important cards clickable** - Allow users to drill down into details
6. **Use data-testid** - Add test IDs for easier testing
7. **Support dark mode** - Always include dark mode gradient variants

## TypeScript

The component is fully typed with TypeScript:

```tsx
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: LucideIcon;
  gradient: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  'data-testid'?: string;
}
```

## Performance

- ✅ Component is memoized with `React.memo`
- ✅ No unnecessary re-renders
- ✅ Optimized for large dashboards with many cards
- ✅ Lightweight CSS with Tailwind

## Browser Support

Works in all modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Part of the Dandori Portal project.

## Related Components

- `Card`, `CardHeader`, `CardContent` - UI components from `@/components/ui/card`
- `TrendingUp`, `TrendingDown` - Icons from `lucide-react`
- Dashboard layout components

## Changelog

### Version 1.0.0 (2025-10-19)

- Initial release
- 33 comprehensive tests
- Full accessibility support
- Loading states
- Click interactions
- Number formatting
- Dark mode support

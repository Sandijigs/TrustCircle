# TrustCircle UI Components Guide

## Overview

Comprehensive React component library for TrustCircle lending platform. Built with TypeScript, Tailwind CSS, and accessibility-first design principles.

### Design Philosophy

- **Mobile-First**: All components optimized for mobile users in emerging markets
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Trust-Building**: Professional financial UI with blues, greens, and clean aesthetics
- **Performance**: Optimized for fast loading and smooth interactions
- **Dark Mode**: Full dark mode support across all components

## Table of Contents

1. [Setup](#setup)
2. [Layout Components](#layout-components)
3. [Shared UI Components](#shared-ui-components)
4. [Dashboard Components](#dashboard-components)
5. [Form Components](#form-components)
6. [Design System](#design-system)
7. [Best Practices](#best-practices)

---

## Setup

### Installation

Components are located in `/components` directory and organized by category:

```
components/
├── ui/           # Shared UI components
├── layout/       # Layout components
├── dashboard/    # Dashboard-specific components
└── forms/        # Form components
```

### Basic Usage

```tsx
import { Button, Card, Modal } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { Dashboard } from '@/components/dashboard';
```

---

## Layout Components

### MainLayout

Complete application layout with Navbar, Sidebar, and Footer.

**Props:**
- `children`: Content to render
- `user?`: User data for navbar
- `network?`: Network info for navbar
- `showSidebar?`: Show/hide sidebar (default: true)
- `showFooter?`: Show/hide footer (default: true)
- `maxWidth?`: Content max-width ('full' | 'container' | 'narrow')

**Example:**

```tsx
import { MainLayout } from '@/components/layout';

export default function Page() {
  return (
    <MainLayout
      user={{
        address: '0x1234...5678',
        balance: '1,234.56',
        creditScore: 750,
        verified: true,
      }}
      network={{
        chainId: 44787,
        name: 'Alfajores',
        isTestnet: true,
      }}
      onConnect={() => connectWallet()}
      onDisconnect={() => disconnectWallet()}
    >
      <Dashboard />
    </MainLayout>
  );
}
```

### Navbar

Top navigation bar with wallet connection and network indicator.

**Key Features:**
- Wallet connect/disconnect
- Balance display
- Network indicator
- Mobile responsive
- User dropdown menu
- Verification badge

**Design Decisions:**
- Sticky positioning for constant wallet access
- High contrast for quick scanning
- Mobile hamburger menu
- Visual warning for wrong network

### Sidebar

Main navigation sidebar with route highlighting.

**Key Features:**
- Fixed on desktop, drawer on mobile
- Active route highlighting
- Grouped navigation items
- Badge support for notifications
- Keyboard accessible

**Design Decisions:**
- Auto-closes on mobile after navigation
- Clear visual hierarchy
- Icon + label for better recognition
- Help section at bottom

### Footer

Site footer with links and legal information.

**Key Features:**
- Responsive grid layout
- Social media links
- Legal disclaimers
- Celo/Mento branding

---

## Shared UI Components

### Button

Flexible button component with multiple variants and sizes.

**Variants:**
- `primary`: Main actions (blue)
- `secondary`: Secondary actions (gray)
- `success`: Positive actions (green)
- `danger`: Destructive actions (red)
- `ghost`: Subtle actions
- `outline`: Outlined style

**Sizes:**
- `sm`: Small (40px min height)
- `md`: Medium (44px min height) - Default
- `lg`: Large (48px min height)

**Props:**
- All native button props
- `variant?`: Button style
- `size?`: Button size
- `loading?`: Show loading spinner
- `disabled?`: Disable button
- `fullWidth?`: Full width button
- `leftIcon?`: Icon before text
- `rightIcon?`: Icon after text

**Example:**

```tsx
<Button
  variant="primary"
  size="md"
  loading={isLoading}
  onClick={handleSubmit}
  leftIcon={<IconCheck />}
>
  Submit Loan Request
</Button>
```

**Accessibility:**
- 44px minimum touch target
- Proper focus states
- Loading state announced to screen readers
- Disabled state handled correctly

### Card

Flexible container for grouping content.

**Props:**
- `hover?`: Enable hover effects
- `padding?`: 'none' | 'sm' | 'md' | 'lg'
- `rounded?`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `shadow?`: 'none' | 'sm' | 'md' | 'lg'
- `onClick?`: Make card clickable

**Example:**

```tsx
<Card padding="lg" hover shadow="md">
  <h3 className="text-xl font-bold mb-2">Loan Details</h3>
  <p>Your loan information...</p>
</Card>
```

### Modal

Accessible modal dialog with backdrop and keyboard navigation.

**Props:**
- `isOpen`: Control visibility
- `onClose`: Close handler
- `title?`: Modal title
- `size?`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlayClick?`: Close on backdrop click (default: true)
- `closeOnEsc?`: Close on ESC key (default: true)
- `showCloseButton?`: Show X button (default: true)
- `footer?`: Footer content

**Example:**

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Transaction"
  size="md"
  footer={
    <div className="flex gap-3">
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  }
>
  <p>Are you sure you want to proceed with this transaction?</p>
</Modal>
```

**Accessibility:**
- Focus trap within modal
- ESC key to close
- Body scroll lock
- Proper ARIA attributes
- Keyboard navigation support

### LoadingSpinner

Accessible loading indicator.

**Props:**
- `size?`: 'sm' | 'md' | 'lg'
- `color?`: 'primary' | 'white' | 'gray'
- `text?`: Loading text

**Example:**

```tsx
<LoadingSpinner size="lg" text="Processing transaction..." />
```

### Toast

Non-blocking notifications for feedback.

**Types:**
- `success`: Positive feedback (green)
- `error`: Error messages (red)
- `warning`: Warnings (yellow)
- `info`: Information (blue)

**Example:**

```tsx
// Use with ToastContainer
const [toasts, setToasts] = useState([]);

const showToast = (type, title, message) => {
  const id = Date.now().toString();
  setToasts([...toasts, { id, type, title, message }]);
};

// In your component
<ToastContainer
  toasts={toasts}
  onClose={(id) => setToasts(toasts.filter(t => t.id !== id))}
/>
```

### EmptyState

Friendly empty state display.

**Example:**

```tsx
<EmptyState
  icon={<IconCircle />}
  title="No loans found"
  description="You haven't requested any loans yet"
  action={
    <Button onClick={handleRequestLoan}>
      Request Your First Loan
    </Button>
  }
/>
```

### Skeleton

Loading placeholders.

**Example:**

```tsx
<Skeleton width="100%" height="20px" count={3} />

// Or use patterns
<SkeletonPatterns.Card />
<SkeletonPatterns.StatCard />
<SkeletonPatterns.ListItem />
```

---

## Dashboard Components

### Dashboard

Complete dashboard page component.

**Props:**
- `stats?`: Financial statistics
- `creditScore?`: User credit score
- `activities?`: Recent activity items
- `loading?`: Loading state
- `onRequestLoan?`: Loan request handler
- `onJoinCircle?`: Circle join handler
- `onDeposit?`: Deposit handler

**Example:**

```tsx
<Dashboard
  stats={{
    totalBorrowed: '1,234.56',
    availableToBorrow: '5,000.00',
    activeLoans: 2,
    totalEarned: '123.45',
  }}
  creditScore={750}
  activities={recentActivities}
  loading={false}
  onRequestLoan={() => router.push('/borrow')}
  onJoinCircle={() => router.push('/circles')}
  onDeposit={() => router.push('/lend')}
/>
```

### StatCard

Display key financial metrics.

**Props:**
- `label`: Metric label
- `value`: Metric value
- `icon?`: Icon component
- `change?`: {value: number, type: 'increase' | 'decrease'}
- `loading?`: Loading state
- `colorScheme?`: 'primary' | 'success' | 'warning' | 'danger'

**Example:**

```tsx
<StatCard
  label="Total Borrowed"
  value="1,234.56 cUSD"
  icon={<IconMoney />}
  change={{ value: 12.5, type: 'increase' }}
  colorScheme="primary"
/>
```

**Design Decisions:**
- Large numbers for quick scanning
- Color-coded change indicators
- Icons for visual anchoring
- Hover effect hints interactivity

### CreditScoreGauge

Visual credit score display with gauge.

**Props:**
- `score`: Current credit score (0-1000)
- `maxScore?`: Maximum score (default: 1000)
- `size?`: 'sm' | 'md' | 'lg'
- `showLabel?`: Show tier label (default: true)
- `animated?`: Animate on mount (default: true)

**Example:**

```tsx
<CreditScoreGauge
  score={750}
  size="lg"
  showLabel
  animated
/>
```

**Credit Score Tiers:**
- Excellent: 800-1000 (Green)
- Good: 700-799 (Blue)
- Fair: 600-699 (Yellow)
- Poor: 500-599 (Orange)
- Bad: 0-499 (Red)

### ActivityFeed

Chronological activity list.

**Activity Types:**
- `loan`: Loan-related activities
- `payment`: Payment activities
- `deposit`: Deposit activities
- `withdrawal`: Withdrawal activities
- `circle`: Circle activities
- `verification`: Verification activities

**Example:**

```tsx
const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'loan',
    title: 'Loan Approved',
    description: 'Your loan of 500 cUSD has been approved',
    timestamp: new Date(),
  },
  // ...more activities
];

<ActivityFeed
  items={activities}
  loading={false}
  onItemClick={(item) => console.log('Clicked:', item)}
/>
```

---

## Form Components

### Input

Text input with validation and icons.

**Props:**
- Standard input props
- `label?`: Input label
- `error?`: Error message
- `helperText?`: Helper text
- `leftIcon?`: Icon before input
- `rightIcon?`: Icon after input
- `fullWidth?`: Full width input
- `inputSize?`: 'sm' | 'md' | 'lg'

**Example:**

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  helperText="We'll never share your email"
  leftIcon={<IconEmail />}
  required
/>
```

### Select

Dropdown select with validation.

**Example:**

```tsx
<Select
  label="Loan Currency"
  options={[
    { value: 'cusd', label: 'cUSD' },
    { value: 'ceur', label: 'cEUR' },
    { value: 'creal', label: 'cREAL' },
  ]}
  placeholder="Select currency"
  value={currency}
  onChange={(e) => setCurrency(e.target.value)}
  error={errors.currency}
  required
/>
```

### CurrencyInput

Specialized currency input with balance display.

**Props:**
- Input props
- `currency?`: 'cUSD' | 'cEUR' | 'cREAL'
- `balance?`: User balance
- `onMaxClick?`: Max button handler
- `decimals?`: Decimal precision (default: 2)

**Example:**

```tsx
<CurrencyInput
  label="Loan Amount"
  currency="cUSD"
  balance="1,234.56"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  onMaxClick={() => setAmount(balance)}
  error={errors.amount}
  helperText="Enter the amount you want to borrow"
  decimals={2}
  required
/>
```

**Design Decisions:**
- Currency selector integrated
- Balance display for context
- "Max" button for convenience
- Auto-formatting
- Symbol display ($, €, R$)

### FileUpload

File upload with drag-and-drop.

**Props:**
- `label?`: Upload label
- `accept?`: Accepted file types
- `maxSize?`: Max file size in MB
- `error?`: Error message
- `helperText?`: Helper text
- `onFileSelect`: File select handler
- `preview?`: Show image preview

**Example:**

```tsx
<FileUpload
  label="Upload ID Document"
  accept="image/*,.pdf"
  maxSize={5}
  onFileSelect={(file) => setIdDocument(file)}
  preview
  helperText="PNG, JPG, or PDF up to 5MB"
  error={errors.idDocument}
/>
```

**Features:**
- Drag-and-drop support
- File type validation
- Size validation
- Image preview
- Clear file info display
- Remove file button

---

## Design System

### Colors

```typescript
// Primary (Trust blue)
primary: {
  500: '#0ea5e9', // Main brand blue
  600: '#0284c7',
}

// Success (Positive green)
success: {
  500: '#22c55e',
  600: '#16a34a',
}

// Warning
warning: {
  500: '#f59e0b',
  600: '#d97706',
}

// Danger
danger: {
  500: '#ef4444',
  600: '#dc2626',
}
```

### Typography

```typescript
// Sizes
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 30px

// Weights
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

### Spacing

```typescript
4px, 8px, 16px, 24px, 32px, 48px, 64px
```

### Breakpoints

```typescript
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

---

## Best Practices

### 1. Accessibility

```tsx
// Always provide labels
<Input label="Email" id="email" />

// Use semantic HTML
<button type="submit">Submit</button>

// Provide ARIA labels for icons
<button aria-label="Close modal">
  <IconX />
</button>

// Announce dynamic content
<div role="status" aria-live="polite">
  {message}
</div>
```

### 2. Loading States

```tsx
// Use loading prop
<Button loading={isSubmitting}>Submit</Button>

// Use skeletons for content
{loading ? <Skeleton count={5} /> : <Content />}

// Show loading spinner for async operations
{isLoading && <LoadingSpinner text="Loading..." />}
```

### 3. Error Handling

```tsx
// Show errors inline
<Input
  error={errors.email}
  value={email}
  onChange={handleChange}
/>

// Use toasts for transaction feedback
showToast('error', 'Transaction Failed', 'Please try again');

// Use empty states
{items.length === 0 && (
  <EmptyState
    title="No items found"
    description="Try adjusting your filters"
  />
)}
```

### 4. Responsive Design

```tsx
// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Hide/show based on screen size
<div className="hidden lg:block">Desktop only</div>
<div className="lg:hidden">Mobile/Tablet only</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

### 5. Financial UI

```tsx
// Always show currency
<span>1,234.56 cUSD</span>

// Use appropriate colors for gains/losses
<span className="text-success-600">+12.5%</span>
<span className="text-red-600">-5.2%</span>

// Format large numbers
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(amount);

// Show loading states for blockchain interactions
<Button loading={isWaitingForConfirmation}>
  Confirm Transaction
</Button>
```

### 6. Dark Mode

```tsx
// Use dark mode classes
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>

// Test both modes during development
```

### 7. Performance

```tsx
// Lazy load heavy components
const Dashboard = lazy(() => import('./Dashboard'));

// Use React.memo for expensive components
export const StatCard = React.memo(StatCardComponent);

// Optimize images
<Image
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy"
/>
```

---

## Complete Example: Loan Request Form

```tsx
'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Button, Card, Modal } from '@/components/ui';
import { Input, Select, CurrencyInput } from '@/components/forms';

export default function LoanRequest() {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'cusd',
    purpose: '',
    duration: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validation
    const newErrors = {};
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    // Show confirmation
    setShowConfirmation(true);
    setIsSubmitting(false);
  };

  const handleConfirm = async () => {
    // Submit to blockchain
    try {
      // ... blockchain interaction
      showToast('success', 'Loan Requested', 'Your request has been submitted');
      router.push('/dashboard');
    } catch (error) {
      showToast('error', 'Request Failed', error.message);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Request a Loan
        </h1>

        <Card padding="lg" shadow="md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <CurrencyInput
              label="Loan Amount"
              currency={formData.currency}
              balance="1,234.56"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              onMaxClick={() => setFormData({ ...formData, amount: '1234.56' })}
              error={errors.amount}
              helperText="Enter the amount you want to borrow"
              required
            />

            <Select
              label="Loan Duration"
              options={[
                { value: '30', label: '30 Days' },
                { value: '60', label: '60 Days' },
                { value: '90', label: '90 Days' },
              ]}
              placeholder="Select duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              error={errors.duration}
              required
            />

            <Input
              label="Loan Purpose"
              placeholder="Describe how you'll use the funds"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              error={errors.purpose}
              helperText="Be specific about your intended use"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
            >
              Request Loan
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Loan Request"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmation(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              fullWidth
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
            <p className="text-lg font-semibold">{formData.amount} {formData.currency.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
            <p className="text-lg font-semibold">{formData.duration} Days</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Purpose</p>
            <p className="text-sm">{formData.purpose}</p>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
```

---

## Support

For issues or questions:
- Check component source code for detailed prop types
- Review TypeScript interfaces in `/types/components.ts`
- Reference design system in `/lib/design-system.ts`

---

**Last Updated**: 2025-10-28
**Version**: 1.0.0

/**
 * Component Type Definitions
 * 
 * Shared TypeScript interfaces and types for UI components
 */

import { ReactNode } from 'react';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

// Button variants and sizes
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

// Card props
export interface CardProps extends BaseComponentProps {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

// Modal props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

// Input props
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

// Select props
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  selectSize?: 'sm' | 'md' | 'lg';
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

// Loading spinner props
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
}

// Empty state props
export interface EmptyStateProps extends BaseComponentProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

// Skeleton loader props
export interface SkeletonProps extends BaseComponentProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  count?: number;
}

// Stat card props
export interface StatCardProps extends BaseComponentProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  loading?: boolean;
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger';
}

// Credit score gauge props
export interface CreditScoreGaugeProps extends BaseComponentProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

// Activity feed item
export interface ActivityItem {
  id: string;
  type: 'loan' | 'payment' | 'deposit' | 'withdrawal' | 'circle' | 'verification';
  title: string;
  description: string;
  timestamp: Date;
  icon?: ReactNode;
  metadata?: Record<string, any>;
}

export interface ActivityFeedProps extends BaseComponentProps {
  items: ActivityItem[];
  loading?: boolean;
  onItemClick?: (item: ActivityItem) => void;
  emptyMessage?: string;
}

// Currency input props
export interface CurrencyInputProps extends Omit<InputProps, 'type'> {
  currency?: 'cUSD' | 'cEUR' | 'cREAL';
  balance?: string;
  onMaxClick?: () => void;
  decimals?: number;
}

// File upload props
export interface FileUploadProps extends BaseComponentProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  error?: string;
  helperText?: string;
  onFileSelect: (file: File | null) => void;
  preview?: boolean;
}

// Navbar user data
export interface NavbarUser {
  address: string;
  balance?: string;
  creditScore?: number;
  verified?: boolean;
}

// Network info
export interface NetworkInfo {
  chainId: number;
  name: string;
  isTestnet: boolean;
}

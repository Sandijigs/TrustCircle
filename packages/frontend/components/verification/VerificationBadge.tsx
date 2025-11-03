/**
 * VerificationBadge Component
 * 
 * Small badge showing verification status
 * Used in user profiles, cards, etc.
 * 
 * @example
 * ```tsx
 * <VerificationBadge size="sm" showTooltip />
 * ```
 */

'use client';

import { useVerification, VerificationLevel } from '@/hooks/useVerification';

interface VerificationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  showLevel?: boolean;
  className?: string;
}

export function VerificationBadge({
  size = 'md',
  showTooltip = true,
  showLevel = false,
  className = '',
}: VerificationBadgeProps) {
  const { isVerified, verificationLevel, isExpired, getLevelName, getLevelColor } = useVerification();

  if (!isVerified || isExpired) {
    return null;
  }

  // Size styles
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Get badge color based on level
  const getBadgeColor = (level: VerificationLevel): string => {
    switch (level) {
      case VerificationLevel.TRUSTED:
        return 'text-purple-500';
      case VerificationLevel.VERIFIED:
        return 'text-success-500';
      case VerificationLevel.BASIC:
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const badgeColor = getBadgeColor(verificationLevel);
  const levelName = getLevelName(verificationLevel);

  return (
    <div 
      className={`inline-flex items-center gap-1 ${className}`}
      title={showTooltip ? `${levelName} Verification` : undefined}
    >
      <svg 
        className={`${sizeStyles[size]} ${badgeColor}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-label={`${levelName} verification badge`}
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      
      {showLevel && (
        <span className={`text-xs font-medium ${getLevelColor(verificationLevel)}`}>
          {levelName}
        </span>
      )}
    </div>
  );
}

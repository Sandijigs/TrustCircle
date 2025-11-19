/**
 * CreditScoreGauge Component
 * 
 * Visual representation of credit score with color-coded gauge
 * Shows score range, current score, and tier label
 * 
 * Design Decisions:
 * - Color-coded by score tier for instant recognition
 * - Large, prominent score display
 * - Circular gauge for visual impact
 * - Animated progress on mount
 * - Tier labels for context (Excellent, Good, Fair, Poor)
 * 
 * Credit Score Tiers:
 * - Excellent: 800-1000 (Green)
 * - Good: 700-799 (Blue)
 * - Fair: 600-699 (Yellow)
 * - Poor: 500-599 (Orange)
 * - Bad: 0-499 (Red)
 * 
 * @example
 * ```tsx
 * <CreditScoreGauge score={750} size="lg" showLabel animated />
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { CreditScoreGaugeProps } from '@/types/components';
import { Card } from '@/components/ui/Card';

export function CreditScoreGauge({
  score,
  maxScore = 1000,
  size = 'md',
  showLabel = true,
  animated = true,
  className = '',
  ...props
}: CreditScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate score on mount (only once)
  useEffect(() => {
    if (!animated || hasAnimated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        setHasAnimated(true);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animated, hasAnimated]);

  // Calculate percentage
  const percentage = (displayScore / maxScore) * 100;

  // Determine tier and color
  const getTierInfo = (score: number) => {
    if (score >= 800) return { tier: 'Excellent', color: 'success', bg: 'bg-success-500', text: 'text-success-600 dark:text-success-400' };
    if (score >= 700) return { tier: 'Good', color: 'primary', bg: 'bg-primary-500', text: 'text-primary-600 dark:text-primary-400' };
    if (score >= 600) return { tier: 'Fair', color: 'warning', bg: 'bg-warning-500', text: 'text-warning-600 dark:text-warning-400' };
    if (score >= 500) return { tier: 'Poor', color: 'danger', bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' };
    return { tier: 'Bad', color: 'danger', bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
  };

  const tierInfo = getTierInfo(score);

  // Size styles
  const sizeStyles = {
    sm: { size: 120, stroke: 8, fontSize: 'text-2xl' },
    md: { size: 180, stroke: 12, fontSize: 'text-4xl' },
    lg: { size: 240, stroke: 16, fontSize: 'text-5xl' },
  };

  const { size: circleSize, stroke, fontSize } = sizeStyles[size];
  const radius = (circleSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card padding="lg" shadow="md" className={`text-center ${className}`} {...props}>
      {/* Circular Gauge */}
      <div className="inline-flex items-center justify-center mb-4">
        <svg width={circleSize} height={circleSize} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${tierInfo.text} transition-all duration-1000 ease-out`}
          />
        </svg>

        {/* Score Display (centered over circle) */}
        <div className="absolute">
          <div className={`${fontSize} font-bold text-gray-900 dark:text-white`}>
            {displayScore}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            / {maxScore}
          </div>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div>
          <div className={`text-lg font-semibold ${tierInfo.text} mb-1`}>
            {tierInfo.tier}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Credit Score
          </div>
        </div>
      )}

      {/* Score Ranges Guide */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <div className="flex justify-between items-center">
            <span>Excellent</span>
            <span className="text-success-600 dark:text-success-400 font-medium">800+</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Good</span>
            <span className="text-primary-600 dark:text-primary-400 font-medium">700-799</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Fair</span>
            <span className="text-warning-600 dark:text-warning-400 font-medium">600-699</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Poor</span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">500-599</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Bad</span>
            <span className="text-red-600 dark:text-red-400 font-medium">&lt;500</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * CreateCircle Component
 * 
 * Form for creating a new lending circle
 * Collects circle parameters and validates input
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { Input, Select } from '@/components/forms';
import { useLendingCircle } from '@/hooks/useLendingCircle';

export function CreateCircle() {
  const router = useRouter();
  const { createCircle, isLoading } = useLendingCircle();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    minCreditScore: 400,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Circle name is required');
      return;
    }

    if (formData.name.length < 3 || formData.name.length > 50) {
      setError('Circle name must be between 3 and 50 characters');
      return;
    }

    if (formData.maxMembers < 5 || formData.maxMembers > 20) {
      setError('Member count must be between 5 and 20');
      return;
    }

    if (formData.minCreditScore < 0 || formData.minCreditScore > 1000) {
      setError('Credit score must be between 0 and 1000');
      return;
    }

    try {
      const tx = await createCircle(formData);
      
      // Redirect to circles page after successful creation
      router.push('/circles');
    } catch (err) {
      console.error('Error creating circle:', err);
      setError(err instanceof Error ? err.message : 'Failed to create circle');
    }
  };

  return (
    <Card padding="lg" shadow="md" className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create Lending Circle
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Build a trusted community for social lending
          </p>
        </div>

        {/* Circle Name */}
        <Input
          label="Circle Name *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Tech Professionals Circle"
          helperText="A descriptive name for your lending circle (3-50 characters)"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Describe the purpose and membership criteria of your circle..."
            required
          />
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Explain who should join and what makes your circle unique
          </p>
        </div>

        {/* Max Members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Members *
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={formData.maxMembers}
            onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>5 members</span>
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {formData.maxMembers} members
            </span>
            <span>20 members</span>
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Smaller circles = tighter bonds. Larger circles = more liquidity.
          </p>
        </div>

        {/* Min Credit Score */}
        <Select
          label="Minimum Credit Score *"
          value={formData.minCreditScore.toString()}
          onChange={(e) => setFormData({ ...formData, minCreditScore: parseInt(e.target.value) })}
          options={[
            { value: '300', label: '300 - Open to all' },
            { value: '400', label: '400 - Basic verification' },
            { value: '500', label: '500 - Fair credit' },
            { value: '600', label: '600 - Good credit' },
            { value: '700', label: '700 - Very good credit' },
            { value: '800', label: '800 - Excellent credit only' },
          ]}
          helperText="Members must meet this credit score to join"
        />

        {/* Circle Benefits */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Circle Benefits
          </h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>✓ Lower interest rates for members</li>
            <li>✓ Community-backed loans with social accountability</li>
            <li>✓ Shared treasury and profit distribution</li>
            <li>✓ Build reputation through participation</li>
            <li>✓ Financial literacy and peer support</li>
          </ul>
        </div>

        {/* Creator Responsibilities */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            As Circle Creator, You'll:
          </h4>
          <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
            <li>• Review and approve new member applications</li>
            <li>• Help set circle lending policies</li>
            <li>• Participate in loan approval voting</li>
            <li>• Facilitate dispute resolution</li>
            <li>• Set a positive example for the circle</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            fullWidth
          >
            Create Circle
          </Button>
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          By creating a circle, you agree to uphold community standards and participate actively in circle governance
        </p>
      </form>
    </Card>
  );
}

/**
 * CircleList Component
 *
 * Browse and search lending circles
 * Filter by status, size, credit score requirements
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Input, Select } from '@/components/forms';
import { CircleCard } from './CircleCard';
import { JoinCircleModal } from './JoinCircleModal';
import { useAllCircles, useUserCircles } from '@/hooks/useCircles';
import type { CircleDisplay } from '@/lib/circles/types';

interface CircleListProps {
  filter?: 'all' | 'my-circles';
}

export function CircleList({ filter = 'all' }: CircleListProps) {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [selectedCircle, setSelectedCircle] = useState<CircleDisplay | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Fetch circles based on filter
  const { circles: allCircles, isLoading: loadingAll } = useAllCircles();
  const { userCircles, isLoading: loadingUser } = useUserCircles(address);

  const circles = filter === 'my-circles' ? userCircles : allCircles;
  const isLoading = filter === 'my-circles' ? loadingUser : loadingAll;

  // Filter circles
  const filteredCircles = useMemo(() => {
    return circles.filter((circle) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !circle.name.toLowerCase().includes(query) &&
          !circle.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && circle.statusLabel !== statusFilter) {
        return false;
      }

      // Size filter
      if (sizeFilter !== 'all') {
        const memberCount = circle.memberCount;
        if (sizeFilter === 'small' && memberCount >= 10) return false;
        if (sizeFilter === 'medium' && (memberCount < 10 || memberCount >= 15)) return false;
        if (sizeFilter === 'large' && memberCount < 15) return false;
      }

      return true;
    });
  }, [circles, searchQuery, statusFilter, sizeFilter]);

  // Sort circles (open circles first, then by member count)
  const sortedCircles = useMemo(() => {
    return [...filteredCircles].sort((a, b) => {
      // Open circles first
      const aOpen = !a.isFull && a.statusLabel === 'Active' ? 1 : 0;
      const bOpen = !b.isFull && b.statusLabel === 'Active' ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;

      // Then by member count (descending)
      return b.memberCount - a.memberCount;
    });
  }, [filteredCircles]);

  const handleJoinClick = (circle: CircleDisplay) => {
    setSelectedCircle(circle);
    setIsJoinModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search circles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Paused', label: 'Paused' },
              { value: 'Closed', label: 'Closed' },
            ]}
            className="md:w-48"
          />

          {/* Size Filter */}
          <Select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Sizes' },
              { value: 'small', label: 'Small (5-9)' },
              { value: 'medium', label: 'Medium (10-14)' },
              { value: 'large', label: 'Large (15-20)' },
            ]}
            className="md:w-48"
          />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sortedCircles.length} {sortedCircles.length === 1 ? 'circle' : 'circles'} found
          </p>
        </div>

        {/* Circle Grid */}
        {sortedCircles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCircles.map((circle) => (
              <CircleCard
                key={circle.id}
                circle={circle}
                onJoinClick={() => handleJoinClick(circle)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No circles found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {/* Join Modal */}
      {selectedCircle && (
        <JoinCircleModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          circle={selectedCircle}
        />
      )}
    </>
  );
}

'use client';

/**
 * Vouch List Component
 * Displays vouches received by a user
 */

import { useState, useEffect } from 'react';
import { Shield, Users, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { getVouchesForUser, getVouchStats, getTopVouchers } from '@/lib/farcaster/vouchSystem';
import type { Vouch, VouchStats } from '@/lib/farcaster/types';
import { formatDistanceToNow } from 'date-fns';

interface VouchListProps {
  address: string;
  fid?: number;
  showStats?: boolean;
  maxDisplay?: number;
}

export function VouchList({
  address,
  fid,
  showStats = true,
  maxDisplay = 10,
}: VouchListProps) {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [stats, setStats] = useState<VouchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVouches();
  }, [address, fid]);

  async function fetchVouches() {
    setIsLoading(true);
    
    try {
      const [allVouches, vouchStats] = await Promise.all([
        getTopVouchers(address, maxDisplay),
        showStats ? getVouchStats(address, fid) : Promise.resolve(null),
      ]);

      setVouches(allVouches);
      setStats(vouchStats);
    } catch (error) {
      console.error('Error fetching vouches:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (vouches.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No vouches yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Get vouches from your Farcaster connections to boost your credit score
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {showStats && stats && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vouch Statistics
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Vouches"
              value={stats.totalVouches}
              icon={<Shield className="w-4 h-4" />}
              color="purple"
            />
            <StatCard
              label="Verified"
              value={stats.verifiedVouches}
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="green"
            />
            <StatCard
              label="Circle Members"
              value={stats.circleVouches}
              icon={<Users className="w-4 h-4" />}
              color="blue"
            />
            <StatCard
              label="Strength"
              value={`${stats.vouchStrength}/100`}
              icon={<TrendingUp className="w-4 h-4" />}
              color="indigo"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Vouch Strength Score
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.vouchStrength}/100
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                style={{ width: `${stats.vouchStrength}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Vouches List */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vouches ({vouches.length})
          </h3>
        </div>

        <div className="space-y-3">
          {vouches.map((vouch) => (
            <VouchCard key={vouch.id} vouch={vouch} />
          ))}
        </div>
      </Card>
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function VouchCard({ vouch }: { vouch: Vouch }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <a
                href={`https://warpcast.com/${vouch.voucherUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                @{vouch.voucherUsername}
              </a>
              
              {vouch.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
              
              {vouch.isCircleMember && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                  <Users className="w-3 h-3" />
                  Circle
                </span>
              )}
            </div>

            {vouch.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                "{vouch.message}"
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(vouch.timestamp, { addSuffix: true })}
              </span>
              
              {vouch.onChainTxHash && (
                <a
                  href={`https://explorer.celo.org/tx/${vouch.onChainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  View on-chain →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

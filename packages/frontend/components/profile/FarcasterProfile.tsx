'use client';

/**
 * Farcaster Profile Display Component
 * Shows comprehensive Farcaster social profile data
 */

import { useState, useEffect } from 'react';
import { Users, MessageCircle, TrendingUp, Award, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { analyzeFarcasterProfile } from '@/lib/farcaster/socialGraph';
import type { FarcasterAnalysis } from '@/lib/farcaster/types';

interface FarcasterProfileProps {
  fid: number;
  showDetailedStats?: boolean;
  showCreditSignals?: boolean;
}

export function FarcasterProfile({
  fid,
  showDetailedStats = true,
  showCreditSignals = false,
}: FarcasterProfileProps) {
  const [analysis, setAnalysis] = useState<FarcasterAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fid]);

  async function fetchProfile() {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await analyzeFarcasterProfile(fid);
      if (!data) {
        setError('Failed to load Farcaster profile');
        return;
      }
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Error loading profile');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{error || 'Failed to load profile'}</p>
      </Card>
    );
  }

  const { user, engagement, socialGraph, creditSignals } = analysis;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {user.pfpUrl && (
            <img
              src={user.pfpUrl}
              alt={user.username}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.displayName || user.username}
              </h2>
              <span className="text-purple-500">@{user.username}</span>
            </div>
            
            {user.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {user.bio}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.followerCount.toLocaleString()}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  followers
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.followingCount.toLocaleString()}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  following
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {engagement.totalCasts}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  casts
                </span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`https://warpcast.com/${user.username}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Warpcast
          </Button>
        </div>
      </Card>

      {/* Engagement Stats */}
      {showDetailedStats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Metrics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Avg Likes"
              value={Math.round(engagement.averageLikes)}
              icon={<MessageCircle className="w-4 h-4" />}
            />
            <StatCard
              label="Avg Recasts"
              value={Math.round(engagement.averageRecasts)}
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Viral Casts"
              value={engagement.viralCasts}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              label="Engagement"
              value={`${Math.round(engagement.engagementRate * 100)}%`}
              icon={<Award className="w-4 h-4" />}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Consistency Score
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.round(engagement.consistencyScore * 100)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                style={{ width: `${engagement.consistencyScore * 100}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Social Graph */}
      {showDetailedStats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Social Network
          </h3>
          
          <div className="space-y-3">
            <NetworkStat
              label="Total Connections"
              value={socialGraph.followers.length + socialGraph.following.length}
            />
            <NetworkStat
              label="Mutual Connections"
              value={socialGraph.mutualConnections.length}
            />
            <NetworkStat
              label="Power Followers"
              value={socialGraph.powerFollowers.length}
              sublabel="Followers with >1000 followers"
            />
            <NetworkStat
              label="Active Followers"
              value={socialGraph.activeFollowers.length}
              sublabel="Active in last 30 days"
            />
          </div>
        </Card>
      )}

      {/* Credit Signals */}
      {showCreditSignals && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Social Credit Signals
          </h3>
          
          <div className="space-y-4">
            <ScoreBar
              label="Follower Score"
              score={creditSignals.followerScore}
              maxScore={100}
            />
            <ScoreBar
              label="Engagement Score"
              score={creditSignals.engagementScore}
              maxScore={100}
            />
            <ScoreBar
              label="Connection Quality"
              score={creditSignals.connectionQualityScore}
              maxScore={100}
            />
            <ScoreBar
              label="Account Age"
              score={creditSignals.accountAgeScore}
              maxScore={100}
            />
            <ScoreBar
              label="Activity Score"
              score={creditSignals.activityScore}
              maxScore={100}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Social Score
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {creditSignals.overallSocialScore}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTrustRatingColor(creditSignals.trustRating)}`}>
                {creditSignals.trustRating.toUpperCase()} TRUST
              </div>
            </div>
          </div>

          {creditSignals.riskFlags.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ Risk Flags:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                {creditSignals.riskFlags.map((flag, i) => (
                  <li key={i}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function NetworkStat({ label, value, sublabel }: { label: string; value: number; sublabel?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>
        )}
      </div>
      <span className="text-lg font-semibold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function ScoreBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getScoreColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getScoreColor(percentage: number): string {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getTrustRatingColor(rating: string): string {
  switch (rating) {
    case 'high':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'medium':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'low':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'untrusted':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

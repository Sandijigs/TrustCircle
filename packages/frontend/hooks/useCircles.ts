/**
 * useCircles Hook
 *
 * React hooks for fetching and managing lending circle data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import type {
  Circle,
  CircleDisplay,
  CircleStatus,
  Member,
  MemberDisplay,
} from '@/lib/circles/types';
import LendingCircleArtifact from '@/lib/contracts/artifacts/LendingCircle.sol/LendingCircle.json';
import { getContractAddresses } from '@/config/contracts';

const CIRCLE_STATUS_LABELS = {
  0: 'Active',
  1: 'Paused',
  2: 'Closed',
};

const REPUTATION_TIERS = {
  EXCELLENT: 150,
  GOOD: 100,
  FAIR: 50,
  POOR: 25,
};

/**
 * Get reputation tier label
 */
function getReputationTier(reputation: number): MemberDisplay['reputationTier'] {
  if (reputation >= REPUTATION_TIERS.EXCELLENT) return 'Excellent';
  if (reputation >= REPUTATION_TIERS.GOOD) return 'Good';
  if (reputation >= REPUTATION_TIERS.FAIR) return 'Fair';
  if (reputation >= REPUTATION_TIERS.POOR) return 'Poor';
  return 'At Risk';
}

/**
 * Format circle data for display
 */
function formatCircleDisplay(
  circle: Circle,
  userCreditScore?: number
): CircleDisplay {
  const totalLoans =
    Number(circle.completedLoans) + Number(circle.defaultedLoans);
  const successRate =
    totalLoans > 0
      ? (Number(circle.completedLoans) / totalLoans) * 100
      : 100;

  const isFull = circle.memberCount >= circle.maxMembers;
  const canJoin =
    !isFull &&
    circle.status === 0 &&
    (userCreditScore ? userCreditScore >= Number(circle.minCreditScore) : false);

  return {
    id: circle.id.toString(),
    name: circle.name,
    description: circle.description,
    creator: circle.creator,
    memberCount: Number(circle.memberCount),
    maxMembers: Number(circle.maxMembers),
    minCreditScore: Number(circle.minCreditScore),
    totalTreasury: formatUnits(circle.totalTreasury, 18),
    activeLoans: Number(circle.activeLoans),
    completedLoans: Number(circle.completedLoans),
    defaultedLoans: Number(circle.defaultedLoans),
    createdAt: new Date(Number(circle.createdAt) * 1000),
    status: circle.status,
    statusLabel: CIRCLE_STATUS_LABELS[circle.status],
    successRate,
    isFull,
    canJoin,
  };
}

/**
 * Format member data for display
 */
function formatMemberDisplay(member: Member): MemberDisplay {
  return {
    address: member.memberAddress,
    joinedAt: new Date(Number(member.joinedAt) * 1000),
    reputation: Number(member.reputation),
    loansReceived: Number(member.loansReceived),
    loansVotedOn: Number(member.loansVotedOn),
    vouchesGiven: Number(member.vouchesGiven),
    contributedAmount: formatUnits(member.contributedAmount, 18),
    isActive: member.isActive,
    reputationTier: getReputationTier(Number(member.reputation)),
  };
}

/**
 * Hook to fetch all circles
 */
export function useAllCircles() {
  const contractAddress = getContractAddresses().lendingCircle;

  // Get next circle ID to know how many circles exist
  const { data: nextCircleId } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: LendingCircleArtifact.abi,
    functionName: 'nextCircleId',
  });

  // Generate array of circle IDs to fetch
  const totalCircles = nextCircleId ? Number(nextCircleId) - 1 : 0;
  const circleIds = Array.from({ length: totalCircles }, (_, i) => BigInt(i + 1));

  // Batch fetch all circle data
  const { data: circlesData, isLoading, error: fetchError } = useReadContracts({
    contracts: circleIds.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: LendingCircleArtifact.abi,
      functionName: 'circles',
      args: [id],
    })),
  });

  // Transform raw data into display format
  const circles: CircleDisplay[] = [];

  if (circlesData) {
    circlesData.forEach((result, index) => {
      if (result.status === 'success' && result.result) {
        try {
          const circle = formatCircleDisplay(result.result as Circle);
          circles.push(circle);
        } catch (err) {
          console.error(`Error formatting circle ${circleIds[index]}:`, err);
        }
      }
    });
  }

  const error = fetchError ? 'Failed to fetch circles' : null;

  return { circles, isLoading, error, totalCircles: circles.length };
}

/**
 * Hook to fetch circles for a specific user
 */
export function useUserCircles(userAddress?: string) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const contractAddress = getContractAddresses().lendingCircle;

  // Get user's circle IDs
  const { data: rawCircleIds, isLoading: loadingIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: LendingCircleArtifact.abi,
    functionName: 'userCircles',
    args: targetAddress ? [targetAddress] : undefined,
  });

  // Convert to array of BigInt
  const circleIds = (rawCircleIds && Array.isArray(rawCircleIds)
    ? rawCircleIds.map((id: any) => BigInt(id))
    : []) as bigint[];

  // Batch fetch all circle data
  const { data: circlesData, isLoading: loadingCircles, error: fetchError } = useReadContracts({
    contracts: circleIds.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: LendingCircleArtifact.abi,
      functionName: 'circles',
      args: [id],
    })),
  });

  // Transform raw data into display format
  const userCircles: CircleDisplay[] = [];

  if (circlesData) {
    circlesData.forEach((result, index) => {
      if (result.status === 'success' && result.result) {
        try {
          const circle = formatCircleDisplay(result.result as Circle);
          userCircles.push(circle);
        } catch (err) {
          console.error(`Error formatting circle ${circleIds[index]}:`, err);
        }
      }
    });
  }

  const isLoading = loadingIds || loadingCircles;
  const error = fetchError ? 'Failed to fetch user circles' : null;

  return { userCircles, isLoading, error, circleCount: userCircles.length };
}

/**
 * Hook to fetch details for a specific circle
 */
export function useCircleDetails(circleId: string | number) {
  const [circle, setCircle] = useState<CircleDisplay | null>(null);
  const [members, setMembers] = useState<MemberDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddresses().lendingCircle;

  // Fetch circle data
  const { data: circleData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: LendingCircleArtifact.abi,
    functionName: 'circles',
    args: [BigInt(circleId)],
  });

  // Fetch circle members
  const { data: memberAddresses } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: LendingCircleArtifact.abi,
    functionName: 'getCircleMembers',
    args: [BigInt(circleId)],
  });

  useEffect(() => {
    async function processCircleData() {
      if (!circleData) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const formattedCircle = formatCircleDisplay(circleData as Circle);
        setCircle(formattedCircle);

        // TODO: Fetch member details for each address
        if (memberAddresses && Array.isArray(memberAddresses)) {
          console.log(`📊 Circle has ${memberAddresses.length} members`);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error processing circle data:', err);
        setError(err instanceof Error ? err.message : 'Failed to process circle data');
        setIsLoading(false);
      }
    }

    processCircleData();
  }, [circleData, memberAddresses]);

  return { circle, members, isLoading, error };
}

/**
 * Hook to check if user can join a circle
 */
export function useCanJoinCircle(circleId: string | number) {
  const { address } = useAccount();
  const { circle } = useCircleDetails(circleId);

  const [canJoin, setCanJoin] = useState(false);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (!circle || !address) {
      setCanJoin(false);
      setReason('Connect wallet to join');
      return;
    }

    if (circle.status !== 0) {
      setCanJoin(false);
      setReason('Circle is not active');
      return;
    }

    if (circle.isFull) {
      setCanJoin(false);
      setReason('Circle is full');
      return;
    }

    // TODO: Check if user is already a member
    // TODO: Check user's credit score

    setCanJoin(true);
    setReason('');
  }, [circle, address]);

  return { canJoin, reason };
}

/**
 * Hook to refresh circle data
 */
export function useRefreshCircles() {
  const refresh = useCallback(() => {
    // This will trigger a re-fetch when called
    // Implementation depends on how we structure the data fetching
    console.log('🔄 Refreshing circles...');
  }, []);

  return refresh;
}

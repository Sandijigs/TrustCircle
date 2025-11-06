/**
 * useLendingCircle Hook
 * 
 * React hook for managing lending circles
 * Handles circle operations, voting, and member management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract ABIs (simplified)
const LENDING_CIRCLE_ABI = [
  'function createCircle(string name, string description, uint256 maxMembers, uint256 minCreditScore) returns (uint256)',
  'function requestToJoin(uint256 circleId)',
  'function voteOnProposal(uint256 proposalId, bool support)',
  'function executeProposal(uint256 proposalId)',
  'function contributeToTreasury(uint256 circleId, address asset, uint256 amount)',
  'function vouchForMember(uint256 circleId, address member)',
  'function circles(uint256) view returns (tuple(uint256 id, string name, string description, address creator, uint256 memberCount, uint256 maxMembers, uint256 minCreditScore, uint256 totalTreasury, uint256 activeLoans, uint256 completedLoans, uint256 defaultedLoans, uint256 createdAt, uint8 status))',
  'function members(uint256 circleId, address member) view returns (tuple(address memberAddress, uint256 joinedAt, uint256 reputation, uint256 loansReceived, uint256 loansVotedOn, uint256 vouchesGiven, uint256 contributedAmount, bool isActive))',
  'function circleMembers(uint256 circleId, uint256 index) view returns (address)',
  'function userCircles(address user, uint256 index) view returns (uint256)',
  'function proposals(uint256) view returns (tuple(uint256 id, uint256 circleId, uint8 proposalType, address proposer, address targetAddress, uint256 loanAmount, uint256 createdAt, uint256 votesFor, uint256 votesAgainst, uint256 totalVoters, uint8 status, string description))',
] as const;

export interface Circle {
  id: number;
  name: string;
  description: string;
  creator: string;
  memberCount: number;
  maxMembers: number;
  minCreditScore: number;
  totalTreasury: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  createdAt: number;
  status: 'Active' | 'Paused' | 'Closed';
  defaultRate: number;
}

export interface Member {
  address: string;
  joinedAt: number;
  reputation: number;
  loansReceived: number;
  loansVotedOn: number;
  vouchesGiven: number;
  contributedAmount: number;
  isActive: boolean;
}

export interface Proposal {
  id: number;
  circleId: number;
  type: 'LoanApproval' | 'AddMember' | 'RemoveMember' | 'ChangeSettings';
  proposer: string;
  targetAddress: string;
  loanAmount: number;
  createdAt: number;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Executed';
  description: string;
}

export function useLendingCircle(circleId?: number) {
  const { address } = useAccount();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [userMember, setUserMember] = useState<Member | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = LENDING_CIRCLE_ADDRESS

  // Read circle data
  const { data: circleData, refetch: refetchCircle } = useContractRead({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'circles',
    args: circleId ? [BigInt(circleId)] : undefined,
    enabled: !!circleId,
    watch: true,
  });

  // Read user's member data
  const { data: memberData, refetch: refetchMember } = useContractRead({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'members',
    args: circleId && address ? [BigInt(circleId), address] : undefined,
    enabled: !!circleId && !!address,
    watch: true,
  });

  // Contract write functions
  const { writeAsync: createCircleWrite } = useContractWrite({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'createCircle',
  });

  const { writeAsync: requestToJoinWrite } = useContractWrite({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'requestToJoin',
  });

  const { writeAsync: voteWrite } = useContractWrite({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'voteOnProposal',
  });

  const { writeAsync: contributeWrite } = useContractWrite({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'contributeToTreasury',
  });

  const { writeAsync: vouchWrite } = useContractWrite({
    address: contractAddress,
    abi: LENDING_CIRCLE_ABI,
    functionName: 'vouchForMember',
  });

  // Parse circle data
  useEffect(() => {
    if (!circleData) return;

    const data = circleData as any;
    const totalLoans = Number(data.completedLoans) + Number(data.defaultedLoans);
    const defaultRate = totalLoans > 0 
      ? (Number(data.defaultedLoans) / totalLoans) * 100 
      : 0;

    setCircle({
      id: Number(data.id),
      name: data.name,
      description: data.description,
      creator: data.creator,
      memberCount: Number(data.memberCount),
      maxMembers: Number(data.maxMembers),
      minCreditScore: Number(data.minCreditScore),
      totalTreasury: Number(formatUnits(data.totalTreasury, 18)),
      activeLoans: Number(data.activeLoans),
      completedLoans: Number(data.completedLoans),
      defaultedLoans: Number(data.defaultedLoans),
      createdAt: Number(data.createdAt),
      status: ['Active', 'Paused', 'Closed'][data.status] as any,
      defaultRate,
    });
  }, [circleData]);

  // Parse member data
  useEffect(() => {
    if (!memberData) return;

    const data = memberData as any;
    setUserMember({
      address: data.memberAddress,
      joinedAt: Number(data.joinedAt),
      reputation: Number(data.reputation),
      loansReceived: Number(data.loansReceived),
      loansVotedOn: Number(data.loansVotedOn),
      vouchesGiven: Number(data.vouchesGiven),
      contributedAmount: Number(formatUnits(data.contributedAmount, 18)),
      isActive: data.isActive,
    });
  }, [memberData]);

  /**
   * Create a new lending circle
   */
  const createCircle = useCallback(async (params: {
    name: string;
    description: string;
    maxMembers: number;
    minCreditScore: number;
  }) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const tx = await createCircleWrite({
        args: [
          params.name,
          params.description,
          BigInt(params.maxMembers),
          BigInt(params.minCreditScore),
        ],
      });

      await tx.wait();
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create circle';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, createCircleWrite]);

  /**
   * Request to join a circle
   */
  const requestToJoin = useCallback(async (circleId: number) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const tx = await requestToJoinWrite({
        args: [BigInt(circleId)],
      });

      await tx.wait();
      await refetchCircle();
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request join';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, requestToJoinWrite, refetchCircle]);

  /**
   * Vote on a proposal
   */
  const voteOnProposal = useCallback(async (proposalId: number, support: boolean) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const tx = await voteWrite({
        args: [BigInt(proposalId), support],
      });

      await tx.wait();
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vote';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, voteWrite]);

  /**
   * Contribute to circle treasury
   */
  const contributeToTreasury = useCallback(async (
    circleId: number,
    assetAddress: string,
    amount: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const amountBN = parseUnits(amount, 18);
      
      // TODO: Approve token first
      
      const tx = await contributeWrite({
        args: [BigInt(circleId), assetAddress as `0x${string}`, amountBN],
      });

      await tx.wait();
      await refetchCircle();
      await refetchMember();
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to contribute';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, contributeWrite, refetchCircle, refetchMember]);

  /**
   * Vouch for a member
   */
  const vouchForMember = useCallback(async (circleId: number, memberAddress: string) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const tx = await vouchWrite({
        args: [BigInt(circleId), memberAddress as `0x${string}`],
      });

      await tx.wait();
      await refetchMember();
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to vouch';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, vouchWrite, refetchMember]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([refetchCircle(), refetchMember()]);
  }, [refetchCircle, refetchMember]);

  return {
    // Data
    circle,
    members,
    userMember,
    proposals,
    isLoading,
    error,
    isMember: userMember?.isActive || false,

    // Actions
    createCircle,
    requestToJoin,
    voteOnProposal,
    contributeToTreasury,
    vouchForMember,
    refresh,
  };
}

/**
 * Hook to get user's circles
 */
export function useUserCircles() {
  const { address } = useAccount();
  const [circles, setCircles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const contractAddress = LENDING_CIRCLE_ADDRESS

  useEffect(() => {
    if (!address) return;

    const fetchUserCircles = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch user's circles from contract
        // This would require iterating or maintaining an index
        setCircles([]);
      } catch (err) {
        console.error('Error fetching user circles:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCircles();
  }, [address]);

  return { circles, isLoading };
}

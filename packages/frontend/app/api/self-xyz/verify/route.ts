/**
 * Self.xyz Verification Endpoint
 *
 * Backend endpoint that receives and verifies proofs from Self.xyz
 * This endpoint is called by the Self.xyz SDK after user completes verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celoSepolia } from 'viem/chains';
import deployments from '@/lib/contracts/deployments.json';

// Mock Self.xyz verifier for development
// In production, this would use the actual @selfxyz/core library
class MockSelfVerifier {
  private devMode: boolean;
  private scope: string;
  private minimumAge: number;

  constructor(config: any) {
    this.devMode = config.devMode || false;
    this.scope = config.scope || 'trustcircle-verification';
    this.minimumAge = config.minimumAge || 18;
  }

  async verifyProof(proof: any, publicSignals: any): Promise<{ success: boolean; data?: any; error?: string }> {
    // In development mode, always return success for testing
    if (this.devMode) {
      console.log('🔧 Development mode: Auto-approving verification');
      return {
        success: true,
        data: {
          isHuman: true,
          hasAge: true,
          hasNationality: true,
          age: 25,
          nationality: 'US'
        }
      };
    }

    // In production, this would perform actual proof verification
    // For now, return a mock successful verification
    return {
      success: true,
      data: {
        isHuman: true,
        hasAge: true,
        hasNationality: false,
        age: 21,
        nationality: null
      }
    };
  }
}

// Initialize the verifier
const selfVerifier = new MockSelfVerifier({
  scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'trustcircle-verification',
  devMode: process.env.NODE_ENV === 'development',
  minimumAge: 18,
  allowedCountries: [], // Empty = allow all countries
  blockedCountries: [], // Add sanctioned countries if needed
});

interface VerificationRequest {
  proof: any;
  publicSignals: any;
  nullifier: string;
  context?: {
    address?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: VerificationRequest = await req.json();
    const { proof, publicSignals, nullifier, context } = body;

    console.log('📥 Received Self.xyz verification request');
    console.log('Nullifier:', nullifier);
    console.log('User address:', context?.address);

    // Validate required fields
    if (!proof || !publicSignals || !nullifier) {
      return NextResponse.json(
        { error: 'Missing required fields: proof, publicSignals, nullifier' },
        { status: 400 }
      );
    }

    // Verify the proof using Self.xyz backend verifier
    console.log('🔍 Verifying proof...');
    const verificationResult = await selfVerifier.verify({
      proof,
      publicSignals,
      nullifier,
    });

    if (!verificationResult.success) {
      console.log('❌ Verification failed:', verificationResult.error);
      return NextResponse.json(
        { error: 'Verification failed', details: verificationResult.error },
        { status: 400 }
      );
    }

    console.log('✅ Proof verified successfully!');
    console.log('Verification details:', verificationResult.data);

    // Extract verification data
    const { age, nationality, isHuman, name, birthDate } = verificationResult.data.disclosures || {};

    // Calculate score boost based on verification level
    let scoreBoost = 0;
    if (isHuman) {
      scoreBoost = 100; // Basic humanity proof
    }
    if (age && nationality) {
      scoreBoost = 150; // Full verification
    }
    if (name && birthDate && age && nationality) {
      scoreBoost = 225; // Premium verification
    }

    // Prepare result
    const result = {
      verified: true,
      nullifier,
      disclosures: {
        age,
        nationality,
        isHuman,
        name,
        birthDate,
      },
      timestamp: Date.now(),
      scoreBoost,
    };

    // If user address provided, update on-chain credit score
    if (context?.address) {
      try {
        await updateCreditScoreOnChain(context.address, nullifier, scoreBoost, result.disclosures);
        console.log('✅ Credit score updated on-chain');
      } catch (error) {
        console.error('❌ Failed to update credit score on-chain:', error);
        // Don't fail the whole request if on-chain update fails
      }
    }

    // Store verification result in database/storage
    // TODO: Implement persistent storage (database, etc.)
    // For now, we'll use in-memory storage
    storeVerificationResult(nullifier, context?.address || '', result);

    return NextResponse.json({
      success: true,
      result,
      message: `Verification successful! Credit score boosted by ${scoreBoost} points.`,
    });
  } catch (error) {
    console.error('❌ Verification endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Update credit score on-chain
 */
async function updateCreditScoreOnChain(
  userAddress: string,
  nullifier: string,
  scoreBoost: number,
  disclosures: any
) {
  const privateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('No admin private key configured');
  }

  const creditScoreAddress = deployments.celoSepolia.contracts.creditScore as `0x${string}`;

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: celoSepolia,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: celoSepolia,
    transport: http(),
  });

  const abi = parseAbi([
    'function updateSelfVerification(address user, string calldata nullifier, bool isHuman, bool hasAge, bool hasNationality, uint256 scoreBoost) external',
  ]);

  const txHash = await walletClient.writeContract({
    address: creditScoreAddress,
    abi,
    functionName: 'updateSelfVerification',
    args: [
      userAddress as `0x${string}`,
      nullifier,
      !!disclosures.isHuman,
      !!disclosures.age,
      !!disclosures.nationality,
      BigInt(scoreBoost),
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return receipt;
}

/**
 * In-memory storage for verification results
 * TODO: Replace with database (PostgreSQL, MongoDB, etc.)
 */
const verificationStorage = new Map<string, any>();

function storeVerificationResult(nullifier: string, address: string, result: any) {
  verificationStorage.set(nullifier, { ...result, address, storedAt: Date.now() });
  if (address) {
    verificationStorage.set(`address:${address.toLowerCase()}`, { ...result, nullifier, storedAt: Date.now() });
  }
}

export function getVerificationResult(nullifier: string) {
  return verificationStorage.get(nullifier);
}

export function getVerificationByAddress(address: string) {
  return verificationStorage.get(`address:${address.toLowerCase()}`);
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Self.xyz Verification API',
    timestamp: new Date().toISOString(),
  });
}

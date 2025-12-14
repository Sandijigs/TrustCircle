/**
 * Self.xyz Verification Status Check Endpoint
 *
 * Allows frontend to poll for verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVerificationByAddress } from '../verify/route';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const verificationId = searchParams.get('verificationId');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    // Check if verification exists for this address
    const verification = getVerificationByAddress(address);

    if (verification) {
      return NextResponse.json({
        verified: true,
        ...verification,
      });
    }

    // Not yet verified
    return NextResponse.json({
      verified: false,
      status: 'pending',
      message: 'Waiting for verification',
    });
  } catch (error) {
    console.error('Status check error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check verification status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

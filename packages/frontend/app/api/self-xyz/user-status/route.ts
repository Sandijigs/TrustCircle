/**
 * Self.xyz User Status Endpoint
 *
 * Returns verification status for a specific user address
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVerificationByAddress } from '../verify/route';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    const verification = getVerificationByAddress(address);

    if (verification && verification.verified) {
      return NextResponse.json({
        verified: true,
        result: verification,
      });
    }

    return NextResponse.json({
      verified: false,
    });
  } catch (error) {
    console.error('User status check error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check user status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

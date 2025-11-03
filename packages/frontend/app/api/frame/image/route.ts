/**
 * Farcaster Frame Image API
 * Generates dynamic images for Farcaster Frames
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateLoanFrameImage,
  generateCircleFrameImage,
  generateProfileFrameImage,
  generateFrameHTML,
  generateFrameImageDataURL,
} from '@/lib/farcaster/frameGenerator';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const loanId = searchParams.get('loanId');
  const fid = searchParams.get('fid');

  try {
    let html = '';

    switch (type) {
      case 'welcome':
        html = generateFrameHTML({
          title: 'Welcome to TrustCircle',
          subtitle: 'Decentralized lending powered by social reputation',
          stats: [
            { label: 'Total Loans', value: '1,234' },
            { label: 'Total Funded', value: '$2.5M' },
            { label: 'Active Circles', value: '156' },
          ],
          accentColor: '#8b5cf6',
        });
        break;

      case 'loan':
        if (loanId) {
          // In production, fetch real loan data
          const loanData = {
            amount: '1000',
            purpose: 'Small business expansion',
            creditScore: 720,
            borrower: `0x${loanId.slice(0, 6)}`,
          };
          html = generateLoanFrameImage(loanData);
        } else {
          html = generateDefaultFrame('Loan not found');
        }
        break;

      case 'browse':
        html = generateFrameHTML({
          title: 'Browse Loan Opportunities',
          subtitle: 'Fund loans and earn interest',
          stats: [
            { label: 'Available', value: '47' },
            { label: 'Avg APR', value: '8.5%' },
            { label: 'Avg Score', value: '680' },
          ],
          accentColor: '#3b82f6',
        });
        break;

      case 'request':
        html = generateFrameHTML({
          title: 'Request a Loan',
          subtitle: 'Get funded by your social circle',
          stats: [
            { label: 'Min Amount', value: '$100' },
            { label: 'Max Amount', value: '$10K' },
            { label: 'Avg Time', value: '2 days' },
          ],
          accentColor: '#10b981',
        });
        break;

      case 'circles':
        if (fid) {
          // In production, fetch user's circles
          html = generateCircleFrameImage({
            name: 'My Lending Circles',
            memberCount: 24,
            totalPooled: '12,500',
          });
        } else {
          html = generateDefaultFrame('User not found');
        }
        break;

      case 'profile':
        if (fid) {
          // In production, fetch real profile data
          html = generateProfileFrameImage({
            username: `user_${fid}`,
            creditScore: 720,
            totalVouches: 15,
            loansCompleted: 5,
          });
        } else {
          html = generateDefaultFrame('Profile not found');
        }
        break;

      case 'fund':
        html = generateFrameHTML({
          title: 'Fund This Loan',
          subtitle: 'Help a borrower achieve their goals',
          stats: [
            { label: 'Amount', value: '$1,000' },
            { label: 'APR', value: '8.5%' },
            { label: 'Term', value: '6 months' },
          ],
          accentColor: '#f59e0b',
        });
        break;

      case 'milestone':
        html = generateFrameHTML({
          title: '🎉 Milestone Achieved!',
          subtitle: 'Loan 50% repaid',
          stats: [
            { label: 'Repaid', value: '$500' },
            { label: 'Remaining', value: '$500' },
            { label: 'Days Left', value: '90' },
          ],
          accentColor: '#10b981',
        });
        break;

      default:
        html = generateDefaultFrame('TrustCircle');
    }

    // Convert HTML to image
    // In production, use proper rendering service (Satori, Vercel OG, Puppeteer)
    // For now, return SVG data URL
    const dataUrl = generateFrameImageDataURL(html);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('Frame image generation error:', error);
    
    // Return error frame
    const errorHtml = generateDefaultFrame('Error generating image');
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

function generateDefaultFrame(message: string): string {
  return generateFrameHTML({
    title: message,
    subtitle: 'TrustCircle - Decentralized Lending',
    backgroundColor: '#1a1a2e',
    accentColor: '#8b5cf6',
  });
}

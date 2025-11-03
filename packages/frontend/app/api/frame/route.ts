/**
 * Farcaster Frame API - Main Frame Handler
 * Handles Frame interactions for loan sharing and social features
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateFrameMetadata,
  generateLoanFrameImage,
  generateFrameImageDataURL,
} from '@/lib/farcaster/frameGenerator';

export const runtime = 'edge';

/**
 * GET - Initial Frame Display
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'welcome';
  const loanId = searchParams.get('loanId');

  let html = '';

  // Generate frame image based on type
  if (type === 'welcome') {
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>TrustCircle - Decentralized Lending</title>
          
          ${Object.entries(
            generateFrameMetadata({
              imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=welcome`,
              buttons: [
                { label: '🔍 Browse Loans', action: 'post' },
                { label: '💰 Request Loan', action: 'post' },
                { label: '🤝 My Circles', action: 'post' },
                { label: '📊 My Profile', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/profile` },
              ],
              postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            })
          )
            .map(([key, value]) => `<meta property="${key}" content="${value}">`)
            .join('\n          ')}
        </head>
        <body>
          <h1>TrustCircle</h1>
          <p>Decentralized lending powered by social reputation</p>
        </body>
      </html>
    `;
  } else if (type === 'loan' && loanId) {
    // Fetch loan data (mock for now)
    const loanData = {
      amount: '1000',
      purpose: 'Small business expansion',
      creditScore: 720,
      borrower: '0x1234...5678',
    };

    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Loan Request - TrustCircle</title>
          
          ${Object.entries(
            generateFrameMetadata({
              imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=loan&loanId=${loanId}`,
              buttons: [
                { label: '✅ Fund Loan', action: 'post' },
                { label: '👤 View Profile', action: 'post' },
                { label: '📋 Details', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/borrow/${loanId}` },
              ],
              postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
              state: JSON.stringify({ loanId }),
            })
          )
            .map(([key, value]) => `<meta property="${key}" content="${value}">`)
            .join('\n          ')}
        </head>
        <body>
          <h1>Loan Request: $${loanData.amount}</h1>
          <p>${loanData.purpose}</p>
        </body>
      </html>
    `;
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

/**
 * POST - Handle Frame Button Clicks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { untrustedData } = body;
    
    if (!untrustedData) {
      return NextResponse.json({ error: 'Invalid frame data' }, { status: 400 });
    }

    const { buttonIndex, fid, state } = untrustedData;
    const parsedState = state ? JSON.parse(state) : {};

    // Handle different button actions
    let responseHtml = '';

    // Welcome frame button clicks
    if (buttonIndex === 1) {
      // Browse Loans
      responseHtml = generateBrowseLoansFrame(fid);
    } else if (buttonIndex === 2) {
      // Request Loan
      responseHtml = generateRequestLoanFrame(fid);
    } else if (buttonIndex === 3) {
      // My Circles
      responseHtml = generateMyCirclesFrame(fid);
    }

    // Loan frame button clicks
    if (parsedState.loanId) {
      if (buttonIndex === 1) {
        // Fund Loan
        responseHtml = generateFundLoanFrame(parsedState.loanId, fid);
      } else if (buttonIndex === 2) {
        // View Profile
        responseHtml = generateProfileFrame(parsedState.borrowerFid || fid);
      }
    }

    return new NextResponse(responseHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Frame POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Frame Generation Helpers

function generateBrowseLoansFrame(fid: number): string {
  // Mock loan list - in production, fetch from database
  const loans = [
    { id: '1', amount: '500', purpose: 'Education', score: 680 },
    { id: '2', amount: '1000', purpose: 'Business', score: 720 },
    { id: '3', amount: '750', purpose: 'Emergency', score: 650 },
  ];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Browse Loans - TrustCircle</title>
        
        ${Object.entries(
          generateFrameMetadata({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=browse`,
            buttons: [
              { label: `💰 $${loans[0].amount} (${loans[0].purpose})`, action: 'post' },
              { label: `💰 $${loans[1].amount} (${loans[1].purpose})`, action: 'post' },
              { label: `💰 $${loans[2].amount} (${loans[2].purpose})`, action: 'post' },
              { label: '◀️ Back', action: 'post' },
            ],
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            state: JSON.stringify({ view: 'browse', loans }),
          })
        )
          .map(([key, value]) => `<meta property="${key}" content="${value}">`)
          .join('\n        ')}
      </head>
      <body>
        <h1>Available Loans</h1>
        <p>Click to view loan details</p>
      </body>
    </html>
  `;
}

function generateRequestLoanFrame(fid: number): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Request Loan - TrustCircle</title>
        
        ${Object.entries(
          generateFrameMetadata({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=request`,
            buttons: [
              { label: '📝 Go to App', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/borrow` },
              { label: '◀️ Back', action: 'post' },
            ],
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            input: 'Enter loan amount (USD)',
          })
        )
          .map(([key, value]) => `<meta property="${key}" content="${value}">`)
          .join('\n        ')}
      </head>
      <body>
        <h1>Request a Loan</h1>
        <p>Connect your wallet in the app to request a loan</p>
      </body>
    </html>
  `;
}

function generateMyCirclesFrame(fid: number): string {
  // Mock circles - in production, fetch user's circles
  const circles = [
    { id: '1', name: 'Web3 Builders', members: 12, pooled: '5000' },
    { id: '2', name: 'Local Community', members: 8, pooled: '2500' },
  ];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>My Circles - TrustCircle</title>
        
        ${Object.entries(
          generateFrameMetadata({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=circles&fid=${fid}`,
            buttons: [
              { label: `${circles[0].name} (${circles[0].members} members)`, action: 'post' },
              { label: `${circles[1].name} (${circles[1].members} members)`, action: 'post' },
              { label: '➕ Create Circle', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/circles/create` },
              { label: '◀️ Back', action: 'post' },
            ],
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
            state: JSON.stringify({ view: 'circles', fid }),
          })
        )
          .map(([key, value]) => `<meta property="${key}" content="${value}">`)
          .join('\n        ')}
      </head>
      <body>
        <h1>My Lending Circles</h1>
        <p>Manage your circles</p>
      </body>
    </html>
  `;
}

function generateFundLoanFrame(loanId: string, fid: number): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Fund Loan - TrustCircle</title>
        
        ${Object.entries(
          generateFrameMetadata({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=fund&loanId=${loanId}`,
            buttons: [
              { label: '✅ Confirm in App', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/lend/${loanId}` },
              { label: '◀️ Back', action: 'post' },
            ],
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
          })
        )
          .map(([key, value]) => `<meta property="${key}" content="${value}">`)
          .join('\n        ')}
      </head>
      <body>
        <h1>Fund Loan</h1>
        <p>Connect your wallet to fund this loan</p>
      </body>
    </html>
  `;
}

function generateProfileFrame(fid: number): string {
  // Mock profile data - in production, fetch from API
  const profile = {
    username: 'farcaster_user',
    creditScore: 720,
    totalVouches: 15,
    loansCompleted: 5,
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Profile - TrustCircle</title>
        
        ${Object.entries(
          generateFrameMetadata({
            imageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image?type=profile&fid=${fid}`,
            buttons: [
              { label: '🤝 Vouch', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${fid}` },
              { label: '📊 View Details', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${fid}` },
              { label: '◀️ Back', action: 'post' },
            ],
            postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame`,
          })
        )
          .map(([key, value]) => `<meta property="${key}" content="${value}">`)
          .join('\n        ')}
      </head>
      <body>
        <h1>@{profile.username}</h1>
        <p>Credit Score: {profile.creditScore}</p>
      </body>
    </html>
  `;
}

/**
 * Farcaster Frame Image Generator
 * Generates OG images for Farcaster Frames using HTML/CSS to SVG
 */

export interface FrameImageConfig {
  title: string;
  subtitle?: string;
  stats?: Array<{ label: string; value: string }>;
  backgroundColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

/**
 * Generate Frame image HTML
 * In production, use a service like Satori or Vercel OG to convert to image
 */
export function generateFrameHTML(config: FrameImageConfig): string {
  const {
    title,
    subtitle,
    stats = [],
    backgroundColor = '#1a1a2e',
    accentColor = '#8b5cf6',
  } = config;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            width: 1200px;
            height: 630px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${backgroundColor};
            background-image: 
              radial-gradient(circle at 20% 50%, ${accentColor}22 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${accentColor}22 0%, transparent 50%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: white;
          }
          
          .container {
            width: 90%;
            max-width: 1000px;
            padding: 60px;
          }
          
          .logo {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 40px;
          }
          
          .logo-icon {
            width: 60px;
            height: 60px;
            background: ${accentColor};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
          }
          
          .logo-text {
            font-size: 28px;
            font-weight: 700;
            color: white;
          }
          
          h1 {
            font-size: 64px;
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
            background: linear-gradient(135deg, white, ${accentColor});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .subtitle {
            font-size: 32px;
            color: #cbd5e1;
            margin-bottom: 50px;
            font-weight: 400;
          }
          
          .stats {
            display: flex;
            gap: 40px;
            margin-top: 50px;
          }
          
          .stat {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 30px;
          }
          
          .stat-label {
            font-size: 20px;
            color: #94a3b8;
            margin-bottom: 8px;
            font-weight: 500;
          }
          
          .stat-value {
            font-size: 42px;
            font-weight: 800;
            color: ${accentColor};
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-icon">🔵</div>
            <div class="logo-text">TrustCircle</div>
          </div>
          
          <h1>${escapeHtml(title)}</h1>
          
          ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
          
          ${stats.length > 0 ? `
            <div class="stats">
              ${stats.map(stat => `
                <div class="stat">
                  <div class="stat-label">${escapeHtml(stat.label)}</div>
                  <div class="stat-value">${escapeHtml(stat.value)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate SVG image from HTML (simplified version)
 * In production, use proper HTML-to-image library
 */
export function generateFrameSVG(html: string): string {
  // This is a placeholder - in production, use a proper rendering service
  // like Satori, Puppeteer, or Vercel OG
  
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <foreignObject width="1200" height="630">
        ${html}
      </foreignObject>
    </svg>
  `;
}

/**
 * Generate loan opportunity frame image
 */
export function generateLoanFrameImage(loanData: {
  amount: string;
  purpose: string;
  creditScore: number;
  borrower: string;
}): string {
  return generateFrameHTML({
    title: `Loan Request: $${loanData.amount}`,
    subtitle: loanData.purpose,
    stats: [
      { label: 'Amount', value: `$${loanData.amount}` },
      { label: 'Credit Score', value: loanData.creditScore.toString() },
      { label: 'Borrower', value: `${loanData.borrower.slice(0, 6)}...` },
    ],
    accentColor: '#3b82f6',
  });
}

/**
 * Generate circle invitation frame image
 */
export function generateCircleFrameImage(circleData: {
  name: string;
  memberCount: number;
  totalPooled: string;
}): string {
  return generateFrameHTML({
    title: `Join ${circleData.name}`,
    subtitle: 'Lending Circle Invitation',
    stats: [
      { label: 'Members', value: circleData.memberCount.toString() },
      { label: 'Total Pooled', value: `$${circleData.totalPooled}` },
      { label: 'Available', value: 'Yes' },
    ],
    accentColor: '#8b5cf6',
  });
}

/**
 * Generate repayment milestone frame image
 */
export function generateMilestoneFrameImage(milestoneData: {
  loanAmount: string;
  percentRepaid: number;
  daysRemaining: number;
}): string {
  return generateFrameHTML({
    title: '🎉 Loan Progress',
    subtitle: `${milestoneData.percentRepaid}% Repaid!`,
    stats: [
      { label: 'Loan Amount', value: `$${milestoneData.loanAmount}` },
      { label: 'Repaid', value: `${milestoneData.percentRepaid}%` },
      { label: 'Days Left', value: milestoneData.daysRemaining.toString() },
    ],
    accentColor: '#10b981',
  });
}

/**
 * Generate profile showcase frame image
 */
export function generateProfileFrameImage(profileData: {
  username: string;
  creditScore: number;
  totalVouches: number;
  loansCompleted: number;
}): string {
  return generateFrameHTML({
    title: `@${profileData.username}`,
    subtitle: 'TrustCircle Profile',
    stats: [
      { label: 'Credit Score', value: profileData.creditScore.toString() },
      { label: 'Vouches', value: profileData.totalVouches.toString() },
      { label: 'Loans', value: profileData.loansCompleted.toString() },
    ],
    accentColor: '#8b5cf6',
  });
}

// Helper function
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate data URL for frame image
 * In production, upload to CDN and return URL
 */
export function generateFrameImageDataURL(html: string): string {
  const svg = generateFrameSVG(html);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generate metadata for Farcaster Frame
 */
export function generateFrameMetadata(config: {
  imageUrl: string;
  buttons: Array<{ label: string; action?: string; target?: string }>;
  postUrl?: string;
  input?: string;
  state?: string;
}): Record<string, string> {
  const metadata: Record<string, string> = {
    'fc:frame': 'vNext',
    'fc:frame:image': config.imageUrl,
    'fc:frame:image:aspect_ratio': '1.91:1',
  };

  if (config.postUrl) {
    metadata['fc:frame:post_url'] = config.postUrl;
  }

  if (config.input) {
    metadata['fc:frame:input:text'] = config.input;
  }

  if (config.state) {
    metadata['fc:frame:state'] = config.state;
  }

  config.buttons.forEach((button, index) => {
    const idx = index + 1;
    metadata[`fc:frame:button:${idx}`] = button.label;
    
    if (button.action) {
      metadata[`fc:frame:button:${idx}:action`] = button.action;
    }
    
    if (button.target) {
      metadata[`fc:frame:button:${idx}:target`] = button.target;
    }
  });

  return metadata;
}

# TrustCircle - Vercel Deployment Guide

## Prerequisites

1. **Vercel CLI** (optional, but recommended)
   ```bash
   npm install -g vercel
   ```

2. **Vercel Account** - Sign up at https://vercel.com if you haven't already

## Deployment Methods

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy to Preview**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked "Which scope do you want to deploy to?", select your account
   - When asked "Link to existing project?", choose "N" (first time)
   - Project name: `trustcircle` (or your preferred name)
   - Directory: `./` (current directory)

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard (GitHub Integration)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `trustcircle` repository
   - Configure project:
     - Framework Preset: **Next.js**
     - Root Directory: `./` (leave default)
     - Build Command: `npm run build:frontend`
     - Output Directory: `packages/frontend/.next`
     - Install Command: `npm install`

3. **Set Environment Variables** (see below)

4. **Deploy**

## Required Environment Variables

Set these in the Vercel dashboard or via CLI:

```bash
# WalletConnect Project ID (Required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (Already in your .env.local)
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x1fe0Ae34F730e0bbBBb7EdBB5E60cC20d9F8DC54
NEXT_PUBLIC_LOAN_MANAGER_ADDRESS=0x4FdBAD11fF17d1EE62c59D3bC7dE30BCc5F23dD4
NEXT_PUBLIC_CREDIT_SCORE_ADDRESS=0xfe8D19d5da9B6e16BD90EC30DcB64f29C8D9e71e
NEXT_PUBLIC_FARCASTER_VERIFIER_ADDRESS=0xe7De885F88f8e3a8F6e8abb07efFb9C2Ac3d6e23
NEXT_PUBLIC_WORLDCOIN_VERIFIER_ADDRESS=0x9A28F40F5Ed0bd5f75FABcc4e93d02e77b88c60b
NEXT_PUBLIC_LENDING_CIRCLE_ADDRESS=0x64F43A39fb7f08A94508A8e2b8F72515573cb3eB

# Celo Sepolia Network
NEXT_PUBLIC_CHAIN_ID=44787
NEXT_PUBLIC_RPC_URL=https://alfajores-forno.celo-testnet.org

# Anthropic API Key (for AI features, optional)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Neynar API Key (for Farcaster, optional)
NEYNAR_API_KEY=your_neynar_key_here
```

### Setting Environment Variables via CLI

```bash
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
# Paste your value when prompted

vercel env add NEXT_PUBLIC_LENDING_POOL_ADDRESS
# Paste: 0x1fe0Ae34F730e0bbBBb7EdBB5E60cC20d9F8DC54

# Repeat for all variables...
```

### Setting Environment Variables via Dashboard

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - Value: `your_value_here`
   - Environment: Production, Preview, Development (select all)
4. Click **Save**

## Post-Deployment Steps

1. **Get your deployment URL**
   - CLI: Will be shown after deployment
   - Dashboard: Click on your deployment to see the URL

2. **Test the deployment**
   - Visit your URL (e.g., `https://trustcircle.vercel.app`)
   - Connect your wallet
   - Test basic functionality:
     - Credit score display
     - Loan creation
     - Circle browsing

3. **Update WalletConnect allowed origins** (if needed)
   - Go to https://cloud.walletconnect.com
   - Add your Vercel URL to allowed origins

## Troubleshooting

### Build Fails

**Check build logs** in Vercel dashboard or CLI output

Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

**Solution:**
```bash
# Test build locally first
npm run build:frontend

# If it works locally but fails on Vercel:
# - Check Node.js version (should be >=18)
# - Verify all env vars are set
# - Check vercel.json configuration
```

### Environment Variables Not Working

- Ensure all `NEXT_PUBLIC_*` variables are set
- Redeploy after adding env vars: `vercel --prod`
- Check that variable names match exactly (case-sensitive)

### Contract Calls Failing

- Verify contract addresses are correct
- Check RPC URL is accessible
- Ensure you're on Celo Sepolia testnet

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` automatically deploys to production
- Pull requests create preview deployments
- Can configure deploy hooks for custom workflows

## Custom Domain (Optional)

1. Go to Project **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

## Monitoring

- **Analytics**: Vercel dashboard shows page views, performance
- **Logs**: Real-time function logs in dashboard
- **Speed Insights**: Enable in project settings for Core Web Vitals

## Cost

- **Hobby plan**: Free for personal projects
- **Pro plan**: $20/month for commercial use
- Your project should fit well within free tier limits

---

## Quick Deploy Checklist

- [ ] Created Vercel account
- [ ] Installed Vercel CLI (optional)
- [ ] Set all environment variables
- [ ] Tested build locally (`npm run build:frontend`)
- [ ] Deployed to preview (`vercel`)
- [ ] Tested preview deployment
- [ ] Deployed to production (`vercel --prod`)
- [ ] Updated WalletConnect allowed origins
- [ ] Tested production deployment

---

**Your deployed app will be live at:** `https://trustcircle-{random}.vercel.app` or your custom domain!

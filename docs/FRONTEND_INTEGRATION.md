# 🎨 Frontend Integration Guide

Complete guide for integrating the TrustCircle frontend with smart contracts.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Contract Integration](#contract-integration)
- [Component Examples](#component-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The TrustCircle frontend is built with:

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5.6**
- **Tailwind CSS 3.4**
- **Wagmi 2.12** (Ethereum interactions)
- **Viem 2.21** (Ethereum library)
- **Reown AppKit** (WalletConnect)

---

## Prerequisites

Before starting frontend integration, ensure:

1. ✅ Smart contracts deployed and verified
2. ✅ Contract addresses saved in `deployments.json`
3. ✅ WalletConnect Project ID obtained
4. ✅ Node.js 18+ installed

---

## Setup

### Step 1: Contract Configuration

Create `packages/frontend/config/contracts.ts`:

```typescript
import { Address } from 'viem'
import deployments from '../../contracts/deployments.json'

// Import ABIs
import CreditScoreABI from '../../contracts/artifacts/contracts/CreditScore.sol/CreditScore.json'
import VerificationSBTABI from '../../contracts/artifacts/contracts/VerificationSBT.sol/VerificationSBT.json'
import LendingPoolABI from '../../contracts/artifacts/contracts/LendingPool.sol/LendingPool.json'
import CollateralManagerABI from '../../contracts/artifacts/contracts/CollateralManager.sol/CollateralManager.json'
import LoanManagerABI from '../../contracts/artifacts/contracts/LoanManager.sol/LoanManager.json'
import LendingCircleABI from '../../contracts/artifacts/contracts/LendingCircle.sol/LendingCircle.json'

// Network selection
const network = process.env.NEXT_PUBLIC_DEFAULT_NETWORK === 'mainnet' ? 'celo' : 'celoSepolia'
const networkDeployment = deployments[network]

if (!networkDeployment) {
  throw new Error(`No deployment found for network: ${network}`)
}

// Contract addresses
export const CONTRACTS = {
  creditScore: {
    address: networkDeployment.contracts.creditScore as Address,
    abi: CreditScoreABI.abi,
  },
  verificationSBT: {
    address: networkDeployment.contracts.verificationSBT as Address,
    abi: VerificationSBTABI.abi,
  },
  lendingPool: {
    address: networkDeployment.contracts.lendingPool as Address,
    abi: LendingPoolABI.abi,
  },
  collateralManager: {
    address: networkDeployment.contracts.collateralManager as Address,
    abi: CollateralManagerABI.abi,
  },
  loanManager: {
    address: networkDeployment.contracts.loanManager as Address,
    abi: LoanManagerABI.abi,
  },
  lendingCircle: {
    address: networkDeployment.contracts.lendingCircle as Address,
    abi: LendingCircleABI.abi,
  },
} as const

// Token addresses
export const TOKENS = {
  cUSD: networkDeployment.tokens.cUSD as Address,
  cEUR: networkDeployment.tokens.cEUR as Address,
  cREAL: networkDeployment.tokens.cREAL as Address,
} as const

// Token metadata
export const TOKEN_METADATA = {
  [TOKENS.cUSD]: {
    symbol: 'cUSD',
    name: 'Celo Dollar',
    decimals: 18,
    icon: '💵',
  },
  [TOKENS.cEUR]: {
    symbol: 'cEUR',
    name: 'Celo Euro',
    decimals: 18,
    icon: '💶',
  },
  [TOKENS.cREAL]: {
    symbol: 'cREAL',
    name: 'Celo Real',
    decimals: 18,
    icon: '🇧🇷',
  },
} as const

export type TokenAddress = keyof typeof TOKEN_METADATA
```

### Step 2: Custom Hooks

Create `packages/frontend/hooks/useContracts.ts`:

```typescript
import { useContractRead, useContractWrite, useAccount } from 'wagmi'
import { CONTRACTS } from '@/config/contracts'
import { parseUnits, formatUnits } from 'viem'

// ==================== CREDIT SCORE ====================

export function useCreditScore() {
  const { address } = useAccount()

  const { data: score, isLoading } = useContractRead({
    ...CONTRACTS.creditScore,
    functionName: 'getCreditScore',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  const { data: history } = useContractRead({
    ...CONTRACTS.creditScore,
    functionName: 'getScoreHistory',
    args: [address],
    enabled: !!address,
  })

  return {
    score: score ? Number(score) : 0,
    history: history as bigint[] | undefined,
    isLoading,
  }
}

// ==================== VERIFICATION ====================

export function useVerification() {
  const { address } = useAccount()

  const { data: level } = useContractRead({
    ...CONTRACTS.verificationSBT,
    functionName: 'getVerificationLevel',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  const { data: isVerified } = useContractRead({
    ...CONTRACTS.verificationSBT,
    functionName: 'isUserVerified',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  return {
    level: level ? Number(level) : 0,
    isVerified: !!isVerified,
  }
}

// ==================== LENDING POOL ====================

export function useLendingPool(tokenAddress: string) {
  const { address } = useAccount()

  // Get pool info
  const { data: pool } = useContractRead({
    ...CONTRACTS.lendingPool,
    functionName: 'pools',
    args: [tokenAddress],
    watch: true,
  })

  // Get user balance in pool
  const { data: userShares } = useContractRead({
    ...CONTRACTS.lendingPool,
    functionName: 'getUserShares',
    args: [address, tokenAddress],
    enabled: !!address,
    watch: true,
  })

  // Deposit function
  const { write: deposit, isLoading: isDepositing } = useContractWrite({
    ...CONTRACTS.lendingPool,
    functionName: 'deposit',
  })

  // Withdraw function
  const { write: withdraw, isLoading: isWithdrawing } = useContractWrite({
    ...CONTRACTS.lendingPool,
    functionName: 'withdraw',
  })

  return {
    pool,
    userShares: userShares ? formatUnits(userShares as bigint, 18) : '0',
    deposit: (amount: string) => {
      deposit({
        args: [tokenAddress, parseUnits(amount, 18)],
      })
    },
    withdraw: (shares: string) => {
      withdraw({
        args: [tokenAddress, parseUnits(shares, 18)],
      })
    },
    isDepositing,
    isWithdrawing,
  }
}

// ==================== LOAN MANAGER ====================

export function useLoans() {
  const { address } = useAccount()

  // Get user loans
  const { data: loans, refetch } = useContractRead({
    ...CONTRACTS.loanManager,
    functionName: 'getUserLoans',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  // Request loan
  const { write: requestLoan, isLoading: isRequesting } = useContractWrite({
    ...CONTRACTS.loanManager,
    functionName: 'requestLoan',
  })

  // Make payment
  const { write: makePayment, isLoading: isPaying } = useContractWrite({
    ...CONTRACTS.loanManager,
    functionName: 'makePayment',
  })

  return {
    loans: loans as any[] | undefined,
    requestLoan: (amount: string, token: string, duration: number) => {
      requestLoan({
        args: [parseUnits(amount, 18), token, duration],
      })
    },
    makePayment: (loanId: number, amount: string) => {
      makePayment({
        args: [BigInt(loanId), parseUnits(amount, 18)],
      })
    },
    refetch,
    isRequesting,
    isPaying,
  }
}

// ==================== LENDING CIRCLE ====================

export function useLendingCircle(circleId?: number) {
  const { address } = useAccount()

  // Get circle info
  const { data: circle } = useContractRead({
    ...CONTRACTS.lendingCircle,
    functionName: 'circles',
    args: [BigInt(circleId || 0)],
    enabled: !!circleId,
    watch: true,
  })

  // Get user circles
  const { data: userCircles } = useContractRead({
    ...CONTRACTS.lendingCircle,
    functionName: 'getUserCircles',
    args: [address],
    enabled: !!address,
    watch: true,
  })

  // Create circle
  const { write: createCircle, isLoading: isCreating } = useContractWrite({
    ...CONTRACTS.lendingCircle,
    functionName: 'createCircle',
  })

  // Join circle
  const { write: joinCircle, isLoading: isJoining } = useContractWrite({
    ...CONTRACTS.lendingCircle,
    functionName: 'joinCircle',
  })

  return {
    circle,
    userCircles: userCircles as bigint[] | undefined,
    createCircle: (name: string) => {
      createCircle({
        args: [name],
      })
    },
    joinCircle: (id: number) => {
      joinCircle({
        args: [BigInt(id)],
      })
    },
    isCreating,
    isJoining,
  }
}
```

---

## Component Examples

### 1. Credit Score Display

```typescript
// components/dashboard/CreditScoreCard.tsx
'use client'

import { useCreditScore } from '@/hooks/useContracts'

export function CreditScoreCard() {
  const { score, isLoading } = useCreditScore()

  if (isLoading) {
    return <div className="animate-pulse">Loading score...</div>
  }

  // Calculate color based on score
  const getScoreColor = (score: number) => {
    if (score >= 740) return 'text-green-500'
    if (score >= 670) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreRating = (score: number) => {
    if (score >= 740) return 'Excellent'
    if (score >= 670) return 'Good'
    if (score >= 580) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Credit Score</h3>
      <div className="text-center">
        <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className="text-gray-500 mt-2">{getScoreRating(score)}</div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span>300</span>
          <span>850</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className={`h-2 rounded-full ${getScoreColor(score)}`}
            style={{ width: `${((score - 300) / 550) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
```

### 2. Loan Request Form

```typescript
// components/lending/LoanRequestForm.tsx
'use client'

import { useState } from 'react'
import { useLoans } from '@/hooks/useContracts'
import { TOKENS } from '@/config/contracts'

export function LoanRequestForm() {
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState(4)
  const [token, setToken] = useState(TOKENS.cUSD)
  
  const { requestLoan, isRequesting } = useLoans()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestLoan(amount, token, duration)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Loan Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Currency
        </label>
        <select
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value={TOKENS.cUSD}>cUSD (Celo Dollar)</option>
          <option value={TOKENS.cEUR}>cEUR (Celo Euro)</option>
          <option value={TOKENS.cREAL}>cREAL (Brazilian Real)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Duration (weeks)
        </label>
        <input
          type="range"
          min="1"
          max="52"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-center text-sm text-gray-500">
          {duration} weeks
        </div>
      </div>

      <button
        type="submit"
        disabled={isRequesting || !amount}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {isRequesting ? 'Requesting...' : 'Request Loan'}
      </button>
    </form>
  )
}
```

### 3. Pool Stats Dashboard

```typescript
// components/lending/PoolStats.tsx
'use client'

import { useLendingPool } from '@/hooks/useContracts'
import { TOKENS, TOKEN_METADATA } from '@/config/contracts'
import { formatUnits } from 'viem'

export function PoolStats() {
  const pools = [
    { address: TOKENS.cUSD, ...TOKEN_METADATA[TOKENS.cUSD] },
    { address: TOKENS.cEUR, ...TOKEN_METADATA[TOKENS.cEUR] },
    { address: TOKENS.cREAL, ...TOKEN_METADATA[TOKENS.cREAL] },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {pools.map((token) => (
        <PoolCard key={token.address} tokenAddress={token.address} />
      ))}
    </div>
  )
}

function PoolCard({ tokenAddress }: { tokenAddress: string }) {
  const { pool, userShares } = useLendingPool(tokenAddress)
  const metadata = TOKEN_METADATA[tokenAddress as keyof typeof TOKEN_METADATA]

  if (!pool) return null

  const totalLiquidity = formatUnits(pool.totalLiquidity as bigint, 18)
  const utilization = pool.utilizationRate ? Number(pool.utilizationRate) / 100 : 0
  const currentRate = pool.currentBorrowRate ? Number(pool.currentBorrowRate) / 100 : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-3xl">{metadata.icon}</span>
        <div>
          <h3 className="font-semibold">{metadata.symbol}</h3>
          <p className="text-sm text-gray-500">{metadata.name}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-500">Total Liquidity</div>
          <div className="text-xl font-bold">
            {Number(totalLiquidity).toLocaleString()} {metadata.symbol}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Utilization Rate</div>
          <div className="text-lg">{utilization.toFixed(2)}%</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Current APY</div>
          <div className="text-lg text-green-500">{currentRate.toFixed(2)}%</div>
        </div>

        {Number(userShares) > 0 && (
          <div className="pt-3 border-t">
            <div className="text-sm text-gray-500">Your Shares</div>
            <div className="text-lg font-semibold">
              {Number(userShares).toFixed(4)} {metadata.symbol}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4. Active Loans List

```typescript
// components/lending/ActiveLoans.tsx
'use client'

import { useLoans } from '@/hooks/useContracts'
import { formatUnits } from 'viem'
import { TOKEN_METADATA } from '@/config/contracts'

export function ActiveLoans() {
  const { loans, makePayment, isPaying } = useLoans()

  if (!loans || loans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No active loans
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {loans.map((loan, index) => (
        <LoanCard
          key={index}
          loan={loan}
          onPayment={(amount) => makePayment(index, amount)}
          isPaying={isPaying}
        />
      ))}
    </div>
  )
}

function LoanCard({ loan, onPayment, isPaying }: any) {
  const [paymentAmount, setPaymentAmount] = useState('')
  
  const tokenMeta = TOKEN_METADATA[loan.token as keyof typeof TOKEN_METADATA]
  const amount = formatUnits(loan.amount, 18)
  const remaining = formatUnits(loan.remainingAmount, 18)
  const progress = ((Number(amount) - Number(remaining)) / Number(amount)) * 100

  const getStatusColor = (status: number) => {
    if (status === 0) return 'bg-yellow-100 text-yellow-800'
    if (status === 1) return 'bg-green-100 text-green-800'
    if (status === 2) return 'bg-blue-100 text-blue-800'
    return 'bg-red-100 text-red-800'
  }

  const getStatusText = (status: number) => {
    const statuses = ['Pending', 'Active', 'Completed', 'Defaulted']
    return statuses[status] || 'Unknown'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-lg">
            {Number(amount).toFixed(2)} {tokenMeta.symbol}
          </h4>
          <p className="text-sm text-gray-500">
            Duration: {loan.duration} weeks
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
          {getStatusText(loan.status)}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Remaining</span>
            <span>{Number(remaining).toFixed(2)} {tokenMeta.symbol}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span>Interest Rate</span>
          <span>{Number(loan.interestRate) / 100}% APY</span>
        </div>

        {loan.status === 1 && (
          <div className="pt-3 border-t">
            <div className="flex gap-2">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Payment amount"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={() => onPayment(paymentAmount)}
                disabled={isPaying || !paymentAmount}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPaying ? '...' : 'Pay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Best Practices

### 1. Loading States

Always show loading states:

```typescript
if (isLoading) {
  return <LoadingSpinner />
}

if (error) {
  return <ErrorMessage error={error} />
}
```

### 2. Error Handling

Handle errors gracefully:

```typescript
try {
  await requestLoan(amount, token, duration)
  toast.success('Loan requested successfully!')
} catch (error) {
  if (error.message.includes('insufficient')) {
    toast.error('Insufficient balance')
  } else {
    toast.error('Failed to request loan')
  }
  console.error(error)
}
```

### 3. Transaction Confirmations

Wait for confirmations:

```typescript
const { data, write } = useContractWrite({
  // ...config
})

const { isLoading: isConfirming } = useWaitForTransaction({
  hash: data?.hash,
  confirmations: 2,
})
```

### 4. Input Validation

Validate before submitting:

```typescript
const handleSubmit = () => {
  if (Number(amount) <= 0) {
    toast.error('Amount must be greater than 0')
    return
  }
  
  if (Number(amount) > maxAmount) {
    toast.error(`Maximum amount is ${maxAmount}`)
    return
  }
  
  // Proceed with transaction
}
```

### 5. Gas Optimization

Batch reads when possible:

```typescript
const { data } = useContractReads({
  contracts: [
    { ...contract1, functionName: 'function1' },
    { ...contract2, functionName: 'function2' },
    { ...contract3, functionName: 'function3' },
  ],
})
```

---

## Troubleshooting

### Issue: "Contract not found"

**Solution**: Check contract addresses in `config/contracts.ts`:

```bash
# Verify addresses match deployments.json
cat packages/contracts/deployments.json
```

### Issue: "ABI not found"

**Solution**: Rebuild contracts:

```bash
cd packages/contracts
npm run compile
```

### Issue: "Transaction reverted"

**Solution**: Check contract state and user permissions:

```typescript
// Add require checks
const { data: isVerified } = useContractRead({
  ...CONTRACTS.verificationSBT,
  functionName: 'isUserVerified',
  args: [address],
})

if (!isVerified) {
  return <p>Please complete verification first</p>
}
```

---

## Next Steps

1. ✅ Set up contract configuration
2. ✅ Create custom hooks
3. ✅ Build UI components
4. 🔄 Test contract interactions
5. 🔄 Add error handling
6. 🔄 Implement loading states
7. 🔄 Add transaction confirmations
8. 🔄 Deploy to production

---

**Last Updated**: November 4, 2024

# 🔗 WalletConnect Integration Guide

Complete guide for integrating WalletConnect (Reown AppKit) with TrustCircle.

---

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration](#configuration)
- [Implementation](#implementation)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

TrustCircle uses **Reown AppKit** (formerly WalletConnect v3) for Web3 wallet connection, providing:

- ✅ Multi-wallet support (MetaMask, Rainbow, Trust Wallet, etc.)
- ✅ QR code connection for mobile wallets
- ✅ Email & social login (optional)
- ✅ Network switching
- ✅ Transaction signing
- ✅ Account management

### Why Reown AppKit?

- **User-friendly**: Pre-built UI components
- **Secure**: Industry-standard security
- **Flexible**: Customizable appearance
- **Modern**: React 19 compatible
- **Feature-rich**: Built-in modals and hooks

---

## Setup

### 1. Get WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign in or create account
3. Click "Create New Project"
4. Fill in project details:
   - **Name**: TrustCircle
   - **Description**: Decentralized Micro-Lending Platform
   - **URL**: Your domain
5. Copy your **Project ID**

### 2. Install Dependencies

Already included in `packages/frontend/package.json`:

```json
{
  "dependencies": {
    "@reown/appkit": "^1.7.8",
    "@reown/appkit-adapter-wagmi": "^1.8.10",
    "@tanstack/react-query": "^5.59.0",
    "viem": "^2.21.0",
    "wagmi": "^2.12.0"
  }
}
```

### 3. Environment Variables

Add to `packages/frontend/.env.local`:

```bash
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_APP_NAME=TrustCircle
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Configuration

### File: `packages/frontend/config/wagmi.ts`

Complete Wagmi configuration with WalletConnect:

```typescript
'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { cookieStorage, createStorage } from 'wagmi'

// 1. Get projectId
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set')
}

// 2. Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [celo, celoAlfajores],
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})

// 3. Create modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [celo, celoAlfajores],
  defaultNetwork: celoAlfajores,
  projectId,
  features: {
    analytics: true, // Enable WalletConnect analytics
    email: false, // Disable email login
    socials: false, // Disable social logins
    emailShowWallets: true,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1', // Indigo-500
    '--w3m-border-radius-master': '8px',
  },
  metadata: {
    name: 'TrustCircle',
    description: 'Decentralized Micro-Lending Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    icons: ['https://trustcircle.io/icon.png'],
  },
})

// 4. Export config
export const config = wagmiAdapter.wagmiConfig

// 5. Create QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      retry: 0,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})
```

### Custom Chain Configuration

If you need to add custom Celo networks:

```typescript
import { defineChain } from '@reown/appkit/networks'

// Celo Sepolia Custom Config
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'CeloScan',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
})

// Use in wagmiAdapter
const wagmiAdapter = new WagmiAdapter({
  networks: [celo, celoSepolia],
  projectId,
})
```

---

## Implementation

### 1. Root Layout with Providers

File: `packages/frontend/app/layout.tsx`

```typescript
import { headers } from 'next/headers'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { config, queryClient } from '@/config/wagmi'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get cookies for SSR
  const cookies = headers().get('cookie')

  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config} initialState={cookies}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

### 2. Connect Button Component

File: `packages/frontend/components/ConnectButton.tsx`

```typescript
'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

export function ConnectButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()

  if (isConnected) {
    return (
      <button onClick={() => open()}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    )
  }

  return (
    <button onClick={() => open()}>
      Connect Wallet
    </button>
  )
}
```

### 3. Using Wagmi Hooks

#### Read Contract Data

```typescript
'use client'

import { useContractRead } from 'wagmi'
import { formatUnits } from 'viem'
import { LOAN_MANAGER_ABI, LOAN_MANAGER_ADDRESS } from '@/config/contracts'

export function LoanBalance() {
  const { address } = useAppKitAccount()

  const { data: loans, isLoading } = useContractRead({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getUserLoans',
    args: [address],
    watch: true, // Re-fetch on block changes
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h2>Your Loans</h2>
      {loans?.map((loan) => (
        <div key={loan.id}>
          Amount: {formatUnits(loan.amount, 18)} cUSD
        </div>
      ))}
    </div>
  )
}
```

#### Write to Contract

```typescript
'use client'

import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseUnits } from 'viem'
import { LOAN_MANAGER_ABI, LOAN_MANAGER_ADDRESS } from '@/config/contracts'

export function RequestLoanButton() {
  const { data, write, isLoading } = useContractWrite({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'requestLoan',
  })

  const { isLoading: isConfirming } = useWaitForTransaction({
    hash: data?.hash,
  })

  const handleRequestLoan = () => {
    write({
      args: [
        parseUnits('100', 18), // 100 cUSD
        '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b', // cUSD address
        4, // 4 weeks
      ],
    })
  }

  return (
    <button
      onClick={handleRequestLoan}
      disabled={isLoading || isConfirming}
    >
      {isLoading ? 'Preparing...' : isConfirming ? 'Confirming...' : 'Request Loan'}
    </button>
  )
}
```

#### Multiple Contract Calls

```typescript
'use client'

import { useContractReads } from 'wagmi'
import { CONTRACTS } from '@/config/contracts'

export function DashboardStats() {
  const { address } = useAppKitAccount()

  const { data, isLoading } = useContractReads({
    contracts: [
      {
        ...CONTRACTS.creditScore,
        functionName: 'getCreditScore',
        args: [address],
      },
      {
        ...CONTRACTS.verificationSBT,
        functionName: 'getVerificationLevel',
        args: [address],
      },
      {
        ...CONTRACTS.loanManager,
        functionName: 'getTotalBorrowed',
        args: [address],
      },
    ],
    watch: true,
  })

  if (isLoading) return <div>Loading stats...</div>

  const [creditScore, verificationLevel, totalBorrowed] = data || []

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>Credit Score: {creditScore?.result}</div>
      <div>Verification: Level {verificationLevel?.result}</div>
      <div>Total Borrowed: {formatUnits(totalBorrowed?.result || 0n, 18)}</div>
    </div>
  )
}
```

### 4. Network Switching

```typescript
'use client'

import { useAppKit, useAppKitNetwork } from '@reown/appkit/react'
import { celo, celoAlfajores } from '@reown/appkit/networks'

export function NetworkSwitcher() {
  const { open } = useAppKit()
  const { chainId, switchNetwork } = useAppKitNetwork()

  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      await switchNetwork(targetChainId)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  return (
    <div>
      <p>Current Network: {chainId}</p>
      <button onClick={() => handleSwitchNetwork(celo.id)}>
        Switch to Mainnet
      </button>
      <button onClick={() => handleSwitchNetwork(celoAlfajores.id)}>
        Switch to Testnet
      </button>
      <button onClick={() => open({ view: 'Networks' })}>
        Open Network Modal
      </button>
    </div>
  )
}
```

### 5. Transaction Management

```typescript
'use client'

import { useWaitForTransaction } from 'wagmi'
import { useState } from 'react'

export function TransactionStatus({ hash }: { hash: `0x${string}` }) {
  const { data, isError, isLoading } = useWaitForTransaction({
    hash,
    confirmations: 2,
  })

  return (
    <div>
      {isLoading && <p>⏳ Waiting for confirmation...</p>}
      {isError && <p>❌ Transaction failed</p>}
      {data && (
        <div>
          <p>✅ Transaction confirmed!</p>
          <p>Block: {data.blockNumber}</p>
          <a
            href={`https://celo-sepolia.blockscout.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  )
}
```

---

## Best Practices

### 1. Error Handling

```typescript
import { useContractWrite } from 'wagmi'
import { toast } from 'sonner'

export function SafeContractWrite() {
  const { write } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'transfer',
    onSuccess: (data) => {
      toast.success('Transaction submitted!')
      console.log('Transaction hash:', data.hash)
    },
    onError: (error) => {
      if (error.message.includes('User rejected')) {
        toast.error('Transaction cancelled')
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds')
      } else {
        toast.error('Transaction failed')
        console.error(error)
      }
    },
  })

  return write
}
```

### 2. Loading States

```typescript
export function ContractInteraction() {
  const { write, isLoading, isSuccess } = useContractWrite({
    // ...config
  })

  return (
    <button disabled={isLoading || isSuccess}>
      {isLoading && '⏳ Preparing...'}
      {isSuccess && '✅ Success!'}
      {!isLoading && !isSuccess && '📝 Sign Transaction'}
    </button>
  )
}
```

### 3. Gas Estimation

```typescript
import { useEstimateGas } from 'wagmi'

export function GasEstimator() {
  const { data: gasEstimate } = useEstimateGas({
    to: CONTRACT_ADDRESS,
    data: encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: 'requestLoan',
      args: [amount, token, duration],
    }),
  })

  return (
    <p>Estimated Gas: {gasEstimate?.toString()} CELO</p>
  )
}
```

### 4. Custom Hooks

Create reusable contract hooks:

```typescript
// hooks/useContracts.ts
import { useContractRead, useContractWrite } from 'wagmi'
import { CONTRACTS } from '@/config/contracts'

export function useCreditScore(address: string) {
  const { data: score, isLoading } = useContractRead({
    ...CONTRACTS.creditScore,
    functionName: 'getCreditScore',
    args: [address],
  })

  return { score, isLoading }
}

export function useRequestLoan() {
  const { write: requestLoan, ...rest } = useContractWrite({
    ...CONTRACTS.loanManager,
    functionName: 'requestLoan',
  })

  const handleRequestLoan = (amount: string, token: string, duration: number) => {
    requestLoan({
      args: [parseUnits(amount, 18), token, duration],
    })
  }

  return { requestLoan: handleRequestLoan, ...rest }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Project ID not found"

**Error**: `Project ID is required`

**Solution**:
```bash
# Verify .env.local
cat packages/frontend/.env.local | grep WALLETCONNECT

# Should output:
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123...
```

#### 2. Network Not Supported

**Error**: `Chain not supported`

**Solution**: Ensure chain is added to wagmiAdapter:

```typescript
const wagmiAdapter = new WagmiAdapter({
  networks: [celo, celoAlfajores], // Add all supported chains
  projectId,
})
```

#### 3. SSR Hydration Errors

**Error**: `Hydration failed`

**Solution**: Use 'use client' directive and check cookies:

```typescript
'use client'

import { headers } from 'next/headers'
// ... rest of code
```

#### 4. Transaction Fails Silently

**Solution**: Add error handlers:

```typescript
const { write } = useContractWrite({
  // ...config
  onError: (error) => {
    console.error('Transaction error:', error)
    // Show user-friendly message
  },
})
```

#### 5. Wallet Not Connecting

**Checklist**:
- [ ] Project ID is valid
- [ ] Network is supported
- [ ] Wallet is unlocked
- [ ] Correct network in wallet
- [ ] Browser console for errors

---

## Advanced Features

### Custom Modal Styling

```typescript
const modal = createAppKit({
  // ...config
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '8px',
    '--w3m-font-family': 'Inter, sans-serif',
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ],
})
```

### Event Listeners

```typescript
import { watchAccount, watchNetwork } from 'wagmi/actions'

// Watch account changes
watchAccount((account) => {
  console.log('Account changed:', account)
})

// Watch network changes
watchNetwork((network) => {
  console.log('Network changed:', network)
})
```

### Custom Connectors

```typescript
import { InjectedConnector } from 'wagmi/connectors'

const customConnector = new InjectedConnector({
  chains: [celo, celoAlfajores],
  options: {
    name: 'My Custom Wallet',
    shimDisconnect: true,
  },
})
```

---

## Testing

### Mock WalletConnect for Tests

```typescript
// __mocks__/wagmi.ts
export const useAccount = () => ({
  address: '0x1234567890123456789012345678901234567890',
  isConnected: true,
})

export const useContractRead = () => ({
  data: mockData,
  isLoading: false,
})
```

### E2E Testing with Playwright

```typescript
// e2e/wallet-connection.spec.ts
import { test, expect } from '@playwright/test'

test('connect wallet', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('button:has-text("Connect Wallet")')
  await page.waitForSelector('[data-testid="wallet-modal"]')
  await page.click('button:has-text("MetaMask")')
  // ... rest of test
})
```

---

## Resources

- [Reown AppKit Docs](https://docs.reown.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [Celo Documentation](https://docs.celo.org/)

---

## Support

Having issues with WalletConnect integration?

1. Check [WalletConnect Discussions](https://github.com/WalletConnect/walletconnect-monorepo/discussions)
2. Open an issue in our repo
3. Join our Discord community

---

**Last Updated**: November 4, 2024

# 🚀 TrustCircle Quick Start Guide

## ⚡ Get Started in 3 Minutes

### 1️⃣ Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

### 2️⃣ Connect Your Wallet

1. Click "Launch App" or "Connect Wallet"
2. Choose your wallet:
   - **MetaMask** (browser extension)
   - **Valora** (mobile - Celo native)
   - **MiniPay** (mobile - Opera's Celo wallet)
   - **Coinbase Wallet**
   - **WalletConnect** (any wallet)

3. Switch to **Celo Alfajores Testnet**:
   - Network: Alfajores
   - Chain ID: 44787
   - RPC: https://alfajores-forno.celo-testnet.org

---

### 3️⃣ Get Testnet Tokens

Visit the Celo Faucet: https://faucet.celo.org

1. Connect your wallet
2. Request tokens:
   - ✅ **CELO** (for gas fees)
   - ✅ **cUSD** (for testing loans)
   - ✅ **cEUR** (optional)
   - ✅ **cREAL** (optional)

Tokens arrive in ~30 seconds! 🎉

---

## 📝 What You Can Do Now

### ✅ Already Working:
- Connect wallet with WalletConnect
- View Celo and stablecoin balances
- Switch between Alfajores testnet and Celo mainnet
- Navigate the homepage

### 🚧 Coming Next (Build These):
- Request a loan
- Deposit to lending pools
- Join/create lending circles
- View credit score
- Complete KYC verification

---

## 🛠️ Development Commands

```bash
# Frontend Development
npm run dev            # Start dev server (http://localhost:3000)
npm run build          # Build for production
npm run lint           # Check code quality

# Smart Contract Development
npm run compile        # Compile Solidity contracts
npm run test           # Run contract tests
npm run deploy:alfajores  # Deploy to testnet
```

---

## 📂 Where to Find Things

```
trustcircle/
├── app/                    # Pages and routes
│   ├── page.tsx           # Homepage (✅ Created)
│   ├── layout.tsx         # Root layout (✅ Created)
│   └── globals.css        # Styles (✅ Created)
│
├── components/            # UI Components (🚧 To be built)
├── config/                # Configuration
│   ├── wagmi.ts          # WalletConnect config (✅ Created)
│   └── tokens.ts         # Stablecoin addresses (✅ Created)
│
├── contracts/             # Smart contracts (🚧 To be written)
├── hooks/                 # Custom hooks (🚧 To be built)
└── .env.local             # Your API keys (✅ Created)
```

---

## 🔑 Environment Setup

Edit `.env.local` to add your API keys:

```bash
# ✅ Already configured
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=6b87a3c69cbd8b52055d7aef763148d6

# ⚠️ Add these for full functionality:
ANTHROPIC_API_KEY=your_key_here          # For AI credit scoring
NEYNAR_API_KEY=your_key_here             # For Farcaster integration
PRIVATE_KEY=your_testnet_wallet_key      # For deploying contracts
```

### Get API Keys:
- **Anthropic**: https://console.anthropic.com/
- **Neynar**: https://neynar.com/

---

## 🎯 Your First Task: Build Wallet Connection UI

The foundation is ready! Now build the wallet connection component:

### Create `components/auth/WalletConnect.tsx`

```tsx
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
```

Then import it in `app/page.tsx` and test! 🎉

---

## 🆘 Troubleshooting

### Issue: Can't connect to testnet
**Solution**: Add Celo Alfajores network to MetaMask:
- Network name: Celo Alfajores
- RPC URL: https://alfajores-forno.celo-testnet.org
- Chain ID: 44787
- Currency symbol: CELO
- Block explorer: https://alfajores.celoscan.io

### Issue: npm command not found
**Solution**: Use full path:
```bash
export PATH="/usr/local/Cellar/node/24.10.0/bin:$PATH"
npm run dev
```

### Issue: Port 3000 already in use
**Solution**: Use a different port:
```bash
npm run dev -- -p 3001
```

---

## 📚 Learn More

- **Celo Basics**: https://docs.celo.org/learn/celo-basics
- **Building on Celo**: https://docs.celo.org/build
- **Mento Stablecoins**: https://docs.mento.org/
- **Wagmi React Hooks**: https://wagmi.sh/react/getting-started

---

## ✅ Setup Verification Checklist

- [x] Node.js installed (v24.10.0)
- [x] Dependencies installed (1333 packages)
- [x] Next.js project created
- [x] WalletConnect configured
- [x] Celo networks configured
- [x] Tailwind CSS set up
- [x] Environment variables created
- [x] Development server runs
- [ ] Wallet connected
- [ ] Testnet tokens received
- [ ] First component built

---

## 🎯 Next Steps (Recommended Order)

1. **Week 1**: Build wallet connection UI and dashboard layout
2. **Week 2**: Write and test smart contracts
3. **Week 3**: Build loan request and deposit interfaces
4. **Week 4**: Integrate AI credit scoring
5. **Week 5**: Add lending circles and social features
6. **Week 6**: Testing, security audit, deploy to testnet
7. **Week 7**: Beta testing with real users
8. **Week 8**: Mainnet launch! 🚀

---

## 💡 Pro Tips

1. **Start Small**: Build one feature at a time
2. **Test Often**: Use Alfajores testnet extensively
3. **Read Logs**: Check browser console and terminal for errors
4. **Use TypeScript**: It catches bugs before they happen
5. **Follow DeFi Best Practices**: Security first, always
6. **Join Communities**: Celo Discord, Farcaster channels
7. **Document Changes**: Update README as you build

---

## 🎉 You're Ready!

Everything is set up. Now it's time to build something amazing!

**Start the server and start coding:**

```bash
npm run dev
```

Happy building! 🚀💙

---

*Need help? Check SETUP_COMPLETE.md for detailed documentation.*

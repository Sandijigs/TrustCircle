/**
 * Get Test Tokens Script
 * 
 * Helps users get test tokens for Celo Sepolia testnet
 * 
 * Usage:
 *   npx hardhat run scripts/get-test-tokens.ts --network celoSepolia
 */

import { ethers } from "hardhat";

// Celo Sepolia Test Token Addresses
const CELO_SEPOLIA_TOKENS = {
  cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
  cEUR: "0xA99dC247d6b7B2E3ab48a1fEE101b83cD6aCd82a",
  cREAL: "0x2294298942fdc79417DE9E0D740A4957E0e7783a",
};

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("\n═══════════════════════════════════════════");
  console.log("     🪙 Celo Sepolia Test Token Helper");
  console.log("═══════════════════════════════════════════\n");
  
  console.log(`📍 Your Wallet Address: ${address}`);
  console.log(`💰 CELO Balance: ${ethers.formatEther(balance)} CELO\n`);
  
  // Check stablecoin balances
  console.log("📊 Current Stablecoin Balances:\n");
  
  for (const [symbol, tokenAddress] of Object.entries(CELO_SEPOLIA_TOKENS)) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tokenBalance = await token.balanceOf(address);
      const decimals = await token.decimals();
      const formatted = ethers.formatUnits(tokenBalance, decimals);
      console.log(`   ${symbol}: ${formatted}`);
    } catch (error) {
      console.log(`   ${symbol}: Error checking balance`);
    }
  }
  
  console.log("\n═══════════════════════════════════════════");
  console.log("     📖 How to Get Test Tokens");
  console.log("═══════════════════════════════════════════\n");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  LOW CELO BALANCE!\n");
  }
  
  console.log("1️⃣  Get CELO Tokens (for gas fees):");
  console.log("    🔗 https://faucet.celo.org/celo-sepolia");
  console.log(`    📋 Address: ${address}\n`);
  
  console.log("2️⃣  Get Stablecoins (cUSD, cEUR, cREAL):");
  console.log("\n    Option A: Use Mento Faucet (Recommended)");
  console.log("    🔗 https://faucet.mento.org");
  console.log("    - Connect your wallet");
  console.log("    - Select Celo Sepolia network");
  console.log("    - Request cUSD, cEUR, or cREAL\n");
  
  console.log("    Option B: Use Ubeswap Testnet (if available)");
  console.log("    - Swap CELO for stablecoins");
  console.log("    - Visit testnet DEX if available\n");
  
  console.log("    Option C: Use OpenCelo Faucet");
  console.log("    🔗 https://opencelo.com/faucet");
  console.log("    - May support multiple test tokens\n");
  
  console.log("3️⃣  Minimum Amounts Needed:");
  console.log("    - CELO: ~0.5 CELO (for gas fees)");
  console.log("    - Stablecoins: ~10 cUSD (for testing borrow/lend)\n");
  
  console.log("═══════════════════════════════════════════");
  console.log("     ⏭️  Next Steps");
  console.log("═══════════════════════════════════════════\n");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("❌ Step 1: Get CELO from faucet first!");
    console.log("   🔗 https://faucet.celo.org/celo-sepolia\n");
  } else {
    console.log("✅ Step 1: You have CELO for gas fees\n");
  }
  
  // Check if user has any stablecoins
  let hasStablecoins = false;
  for (const [_, tokenAddress] of Object.entries(CELO_SEPOLIA_TOKENS)) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tokenBalance = await token.balanceOf(address);
      if (tokenBalance > 0) {
        hasStablecoins = true;
        break;
      }
    } catch (error) {
      // Ignore
    }
  }
  
  if (!hasStablecoins) {
    console.log("❌ Step 2: Get stablecoins from Mento faucet");
    console.log("   🔗 https://faucet.mento.org\n");
  } else {
    console.log("✅ Step 2: You have stablecoins!\n");
  }
  
  if (balance >= ethers.parseEther("0.1") && hasStablecoins) {
    console.log("🎉 All set! You can now test the borrow feature!\n");
    console.log("💡 Try these next:");
    console.log("   - Deposit stablecoins in lending pools");
    console.log("   - Request a loan");
    console.log("   - Join a trust circle\n");
  } else {
    console.log("⏳ Follow the steps above to get test tokens\n");
  }
  
  console.log("═══════════════════════════════════════════");
  console.log("     🔗 Useful Links");
  console.log("═══════════════════════════════════════════\n");
  console.log("  Block Explorer:");
  console.log(`  https://celo-sepolia.blockscout.com/address/${address}`);
  console.log("\n  Network Info:");
  console.log("  Chain ID: 11142220");
  console.log("  RPC: https://forno.celo-sepolia.celo-testnet.org\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

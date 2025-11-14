/**
 * Mint Test Tokens Script
 * 
 * Since Celo Sepolia faucets don't provide stablecoins,
 * this script will either:
 * 1. Deploy a mock ERC20 token and mint to your address
 * 2. Or interact with existing token contracts if they have mint functions
 * 
 * Usage:
 *   npx hardhat run scripts/mint-test-tokens.ts --network celoSepolia
 */

import { ethers } from "hardhat";
import { parseUnits } from "ethers";

// Celo Sepolia test token addresses
const CELO_SEPOLIA_TOKENS = {
  cUSD: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
  cEUR: "0xA99dC247d6b7B2E3ab48a1fEE101b83cD6aCd82a",
  cREAL: "0x2294298942fdc79417DE9E0D740A4957E0e7783a",
};

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();

  console.log("\n═══════════════════════════════════════════");
  console.log("     🪙 Mint Test Tokens for Testing");
  console.log("═══════════════════════════════════════════\n");

  console.log(`📍 Your Address: ${address}`);
  console.log(`⛓️  Network: Celo Sepolia (Chain ID: 11142220)\n`);

  // Check CELO balance
  const celoBalance = await ethers.provider.getBalance(address);
  console.log(`💰 CELO Balance: ${ethers.formatEther(celoBalance)} CELO\n`);

  if (celoBalance < parseUnits("0.1", 18)) {
    console.log("⚠️  WARNING: Low CELO balance. Get more from:");
    console.log("   https://faucet.celo.org/celo-sepolia\n");
  }

  // Option 1: Try to check if existing tokens have mint functions
  console.log("═══════════════════════════════════════════");
  console.log("     Option 1: Check Existing Tokens");
  console.log("═══════════════════════════════════════════\n");

  console.log("Checking if Celo Sepolia test tokens have public mint functions...\n");

  for (const [symbol, tokenAddress] of Object.entries(CELO_SEPOLIA_TOKENS)) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const name = await token.name();
      const currentBalance = await token.balanceOf(address);
      const decimals = await token.decimals();

      console.log(`${symbol} (${name}):`);
      console.log(`  Address: ${tokenAddress}`);
      console.log(`  Current Balance: ${ethers.formatUnits(currentBalance, decimals)}`);

      // Try to mint (this will likely fail for official tokens)
      try {
        console.log(`  Attempting to mint 100 ${symbol}...`);
        const mintTx = await token.mint(address, parseUnits("100", decimals));
        await mintTx.wait();
        console.log(`  ✅ Minted 100 ${symbol}!`);
      } catch (mintError: any) {
        if (mintError.message.includes("no code")) {
          console.log(`  ⚠️  Token contract not found at this address`);
        } else {
          console.log(`  ❌ Cannot mint - token doesn't have public mint function`);
        }
      }
      console.log();
    } catch (error: any) {
      console.log(`${symbol}: Error - ${error.message.substring(0, 80)}...\n`);
    }
  }

  // Option 2: Deploy Mock ERC20 Tokens
  console.log("═══════════════════════════════════════════");
  console.log("     Option 2: Deploy Mock Test Tokens");
  console.log("═══════════════════════════════════════════\n");

  console.log("Since official tokens don't have mint functions,");
  console.log("let's deploy mock ERC20 tokens for testing...\n");

  const mockTokens = [
    { name: "Test Celo Dollar", symbol: "cUSD", amount: "1000" },
    { name: "Test Celo Euro", symbol: "cEUR", amount: "1000" },
    { name: "Test Celo Real", symbol: "cREAL", amount: "500" },
  ];

  const deployedTokens: { symbol: string; address: string; amount: string }[] = [];

  for (const { name, symbol, amount } of mockTokens) {
    try {
      console.log(`Deploying ${symbol} (${name})...`);

      // Deploy MockERC20 with initial supply
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const initialSupply = parseUnits(amount, 18);
      const token = await MockERC20.deploy(name, symbol, initialSupply);
      await token.waitForDeployment();

      const tokenAddress = await token.getAddress();
      console.log(`✅ ${symbol} deployed at: ${tokenAddress}`);

      const balance = await token.balanceOf(address);
      console.log(`   ✅ Minted! Balance: ${ethers.formatUnits(balance, 18)} ${symbol}\n`);

      deployedTokens.push({ symbol, address: tokenAddress, amount });
    } catch (error: any) {
      console.log(`   ❌ Failed to deploy ${symbol}: ${error.message}\n`);
    }
  }

  // Summary
  console.log("═══════════════════════════════════════════");
  console.log("     📊 Summary");
  console.log("═══════════════════════════════════════════\n");

  if (deployedTokens.length > 0) {
    console.log("✅ Successfully deployed mock test tokens:\n");

    for (const { symbol, address, amount } of deployedTokens) {
      console.log(`${symbol}:`);
      console.log(`  Address: ${address}`);
      console.log(`  Initial Balance: ${amount}`);
      console.log();
    }

    console.log("═══════════════════════════════════════════");
    console.log("     ⏭️  Next Steps");
    console.log("═══════════════════════════════════════════\n");

    console.log("1. Add tokens to MetaMask:");
    for (const { symbol, address } of deployedTokens) {
      console.log(`   ${symbol}: ${address}`);
    }

    console.log("\n2. Update your frontend config:");
    console.log("   File: packages/frontend/config/tokens.ts");
    console.log("   Replace token addresses with the new ones above\n");

    console.log("3. Test the borrow feature:");
    console.log("   - Go to http://localhost:3000/borrow");
    console.log("   - You should now see your token balances");
    console.log("   - Try requesting a loan!\n");

    console.log("4. Save these addresses!");
    console.log("   Create a file: deployed-test-tokens.json\n");

    // Save addresses to file
    const fs = require("fs");
    const path = require("path");
    const outputPath = path.join(__dirname, "../deployed-test-tokens.json");

    const output = {
      network: "celoSepolia",
      chainId: 11142220,
      deployer: address,
      timestamp: new Date().toISOString(),
      tokens: deployedTokens.reduce((acc: any, { symbol, address }) => {
        acc[symbol] = address;
        return acc;
      }, {}),
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`✅ Addresses saved to: ${outputPath}\n`);
  } else {
    console.log("❌ No tokens were successfully deployed.\n");
    console.log("Possible issues:");
    console.log("  - Insufficient CELO for gas");
    console.log("  - MockERC20 contract not found");
    console.log("  - Network connection issues\n");
    console.log("Try:");
    console.log("  1. Get more CELO from faucet");
    console.log("  2. Compile contracts: npm run compile");
    console.log("  3. Check network connection\n");
  }

  console.log("═══════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

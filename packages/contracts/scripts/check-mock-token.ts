/**
 * Check Mock Token Balance
 * 
 * Verify your mock token is accessible and shows correct balance
 * 
 * Usage:
 *   npx hardhat run scripts/check-mock-token.ts --network celoSepolia
 * 
 * Or set TOKEN_ADDRESS environment variable:
 *   TOKEN_ADDRESS=0x... npx hardhat run scripts/check-mock-token.ts --network celoSepolia
 */

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Try to load token address from deployed-test-tokens.json
let MOCK_TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "";

if (!MOCK_TOKEN_ADDRESS) {
  try {
    const deployedTokensPath = path.join(__dirname, "../deployed-test-tokens.json");
    if (fs.existsSync(deployedTokensPath)) {
      const deployed = JSON.parse(fs.readFileSync(deployedTokensPath, "utf8"));
      MOCK_TOKEN_ADDRESS = deployed.tokens?.cEUR || "";
    }
  } catch (error) {
    // Ignore - will prompt user
  }
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();

  console.log("\n═══════════════════════════════════════════");
  console.log("     🔍 Mock Token Balance Check");
  console.log("═══════════════════════════════════════════\n");

  console.log(`📍 Your Address: ${address}`);
  
  if (!MOCK_TOKEN_ADDRESS) {
    console.log("❌ No token address found!\n");
    console.log("Please either:");
    console.log("1. Run 'npm run mint-tokens' to deploy a new mock token");
    console.log("2. Set TOKEN_ADDRESS environment variable:");
    console.log("   TOKEN_ADDRESS=0x... npm run check-mock\n");
    process.exit(1);
  }
  
  console.log(`🪙 Token Address: ${MOCK_TOKEN_ADDRESS}\n`);

  try {
    const token = new ethers.Contract(MOCK_TOKEN_ADDRESS, ERC20_ABI, signer);

    const [name, symbol, decimals, balance, totalSupply] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.balanceOf(address),
      token.totalSupply(),
    ]);

    console.log("Token Info:");
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)}\n`);

    console.log(`Your Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

    if (balance > 0) {
      console.log("\n✅ SUCCESS! You have tokens!\n");
      console.log("Next Steps:");
      console.log("1. Add token to MetaMask:");
      console.log(`   Address: ${MOCK_TOKEN_ADDRESS}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log("\n2. Refresh your frontend (Ctrl+Shift+R)");
      console.log("\n3. You should see your balance in the app!");
    } else {
      console.log("\n⚠️  WARNING: Zero balance!");
      console.log("The token exists but you have no tokens.");
      console.log("\nTry deploying again:");
      console.log("  npm run mint-tokens\n");
    }
  } catch (error: any) {
    console.log("❌ ERROR: Cannot access token");
    console.log(`Error: ${error.message}\n`);
    console.log("Possible issues:");
    console.log("  - Token not deployed at this address");
    console.log("  - Wrong network (ensure Celo Sepolia)");
    console.log("  - Network connection issues\n");
    console.log("Try deploying tokens:");
    console.log("  npm run mint-tokens\n");
  }

  console.log("═══════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

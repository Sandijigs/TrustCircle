import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  // Get deployer from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env.local");
    process.exit(1);
  }
  
  const deployer = new ethers.Wallet(privateKey, ethers.provider);
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("\n🎯 Deployment Address Information\n");
  console.log("=".repeat(70));
  console.log(`Address:  ${address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} CELO`);
  console.log("=".repeat(70));
  console.log("\n📋 To deploy, this address needs at least 0.5 CELO\n");
  
  if (parseFloat(ethers.formatEther(balance)) >= 0.5) {
    console.log("✅ READY TO DEPLOY! Run: npm run deploy:sepolia\n");
  } else {
    console.log("❌ NOT READY - Need to add tokens to this address\n");
    console.log("💡 Options:");
    console.log("   1. Send CELO from MetaMask to this address");
    console.log("   2. Get tokens from faucet: https://faucet.celo.org/celo-sepolia");
    console.log("   3. Check balance on: https://celo-sepolia.blockscout.com/address/" + address);
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

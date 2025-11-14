import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("🔍 Checking all accounts derived from your mnemonic...\n");
  console.log("=" .repeat(80));

  // Get all signers (accounts from mnemonic)
  const signers = await ethers.getSigners();
  
  console.log(`Found ${signers.length} accounts:\n`);

  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    const address = await signer.getAddress();
    const balance = await ethers.provider.getBalance(address);
    const balanceInEther = ethers.formatEther(balance);
    
    const hasTokens = parseFloat(balanceInEther) > 0;
    const marker = hasTokens ? "✅" : "❌";
    
    console.log(`${marker} Account ${i}:`);
    console.log(`   Address: ${address}`);
    console.log(`   Balance: ${balanceInEther} CELO`);
    
    if (hasTokens) {
      console.log(`   👉 THIS ACCOUNT HAS TOKENS!`);
    }
    
    console.log();
  }

  console.log("=" .repeat(80));
  console.log("\n💡 To use a specific account for deployment:");
  console.log("   1. Either send tokens to Account 0 (first address)");
  console.log("   2. Or modify hardhat.config.ts to use the account with tokens");
  console.log("\n🌐 Check any address on:");
  console.log("   https://celo-sepolia.blockscout.com/address/YOUR_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

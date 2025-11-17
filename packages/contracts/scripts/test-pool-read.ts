/**
 * Test Pool Read
 * Direct test to see if pool can be read from contract
 */

import { ethers } from "hardhat";

const LENDING_POOL = "0xFce2564f7085A26666410d9b173755fec7141333";
const MOCK_TOKEN = "0x8dd252909C90846956592867EaeE335E5c4BbCF5";

const ABI = [
  "function pools(address) external view returns (address asset, uint256 totalDeposits, uint256 totalBorrowed, uint256 totalReserves, uint256 totalShares, uint256 lastUpdateTimestamp, uint256 accumulatedInterest, bool isActive)",
];

async function main() {
  console.log("\n🔍 Testing Pool Read...\n");
  
  const provider = ethers.provider;
  const lendingPool = new ethers.Contract(LENDING_POOL, ABI, provider);

  console.log("Reading pool for token:", MOCK_TOKEN);
  console.log("From contract:", LENDING_POOL);
  console.log("");

  try {
    const pool = await lendingPool.pools(MOCK_TOKEN);
    
    console.log("✅ SUCCESS! Pool data:");
    console.log("  Asset:", pool.asset);
    console.log("  Total Deposits:", ethers.formatEther(pool.totalDeposits));
    console.log("  Total Borrowed:", ethers.formatEther(pool.totalBorrowed));
    console.log("  Is Active:", pool.isActive);
    console.log("");
    
    if (!pool.isActive) {
      console.log("⚠️  WARNING: Pool exists but isActive = false!");
    }
    
    if (pool.asset === ethers.ZeroAddress) {
      console.log("⚠️  WARNING: Pool not initialized (zero address)");
    }
    
  } catch (error: any) {
    console.log("❌ FAILED to read pool");
    console.log("Error:", error.message);
  }

  console.log("\n✅ Test complete\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * Check Pool Status
 * Verify the pool can be read
 */

import { ethers } from "hardhat";

const LENDING_POOL_ADDRESS = "0xFce2564f7085A26666410d9b173755fec7141333";
const MOCK_TOKEN_ADDRESS = "0x8dd252909C90846956592867EaeE335E5c4BbCF5";

const LENDING_POOL_ABI = [
  "function getPool(address asset) external view returns (tuple(address asset, uint256 totalDeposits, uint256 totalBorrowed, uint256 totalReserves, uint256 totalShares, uint256 lastUpdateTimestamp, uint256 accumulatedInterest, bool isActive))",
  "function pools(address) external view returns (address asset, uint256 totalDeposits, uint256 totalBorrowed, uint256 totalReserves, uint256 totalShares, uint256 lastUpdateTimestamp, uint256 accumulatedInterest, bool isActive)",
  "function isWhitelisted(address asset) external view returns (bool)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  
  console.log("\n🔍 Checking Pool Status...\n");
  
  const lendingPool = new ethers.Contract(
    LENDING_POOL_ADDRESS,
    LENDING_POOL_ABI,
    signer
  );

  // Check whitelist
  console.log("1. Checking whitelist...");
  const isWhitelisted = await lendingPool.isWhitelisted(MOCK_TOKEN_ADDRESS);
  console.log(`   Whitelisted: ${isWhitelisted ? "✅ YES" : "❌ NO"}\n`);

  // Try reading pool with getPool function
  console.log("2. Reading pool with getPool()...");
  try {
    const pool = await lendingPool.getPool(MOCK_TOKEN_ADDRESS);
    console.log("✅ Pool found!");
    console.log(`   Asset: ${pool.asset}`);
    console.log(`   Total Deposits: ${ethers.formatEther(pool.totalDeposits)}`);
    console.log(`   Total Borrowed: ${ethers.formatEther(pool.totalBorrowed)}`);
    console.log(`   Is Active: ${pool.isActive}`);
  } catch (error: any) {
    console.log("❌ Failed to read pool with getPool()");
    console.log(`   Error: ${error.message}\n`);
  }

  // Try reading pool directly from mapping
  console.log("\n3. Reading pool from mapping...");
  try {
    const pool = await lendingPool.pools(MOCK_TOKEN_ADDRESS);
    console.log("✅ Pool data:");
    console.log(`   Asset: ${pool.asset}`);
    console.log(`   Total Deposits: ${ethers.formatEther(pool.totalDeposits)}`);
    console.log(`   Total Borrowed: ${ethers.formatEther(pool.totalBorrowed)}`);
    console.log(`   Is Active: ${pool.isActive}`);
  } catch (error: any) {
    console.log("❌ Failed to read pool from mapping");
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n✅ Check complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

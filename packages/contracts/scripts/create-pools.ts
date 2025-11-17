/**
 * Create Lending Pools
 * 
 * Creates pools for test tokens after deployment
 */

import { ethers } from "hardhat";

const LENDING_POOL_ADDRESS = "0xFce2564f7085A26666410d9b173755fec7141333";
const MOCK_TOKEN_ADDRESS = "0x8dd252909C90846956592867EaeE335E5c4BbCF5";

const LENDING_POOL_ABI = [
  "function createPool(address asset) external",
  "function getPool(address asset) external view returns (tuple(address asset, uint256 totalDeposits, uint256 totalBorrowed, uint256 totalReserves, uint256 totalShares, uint256 lastUpdateTimestamp, uint256 accumulatedInterest, bool isActive))",
  "function isWhitelisted(address asset) external view returns (bool)",
  "function whitelistToken(address asset, bool status) external",
];

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();

  console.log("\n═══════════════════════════════════════════");
  console.log("     🏊 Create Lending Pools");
  console.log("═══════════════════════════════════════════\n");

  console.log(`📍 Your Address: ${address}`);
  console.log(`🏦 LendingPool: ${LENDING_POOL_ADDRESS}`);
  console.log(`🪙 Mock Token: ${MOCK_TOKEN_ADDRESS}\n`);

  const lendingPool = new ethers.Contract(
    LENDING_POOL_ADDRESS,
    LENDING_POOL_ABI,
    signer
  );

  // Step 1: Check if token is whitelisted
  console.log("Step 1: Checking if token is whitelisted...");
  const isWhitelisted = await lendingPool.isWhitelisted(MOCK_TOKEN_ADDRESS);
  
  if (!isWhitelisted) {
    console.log("⚠️  Token not whitelisted. Whitelisting now...");
    try {
      const whitelistTx = await lendingPool.whitelistToken(MOCK_TOKEN_ADDRESS, true);
      await whitelistTx.wait();
      console.log("✅ Token whitelisted successfully!");
    } catch (error: any) {
      console.log("❌ Failed to whitelist token:", error.message);
      console.log("You may need admin role to whitelist tokens.");
      console.log("Trying to create pool anyway...\n");
    }
  } else {
    console.log("✅ Token already whitelisted\n");
  }

  // Step 2: Check if pool exists
  console.log("Step 2: Checking if pool exists...");
  try {
    const pool = await lendingPool.getPool(MOCK_TOKEN_ADDRESS);
    if (pool.isActive) {
      console.log("✅ Pool already exists and is active!");
      console.log(`   Total Deposits: ${ethers.formatEther(pool.totalDeposits)}`);
      console.log(`   Total Borrowed: ${ethers.formatEther(pool.totalBorrowed)}`);
      console.log("\n✅ No need to create pool - already exists!");
      return;
    }
  } catch (error) {
    console.log("Pool doesn't exist yet. Creating...\n");
  }

  // Step 3: Create pool
  console.log("Step 3: Creating pool for mock token...");
  try {
    const createTx = await lendingPool.createPool(MOCK_TOKEN_ADDRESS);
    console.log("⏳ Transaction sent, waiting for confirmation...");
    await createTx.wait();
    console.log("✅ Pool created successfully!\n");

    // Verify pool was created
    const pool = await lendingPool.getPool(MOCK_TOKEN_ADDRESS);
    console.log("Pool Details:");
    console.log(`   Asset: ${pool.asset}`);
    console.log(`   Total Deposits: ${ethers.formatEther(pool.totalDeposits)}`);
    console.log(`   Total Borrowed: ${ethers.formatEther(pool.totalBorrowed)}`);
    console.log(`   Is Active: ${pool.isActive}`);
  } catch (error: any) {
    console.log("❌ Failed to create pool:", error.message);
    
    if (error.message.includes("PoolAlreadyExists")) {
      console.log("✅ Pool already exists!");
    } else if (error.message.includes("AccessControl")) {
      console.log("⚠️  You don't have permission to create pools.");
      console.log("You need ADMIN_ROLE or the contract owner.");
    } else {
      console.log("Error details:", error);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("     ✅ Done!");
  console.log("═══════════════════════════════════════════\n");
  
  console.log("Next steps:");
  console.log("1. Refresh your frontend");
  console.log("2. Go to /lend page");
  console.log("3. You should now see the pool!");
  console.log("4. Try depositing tokens\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

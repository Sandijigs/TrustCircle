import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Security Status Check
 * 
 * Checks the security status of all TrustCircle contracts
 * 
 * Usage:
 *   npm run security:status
 */

interface ContractStatus {
  name: string;
  address: string;
  paused: boolean;
  admin: string | null;
  error?: string;
}

async function main() {
  console.log("🔍 TrustCircle Security Status");
  console.log("==============================");
  console.log("");

  const network = hre.network.name;
  console.log(`Network: ${network}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  const contracts = [
    { name: "LendingPool", address: process.env.LENDING_POOL_ADDRESS || "" },
    { name: "LoanManager", address: process.env.LOAN_MANAGER_ADDRESS || "" },
    { name: "LendingCircle", address: process.env.LENDING_CIRCLE_ADDRESS || "" },
    { name: "CollateralManager", address: process.env.COLLATERAL_MANAGER_ADDRESS || "" },
    { name: "CreditScore", address: process.env.CREDIT_SCORE_ADDRESS || "" },
    { name: "VerificationSBT", address: process.env.VERIFICATION_SBT_ADDRESS || "" },
  ];

  const statuses: ContractStatus[] = [];

  for (const contractInfo of contracts) {
    try {
      if (!contractInfo.address) {
        statuses.push({
          name: contractInfo.name,
          address: "NOT CONFIGURED",
          paused: false,
          admin: null,
          error: "Address not set in environment",
        });
        continue;
      }

      const contract = await ethers.getContractAt(contractInfo.name, contractInfo.address);
      
      // Check if contract exists
      const code = await ethers.provider.getCode(contractInfo.address);
      if (code === "0x") {
        statuses.push({
          name: contractInfo.name,
          address: contractInfo.address,
          paused: false,
          admin: null,
          error: "No contract at address",
        });
        continue;
      }

      // Get pause status
      const paused = await contract.paused();

      // Get admin (if has ADMIN_ROLE)
      let admin: string | null = null;
      try {
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        // Get role admin (who can grant/revoke)
        admin = await contract.getRoleAdmin(ADMIN_ROLE);
      } catch {
        // Contract might not have ADMIN_ROLE
      }

      statuses.push({
        name: contractInfo.name,
        address: contractInfo.address,
        paused,
        admin,
      });
    } catch (error: any) {
      statuses.push({
        name: contractInfo.name,
        address: contractInfo.address,
        paused: false,
        admin: null,
        error: error.message,
      });
    }
  }

  // Display results
  console.log("Contract Status:");
  console.log("================");
  console.log("");

  let allPaused = true;
  let anyPaused = false;
  let errors = 0;

  for (const status of statuses) {
    const emoji = status.error
      ? "❌"
      : status.paused
      ? "⏸️ "
      : "▶️ ";
    
    console.log(`${emoji} ${status.name}`);
    console.log(`   Address: ${status.address}`);
    
    if (status.error) {
      console.log(`   ❌ Error: ${status.error}`);
      errors++;
    } else {
      console.log(`   Status: ${status.paused ? "PAUSED 🛑" : "ACTIVE ✅"}`);
      if (status.admin) {
        console.log(`   Admin: ${status.admin.substring(0, 10)}...`);
      }
      
      if (status.paused) {
        anyPaused = true;
      } else {
        allPaused = false;
      }
    }
    console.log("");
  }

  // Overall status
  console.log("Overall Status:");
  console.log("===============");
  console.log("");

  if (errors > 0) {
    console.log(`❌ ${errors} contract(s) have errors`);
  }

  if (allPaused && errors === 0) {
    console.log("🛑 ALL CONTRACTS PAUSED");
    console.log("   System is in emergency mode");
  } else if (anyPaused) {
    console.log("⚠️  PARTIAL PAUSE");
    console.log("   Some contracts are paused");
  } else if (errors === 0) {
    console.log("✅ ALL CONTRACTS ACTIVE");
    console.log("   System is operational");
  }

  console.log("");

  // Recommendations
  if (anyPaused && !allPaused) {
    console.log("⚠️  WARNING: Inconsistent pause state!");
    console.log("Recommendation: Pause all contracts or unpause all");
    console.log("");
  }

  // Additional checks
  console.log("Additional Security Checks:");
  console.log("==========================");
  console.log("");

  // Check recent events (if any suspicious activity)
  try {
    const lendingPool = await ethers.getContractAt(
      "LendingPool",
      process.env.LENDING_POOL_ADDRESS || ""
    );
    
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks
    
    // Check for admin operations
    const filter = lendingPool.filters.RoleGranted();
    const events = await lendingPool.queryFilter(filter, fromBlock, currentBlock);
    
    if (events.length > 0) {
      console.log(`⚠️  ${events.length} role grant(s) in last 1000 blocks`);
      console.log("   Review admin operations manually");
    } else {
      console.log("✅ No recent role grants");
    }
  } catch (error) {
    console.log("⚠️  Unable to check recent events");
  }

  console.log("");

  // Export status
  const statusReport = {
    timestamp: new Date().toISOString(),
    network,
    blockNumber: await ethers.provider.getBlockNumber(),
    contracts: statuses,
    summary: {
      allPaused,
      anyPaused,
      errors,
    },
  };

  console.log("Status Report JSON:");
  console.log(JSON.stringify(statusReport, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

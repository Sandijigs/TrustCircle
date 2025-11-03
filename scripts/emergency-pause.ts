import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Emergency Pause Script
 * 
 * Pauses all TrustCircle contracts in case of a security incident.
 * Only to be used by authorized PAUSER_ROLE accounts.
 * 
 * Usage:
 *   npm run emergency:pause
 *   or
 *   npx ts-node scripts/emergency-pause.ts --network alfajores
 */

interface ContractAddresses {
  lendingPool: string;
  loanManager: string;
  lendingCircle: string;
  collateralManager: string;
  creditScore: string;
  verificationSBT: string;
}

// Contract addresses (update these after deployment)
const ADDRESSES: { [network: string]: ContractAddresses } = {
  alfajores: {
    lendingPool: process.env.LENDING_POOL_ADDRESS || "",
    loanManager: process.env.LOAN_MANAGER_ADDRESS || "",
    lendingCircle: process.env.LENDING_CIRCLE_ADDRESS || "",
    collateralManager: process.env.COLLATERAL_MANAGER_ADDRESS || "",
    creditScore: process.env.CREDIT_SCORE_ADDRESS || "",
    verificationSBT: process.env.VERIFICATION_SBT_ADDRESS || "",
  },
  celo: {
    lendingPool: process.env.LENDING_POOL_ADDRESS_MAINNET || "",
    loanManager: process.env.LOAN_MANAGER_ADDRESS_MAINNET || "",
    lendingCircle: process.env.LENDING_CIRCLE_ADDRESS_MAINNET || "",
    collateralManager: process.env.COLLATERAL_MANAGER_ADDRESS_MAINNET || "",
    creditScore: process.env.CREDIT_SCORE_ADDRESS_MAINNET || "",
    verificationSBT: process.env.VERIFICATION_SBT_ADDRESS_MAINNET || "",
  },
};

async function main() {
  console.log("🚨 EMERGENCY PAUSE PROCEDURE");
  console.log("============================");
  console.log("");

  const network = hre.network.name;
  console.log(`Network: ${network}`);
  console.log("");

  const [signer] = await ethers.getSigners();
  console.log(`Pauser account: ${signer.address}`);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} CELO`);
  console.log("");

  if (balance === 0n) {
    throw new Error("Insufficient balance to execute transactions");
  }

  // Get contract addresses for network
  const addresses = ADDRESSES[network];
  if (!addresses) {
    throw new Error(`No contract addresses configured for network: ${network}`);
  }

  // Verify addresses are set
  const missingAddresses = Object.entries(addresses)
    .filter(([_, address]) => !address || address === "")
    .map(([name]) => name);

  if (missingAddresses.length > 0) {
    throw new Error(
      `Missing contract addresses: ${missingAddresses.join(", ")}\n` +
      `Please set these in your .env.local file`
    );
  }

  console.log("⚠️  WARNING: This will pause ALL TrustCircle contracts!");
  console.log("Users will NOT be able to:");
  console.log("  - Request new loans");
  console.log("  - Make deposits");
  console.log("  - Create lending circles");
  console.log("  - Make repayments");
  console.log("");
  console.log("Users WILL still be able to:");
  console.log("  - View their balances");
  console.log("  - Check contract state");
  console.log("");

  // In production, add confirmation prompt
  // For now, proceed automatically

  console.log("Pausing contracts...");
  console.log("");

  const results: { contract: string; success: boolean; txHash?: string; error?: string }[] = [];

  // 1. Pause LendingPool
  try {
    console.log("1/6 Pausing LendingPool...");
    const lendingPool = await ethers.getContractAt("LendingPool", addresses.lendingPool);
    const tx1 = await lendingPool.pause();
    await tx1.wait();
    results.push({ contract: "LendingPool", success: true, txHash: tx1.hash });
    console.log(`✅ LendingPool paused: ${tx1.hash}`);
  } catch (error: any) {
    results.push({ contract: "LendingPool", success: false, error: error.message });
    console.log(`❌ Failed to pause LendingPool: ${error.message}`);
  }

  // 2. Pause LoanManager
  try {
    console.log("2/6 Pausing LoanManager...");
    const loanManager = await ethers.getContractAt("LoanManager", addresses.loanManager);
    const tx2 = await loanManager.pause();
    await tx2.wait();
    results.push({ contract: "LoanManager", success: true, txHash: tx2.hash });
    console.log(`✅ LoanManager paused: ${tx2.hash}`);
  } catch (error: any) {
    results.push({ contract: "LoanManager", success: false, error: error.message });
    console.log(`❌ Failed to pause LoanManager: ${error.message}`);
  }

  // 3. Pause LendingCircle
  try {
    console.log("3/6 Pausing LendingCircle...");
    const lendingCircle = await ethers.getContractAt("LendingCircle", addresses.lendingCircle);
    const tx3 = await lendingCircle.pause();
    await tx3.wait();
    results.push({ contract: "LendingCircle", success: true, txHash: tx3.hash });
    console.log(`✅ LendingCircle paused: ${tx3.hash}`);
  } catch (error: any) {
    results.push({ contract: "LendingCircle", success: false, error: error.message });
    console.log(`❌ Failed to pause LendingCircle: ${error.message}`);
  }

  // 4. Pause CollateralManager
  try {
    console.log("4/6 Pausing CollateralManager...");
    const collateralManager = await ethers.getContractAt("CollateralManager", addresses.collateralManager);
    const tx4 = await collateralManager.pause();
    await tx4.wait();
    results.push({ contract: "CollateralManager", success: true, txHash: tx4.hash });
    console.log(`✅ CollateralManager paused: ${tx4.hash}`);
  } catch (error: any) {
    results.push({ contract: "CollateralManager", success: false, error: error.message });
    console.log(`❌ Failed to pause CollateralManager: ${error.message}`);
  }

  // 5. Pause CreditScore
  try {
    console.log("5/6 Pausing CreditScore...");
    const creditScore = await ethers.getContractAt("CreditScore", addresses.creditScore);
    const tx5 = await creditScore.pause();
    await tx5.wait();
    results.push({ contract: "CreditScore", success: true, txHash: tx5.hash });
    console.log(`✅ CreditScore paused: ${tx5.hash}`);
  } catch (error: any) {
    results.push({ contract: "CreditScore", success: false, error: error.message });
    console.log(`❌ Failed to pause CreditScore: ${error.message}`);
  }

  // 6. Pause VerificationSBT
  try {
    console.log("6/6 Pausing VerificationSBT...");
    const verificationSBT = await ethers.getContractAt("VerificationSBT", addresses.verificationSBT);
    const tx6 = await verificationSBT.pause();
    await tx6.wait();
    results.push({ contract: "VerificationSBT", success: true, txHash: tx6.hash });
    console.log(`✅ VerificationSBT paused: ${tx6.hash}`);
  } catch (error: any) {
    results.push({ contract: "VerificationSBT", success: false, error: error.message });
    console.log(`❌ Failed to pause VerificationSBT: ${error.message}`);
  }

  console.log("");
  console.log("============================");
  console.log("SUMMARY");
  console.log("============================");
  console.log("");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successfully paused: ${successful.length}/6 contracts`);
  if (failed.length > 0) {
    console.log(`❌ Failed to pause: ${failed.length}/6 contracts`);
    console.log("");
    console.log("Failed contracts:");
    failed.forEach((r) => {
      console.log(`  - ${r.contract}: ${r.error}`);
    });
  }

  console.log("");
  console.log("NEXT STEPS:");
  console.log("1. Verify pause status with: npm run security:status");
  console.log("2. Post security notice to users");
  console.log("3. Investigate the security issue");
  console.log("4. Develop and test fix");
  console.log("5. Deploy fix");
  console.log("6. Unpause contracts when ready");
  console.log("");

  // Save pause record
  const record = {
    timestamp: new Date().toISOString(),
    network,
    pauser: signer.address,
    results,
  };

  console.log("Pause record:");
  console.log(JSON.stringify(record, null, 2));

  // Exit with error if any contracts failed to pause
  if (failed.length > 0) {
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

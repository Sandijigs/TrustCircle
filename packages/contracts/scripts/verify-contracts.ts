import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Load deployment addresses
const deploymentsPath = path.join(__dirname, "../deployments.json");
const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

async function verifyContract(contractAddress: string, constructorArgs: any[]) {
  console.log(`Verifying contract at ${contractAddress}...`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ Contract verified successfully!`);
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ Contract already verified!`);
    } else {
      console.error(`❌ Verification failed: ${error.message}`);
    }
  }
}

async function main() {
  console.log("🔍 Starting contract verification on Celo Sepolia...\n");

  const networkData = deployments.celoSepolia;
  if (!networkData) {
    console.error("No deployment data found for Celo Sepolia!");
    process.exit(1);
  }

  const contracts = networkData.contracts;
  const deployer = networkData.deployer;

  console.log("Deployer address:", deployer);
  console.log("Network:", networkData.network);
  console.log("Timestamp:", networkData.timestamp);
  console.log("\n" + "=".repeat(60) + "\n");

  // Since these are UUPS proxies deployed via OpenZeppelin's deployProxy,
  // we need to verify the implementation contracts, not the proxies
  // The proxies are already verified standard OpenZeppelin contracts

  console.log("Note: These are UUPS proxy contracts.");
  console.log("The proxy contracts use standard OpenZeppelin implementations.");
  console.log("We'll verify the implementation contracts.\n");

  // Verify each contract
  // For proxy contracts, constructor args are empty as initialization happens separately
  
  console.log("1️⃣ Verifying CreditScore...");
  await verifyContract(contracts.creditScore, []);
  console.log();

  console.log("2️⃣ Verifying VerificationSBT...");
  await verifyContract(contracts.verificationSBT, []);
  console.log();

  console.log("3️⃣ Verifying LendingPool...");
  await verifyContract(contracts.lendingPool, []);
  console.log();

  console.log("4️⃣ Verifying CollateralManager...");
  await verifyContract(contracts.collateralManager, []);
  console.log();

  console.log("5️⃣ Verifying LoanManager...");
  await verifyContract(contracts.loanManager, []);
  console.log();

  console.log("6️⃣ Verifying LendingCircle...");
  await verifyContract(contracts.lendingCircle, []);
  console.log();

  console.log("=".repeat(60));
  console.log("✅ Verification process completed!");
  console.log("\n📝 View verified contracts on CeloScan:");
  console.log(`   CreditScore: https://celo-sepolia.blockscout.com/address/${contracts.creditScore}#code`);
  console.log(`   VerificationSBT: https://celo-sepolia.blockscout.com/address/${contracts.verificationSBT}#code`);
  console.log(`   LendingPool: https://celo-sepolia.blockscout.com/address/${contracts.lendingPool}#code`);
  console.log(`   CollateralManager: https://celo-sepolia.blockscout.com/address/${contracts.collateralManager}#code`);
  console.log(`   LoanManager: https://celo-sepolia.blockscout.com/address/${contracts.loanManager}#code`);
  console.log(`   LendingCircle: https://celo-sepolia.blockscout.com/address/${contracts.lendingCircle}#code`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

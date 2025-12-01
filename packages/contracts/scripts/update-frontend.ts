/**
 * Update Frontend Contract Addresses
 *
 * This script automatically updates the frontend with the latest deployed contract addresses
 * After deployment, run this to sync addresses between contracts and frontend packages
 */

import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔄 Updating frontend with contract addresses...\n");

  // Read deployment addresses from contracts package
  const deploymentsPath = path.join(__dirname, "../deployments.json");

  if (!fs.existsSync(deploymentsPath)) {
    console.error("❌ deployments.json not found!");
    console.error("   Run deployment first: npx hardhat run scripts/deploy.ts --network celoSepolia");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log("✅ Read deployment addresses from contracts package");

  // Copy deployments.json to frontend
  const frontendDeploymentsPath = path.join(
    __dirname,
    "../../../packages/frontend/lib/contracts/deployments.json"
  );

  // Ensure the directory exists
  const frontendContractsDir = path.dirname(frontendDeploymentsPath);
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
    console.log("✅ Created frontend contracts directory");
  }

  // Write deployments to frontend
  fs.writeFileSync(
    frontendDeploymentsPath,
    JSON.stringify(deployments, null, 2)
  );
  console.log("✅ Updated frontend deployments.json");

  // Copy contract ABIs to frontend
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const frontendArtifactsDir = path.join(
    __dirname,
    "../../../packages/frontend/lib/contracts/artifacts"
  );

  if (!fs.existsSync(frontendArtifactsDir)) {
    fs.mkdirSync(frontendArtifactsDir, { recursive: true });
    console.log("✅ Created frontend artifacts directory");
  }

  // List of contracts to copy
  const contracts = [
    "CreditScore.sol/CreditScore.json",
    "VerificationSBT.sol/VerificationSBT.json",
    "LendingPool.sol/LendingPool.json",
    "CollateralManager.sol/CollateralManager.json",
    "LoanManager.sol/LoanManager.json",
    "LendingCircle.sol/LendingCircle.json",
  ];

  console.log("\n📦 Copying contract ABIs to frontend...");
  for (const contract of contracts) {
    const sourcePath = path.join(artifactsDir, contract);
    const destPath = path.join(frontendArtifactsDir, contract);

    // Create subdirectories if needed
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`   ✓ Copied ${contract}`);
    } else {
      console.warn(`   ⚠️  ${contract} not found - contract may not be compiled`);
    }
  }

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ FRONTEND UPDATE COMPLETE!");
  console.log("=".repeat(60));

  // Show which networks have deployments
  console.log("\n📝 Available Networks:");
  console.log("-".repeat(60));
  for (const [network, data] of Object.entries(deployments) as [string, any][]) {
    console.log(`${network}:`);
    console.log(`  Deployed at: ${data.timestamp}`);
    console.log(`  Deployer: ${data.deployer}`);
    console.log(`  Contracts: ${Object.keys(data.contracts).length}`);
  }
  console.log("-".repeat(60));

  console.log("\n📋 Next Steps:");
  console.log("1. Restart your frontend development server");
  console.log("2. Verify contract addresses in frontend UI");
  console.log("3. Test contract interactions");
  console.log("\n✨ Frontend is now synced with deployed contracts!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

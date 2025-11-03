import { ethers, upgrades } from "hardhat";

/**
 * TrustCircle Deployment Script
 *
 * Deploys all contracts in the correct order with proper initialization
 * Uses UUPS proxy pattern for upgradeability
 */

async function main() {
  console.log("🚀 Starting TrustCircle deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ==================== DEPLOY CREDIT SCORE ====================
  console.log("📊 Deploying CreditScore...");
  const CreditScore = await ethers.getContractFactory("CreditScore");
  const creditScore = await upgrades.deployProxy(
    CreditScore,
    [deployer.address],
    { kind: "uups" }
  );
  await creditScore.waitForDeployment();
  const creditScoreAddress = await creditScore.getAddress();
  console.log("✅ CreditScore deployed to:", creditScoreAddress);

  // Grant AI agent role (for now, use deployer)
  const AI_AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_AGENT_ROLE"));
  await creditScore.grantRole(AI_AGENT_ROLE, deployer.address);
  console.log("   Granted AI_AGENT_ROLE to deployer\n");

  // ==================== DEPLOY VERIFICATION SBT ====================
  console.log("🎫 Deploying VerificationSBT...");
  const VerificationSBT = await ethers.getContractFactory("VerificationSBT");
  const verificationSBT = await upgrades.deployProxy(
    VerificationSBT,
    [deployer.address],
    { kind: "uups" }
  );
  await verificationSBT.waitForDeployment();
  const verificationSBTAddress = await verificationSBT.getAddress();
  console.log("✅ VerificationSBT deployed to:", verificationSBTAddress);

  // Set base URI (update with actual IPFS/server URL)
  await verificationSBT.setBaseURI("https://api.trustcircle.finance/verification/");
  console.log("   Set base URI for verification metadata\n");

  // ==================== DEPLOY LENDING POOL ====================
  console.log("💰 Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await upgrades.deployProxy(
    LendingPool,
    [deployer.address],
    { kind: "uups" }
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ LendingPool deployed to:", lendingPoolAddress);

  // Create pools for Mento stablecoins
  const networkName = await ethers.provider.getNetwork().then(n => n.name);
  const isAlfajores = networkName.includes("alfajores") || (await ethers.provider.getNetwork()).chainId === 44787n;

  const tokens = isAlfajores ? {
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
    cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
  } : {
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    cEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
    cREAL: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787",
  };

  console.log(`   Whitelisting ${isAlfajores ? 'Alfajores' : 'Celo Mainnet'} tokens...`);
  await lendingPool.whitelistToken(tokens.cUSD, true);
  console.log("   ✓ Whitelisted cUSD");
  await lendingPool.whitelistToken(tokens.cEUR, true);
  console.log("   ✓ Whitelisted cEUR");
  await lendingPool.whitelistToken(tokens.cREAL, true);
  console.log("   ✓ Whitelisted cREAL");

  console.log(`   Creating pools for whitelisted tokens...`);
  await lendingPool.createPool(tokens.cUSD);
  console.log("   ✓ Created cUSD pool");
  await lendingPool.createPool(tokens.cEUR);
  console.log("   ✓ Created cEUR pool");
  await lendingPool.createPool(tokens.cREAL);
  console.log("   ✓ Created cREAL pool\n");

  // ==================== DEPLOY COLLATERAL MANAGER ====================
  console.log("🔐 Deploying CollateralManager...");
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await upgrades.deployProxy(
    CollateralManager,
    [deployer.address],
    { kind: "uups" }
  );
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("✅ CollateralManager deployed to:", collateralManagerAddress);

  // Add supported collateral assets
  await collateralManager.addSupportedAsset(tokens.cUSD, 0); // ERC20
  await collateralManager.addSupportedAsset(tokens.cEUR, 0); // ERC20
  await collateralManager.addSupportedAsset(tokens.cREAL, 0); // ERC20
  console.log("   Added Mento stablecoins as supported collateral\n");

  // ==================== DEPLOY LOAN MANAGER ====================
  console.log("📋 Deploying LoanManager...");
  const LoanManager = await ethers.getContractFactory("LoanManager");
  const loanManager = await upgrades.deployProxy(
    LoanManager,
    [
      deployer.address,
      lendingPoolAddress,
      creditScoreAddress,
      collateralManagerAddress,
    ],
    { kind: "uups" }
  );
  await loanManager.waitForDeployment();
  const loanManagerAddress = await loanManager.getAddress();
  console.log("✅ LoanManager deployed to:", loanManagerAddress, "\n");

  // ==================== DEPLOY LENDING CIRCLE ====================
  console.log("🤝 Deploying LendingCircle...");
  const LendingCircle = await ethers.getContractFactory("LendingCircle");
  const lendingCircle = await upgrades.deployProxy(
    LendingCircle,
    [deployer.address, creditScoreAddress],
    { kind: "uups" }
  );
  await lendingCircle.waitForDeployment();
  const lendingCircleAddress = await lendingCircle.getAddress();
  console.log("✅ LendingCircle deployed to:", lendingCircleAddress, "\n");

  // ==================== GRANT ROLES ====================
  console.log("🔑 Setting up role permissions...");

  // LendingPool: Grant LOAN_MANAGER_ROLE to LoanManager
  const LOAN_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LOAN_MANAGER_ROLE"));
  await lendingPool.grantRole(LOAN_MANAGER_ROLE, loanManagerAddress);
  console.log("   ✓ Granted LOAN_MANAGER_ROLE to LoanManager on LendingPool");

  // CollateralManager: Grant LOAN_MANAGER_ROLE to LoanManager
  await collateralManager.grantRole(LOAN_MANAGER_ROLE, loanManagerAddress);
  console.log("   ✓ Granted LOAN_MANAGER_ROLE to LoanManager on CollateralManager");

  // CreditScore: Grant SCORE_UPDATER_ROLE to LoanManager
  const SCORE_UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SCORE_UPDATER_ROLE"));
  await creditScore.grantRole(SCORE_UPDATER_ROLE, loanManagerAddress);
  console.log("   ✓ Granted SCORE_UPDATER_ROLE to LoanManager on CreditScore");

  // LoanManager: Grant APPROVER_ROLE to LendingCircle
  const APPROVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("APPROVER_ROLE"));
  await loanManager.grantRole(APPROVER_ROLE, lendingCircleAddress);
  console.log("   ✓ Granted APPROVER_ROLE to LendingCircle on LoanManager\n");

  // ==================== DEPLOYMENT SUMMARY ====================
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📝 Contract Addresses:");
  console.log("-".repeat(60));
  console.log("CreditScore:        ", creditScoreAddress);
  console.log("VerificationSBT:    ", verificationSBTAddress);
  console.log("LendingPool:        ", lendingPoolAddress);
  console.log("CollateralManager:  ", collateralManagerAddress);
  console.log("LoanManager:        ", loanManagerAddress);
  console.log("LendingCircle:      ", lendingCircleAddress);
  console.log("-".repeat(60));

  console.log("\n💰 Mento Token Pools Created:");
  console.log("-".repeat(60));
  console.log("cUSD:  ", tokens.cUSD);
  console.log("cEUR:  ", tokens.cEUR);
  console.log("cREAL: ", tokens.cREAL);
  console.log("-".repeat(60));

  console.log("\n📋 Next Steps:");
  console.log("1. Verify contracts on CeloScan");
  console.log("2. Update frontend config with contract addresses");
  console.log("3. Set up AI agent with API keys");
  console.log("4. Configure verification providers");
  console.log("5. Test with small amounts on testnet");
  console.log("\n✅ Ready for testing!");

  // Save addresses to file
  const addresses = {
    network: isAlfajores ? "alfajores" : "celo",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      creditScore: creditScoreAddress,
      verificationSBT: verificationSBTAddress,
      lendingPool: lendingPoolAddress,
      collateralManager: collateralManagerAddress,
      loanManager: loanManagerAddress,
      lendingCircle: lendingCircleAddress,
    },
    tokens: tokens,
  };

  const fs = require("fs");
  const path = require("path");
  const addressesPath = path.join(__dirname, "../deployments.json");

  let allDeployments: any = {};
  if (fs.existsSync(addressesPath)) {
    allDeployments = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  }

  allDeployments[addresses.network] = addresses;
  fs.writeFileSync(addressesPath, JSON.stringify(allDeployments, null, 2));

  console.log("\n💾 Deployment addresses saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

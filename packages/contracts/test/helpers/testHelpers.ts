import hre from "hardhat";
const { ethers, upgrades } = hre;
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

export const ROLES = {
  ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
  LOAN_MANAGER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("LOAN_MANAGER_ROLE")),
  PAUSER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE")),
  APPROVER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("APPROVER_ROLE")),
  VERIFIER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE")),
};

export const CONSTANTS = {
  INITIAL_SUPPLY: ethers.parseEther("1000000"),
  MIN_LOAN_AMOUNT: ethers.parseEther("50"),
  MAX_LOAN_AMOUNT: ethers.parseEther("5000"),
  TYPICAL_LOAN_AMOUNT: ethers.parseEther("500"),
  DEPOSIT_AMOUNT: ethers.parseEther("1000"),
  BASIS_POINTS: 10000n,
  SECONDS_PER_DAY: 86400,
  SECONDS_PER_WEEK: 604800,
  SECONDS_PER_MONTH: 2592000,
};

export interface DeployedContracts {
  lendingPool: any;
  loanManager: any;
  lendingCircle: any;
  creditScore: any;
  collateralManager: any;
  verificationSBT: any;
  interestCalculator: any;
  mockToken: any;
  mockToken2?: any;
}

export interface TestAccounts {
  owner: HardhatEthersSigner;
  admin: HardhatEthersSigner;
  lender: HardhatEthersSigner;
  lender2: HardhatEthersSigner;
  borrower: HardhatEthersSigner;
  borrower2: HardhatEthersSigner;
  loanManager: HardhatEthersSigner;
  verifier: HardhatEthersSigner;
  attacker: HardhatEthersSigner;
  user1: HardhatEthersSigner;
  user2: HardhatEthersSigner;
}

/**
 * Deploy all core contracts for testing
 */
export async function deployFullSystem(): Promise<DeployedContracts> {
  // Deploy Mock ERC20 tokens
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("Mock USD", "mUSD", CONSTANTS.INITIAL_SUPPLY);
  await mockToken.waitForDeployment();
  
  const mockToken2 = await MockERC20.deploy("Mock EUR", "mEUR", CONSTANTS.INITIAL_SUPPLY);
  await mockToken2.waitForDeployment();

  // Deploy InterestCalculator
  const InterestCalculator = await ethers.getContractFactory("InterestCalculator");
  const interestCalculator = await InterestCalculator.deploy();
  await interestCalculator.waitForDeployment();

  // Deploy CreditScore
  const CreditScore = await ethers.getContractFactory("CreditScore");
  const creditScore = await upgrades.deployProxy(
    CreditScore,
    [(await ethers.getSigners())[0].address],
    { kind: "uups" }
  );
  await creditScore.waitForDeployment();

  // Deploy VerificationSBT
  const VerificationSBT = await ethers.getContractFactory("VerificationSBT");
  const verificationSBT = await upgrades.deployProxy(
    VerificationSBT,
    [(await ethers.getSigners())[0].address],
    { kind: "uups" }
  );
  await verificationSBT.waitForDeployment();

  // Deploy CollateralManager
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await upgrades.deployProxy(
    CollateralManager,
    [(await ethers.getSigners())[0].address],
    { kind: "uups" }
  );
  await collateralManager.waitForDeployment();

  // Deploy LendingPool
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await upgrades.deployProxy(
    LendingPool,
    [(await ethers.getSigners())[0].address],
    { kind: "uups" }
  );
  await lendingPool.waitForDeployment();

  // Deploy LoanManager
  const LoanManager = await ethers.getContractFactory("LoanManager");
  const loanManager = await upgrades.deployProxy(
    LoanManager,
    [
      (await ethers.getSigners())[0].address,
      await lendingPool.getAddress(),
      await creditScore.getAddress(),
      await collateralManager.getAddress(),
    ],
    { kind: "uups" }
  );
  await loanManager.waitForDeployment();

  // Deploy LendingCircle
  const LendingCircle = await ethers.getContractFactory("LendingCircle");
  const lendingCircle = await upgrades.deployProxy(
    LendingCircle,
    [
      (await ethers.getSigners())[0].address,
      await creditScore.getAddress(),
    ],
    { kind: "uups" }
  );
  await lendingCircle.waitForDeployment();

  return {
    lendingPool,
    loanManager,
    lendingCircle,
    creditScore,
    collateralManager,
    verificationSBT,
    interestCalculator,
    mockToken,
    mockToken2,
  };
}

/**
 * Get test accounts with descriptive names
 */
export async function getTestAccounts(): Promise<TestAccounts> {
  const signers = await ethers.getSigners();
  return {
    owner: signers[0],
    admin: signers[1],
    lender: signers[2],
    lender2: signers[3],
    borrower: signers[4],
    borrower2: signers[5],
    loanManager: signers[6],
    verifier: signers[7],
    attacker: signers[8],
    user1: signers[9],
    user2: signers[10],
  };
}

/**
 * Setup lending pool with token and initial liquidity
 */
export async function setupLendingPool(
  lendingPool: any,
  mockToken: any,
  lender: HardhatEthersSigner,
  depositAmount = CONSTANTS.DEPOSIT_AMOUNT
) {
  // Whitelist token
  await lendingPool.whitelistToken(await mockToken.getAddress(), true);
  
  // Create pool
  await lendingPool.createPool(await mockToken.getAddress());
  
  // Transfer tokens to lender and deposit
  await mockToken.transfer(lender.address, depositAmount);
  await mockToken.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
  await lendingPool.connect(lender).deposit(await mockToken.getAddress(), depositAmount);
  
  return { poolAddress: await lendingPool.getAddress() };
}

/**
 * Grant necessary roles for testing
 */
export async function setupRoles(
  contracts: DeployedContracts,
  accounts: TestAccounts
) {
  // Grant LOAN_MANAGER_ROLE to LoanManager contract
  await contracts.lendingPool.grantRole(
    ROLES.LOAN_MANAGER_ROLE,
    await contracts.loanManager.getAddress()
  );
  
  // Grant LOAN_MANAGER_ROLE to test account for manual operations
  await contracts.lendingPool.grantRole(
    ROLES.LOAN_MANAGER_ROLE,
    accounts.loanManager.address
  );
  
  // Grant VERIFIER_ROLE to verifier account
  await contracts.verificationSBT.grantRole(
    ROLES.VERIFIER_ROLE,
    accounts.verifier.address
  );
  
  // Grant APPROVER_ROLE to admin
  await contracts.loanManager.grantRole(
    ROLES.APPROVER_ROLE,
    accounts.admin.address
  );
}

/**
 * Fast forward time by specified seconds
 */
export async function increaseTime(seconds: number) {
  await time.increase(seconds);
}

/**
 * Fast forward to specific timestamp
 */
export async function setTime(timestamp: number) {
  await time.increaseTo(timestamp);
}

/**
 * Get current block timestamp
 */
export async function getCurrentTime(): Promise<number> {
  return await time.latest();
}

/**
 * Calculate expected interest using simple interest formula
 */
export function calculateSimpleInterest(
  principal: bigint,
  rateAPY: bigint,
  durationSeconds: bigint
): bigint {
  const SECONDS_PER_YEAR = 31536000n;
  return (principal * rateAPY * durationSeconds) / (CONSTANTS.BASIS_POINTS * SECONDS_PER_YEAR);
}

/**
 * Calculate installment amount for amortized loan
 */
export function calculateInstallment(
  principal: bigint,
  rateAPY: bigint,
  numInstallments: bigint
): bigint {
  if (rateAPY === 0n) {
    return principal / numInstallments;
  }
  
  const rate = rateAPY / CONSTANTS.BASIS_POINTS;
  const periodicRate = rate / numInstallments;
  
  const numerator = principal * periodicRate * ((1n + periodicRate) ** numInstallments);
  const denominator = ((1n + periodicRate) ** numInstallments) - 1n;
  
  return numerator / denominator;
}

/**
 * Setup a borrower with credit score and verification
 */
export async function setupBorrower(
  contracts: DeployedContracts,
  borrower: HardhatEthersSigner,
  creditScore: number,
  verified: boolean = true
) {
  // Set credit score
  await contracts.creditScore.updateCreditScore(borrower.address, creditScore);
  
  // Issue verification SBT if needed
  if (verified) {
    const verifier = (await ethers.getSigners())[7];
    await contracts.verificationSBT.grantRole(ROLES.VERIFIER_ROLE, verifier.address);
    await contracts.verificationSBT.connect(verifier).issueVerification(
      borrower.address,
      "verification-hash",
      ethers.keccak256(ethers.toUtf8Bytes("verification-data"))
    );
  }
}

/**
 * Create and approve a loan
 */
export async function createAndApproveLoan(
  loanManager: any,
  borrower: HardhatEthersSigner,
  asset: string,
  amount: bigint,
  duration: number,
  frequency: number = 2 // Monthly
) {
  // Request loan
  await loanManager.connect(borrower).requestLoan(asset, amount, duration, frequency);
  
  // Get loan ID
  const loanCount = await loanManager.loanCounter();
  const loanId = loanCount;
  
  // Approve if needed (for low credit scores)
  const loan = await loanManager.loans(loanId);
  if (loan.status === 0n) { // Pending
    const approver = (await ethers.getSigners())[1];
    await loanManager.grantRole(ROLES.APPROVER_ROLE, approver.address);
    await loanManager.connect(approver).approveLoan(loanId);
  }
  
  return loanId;
}

/**
 * Disburse a loan
 */
export async function disburseLoan(
  loanManager: any,
  loanId: bigint
) {
  await loanManager.disburseLoan(loanId);
  return loanId;
}

/**
 * Make a loan repayment
 */
export async function repayLoan(
  loanManager: any,
  mockToken: any,
  borrower: HardhatEthersSigner,
  loanId: bigint,
  amount: bigint
) {
  await mockToken.transfer(borrower.address, amount * 2n); // Extra for safety
  await mockToken.connect(borrower).approve(await loanManager.getAddress(), amount);
  await loanManager.connect(borrower).makeRepayment(loanId, amount);
}

/**
 * Expect revert with custom error
 */
export async function expectRevert(
  promise: Promise<any>,
  errorName?: string
) {
  try {
    await promise;
    throw new Error("Expected transaction to revert");
  } catch (error: any) {
    if (errorName && !error.message.includes(errorName)) {
      throw new Error(`Expected error ${errorName}, got: ${error.message}`);
    }
  }
}

/**
 * Get event from transaction receipt
 */
export async function getEvent(tx: any, eventName: string) {
  const receipt = await tx.wait();
  const event = receipt.logs.find((log: any) => {
    try {
      return log.fragment && log.fragment.name === eventName;
    } catch {
      return false;
    }
  });
  return event;
}

/**
 * Format ether for readable output
 */
export function formatEther(wei: bigint): string {
  return ethers.formatEther(wei);
}

/**
 * Parse ether from string
 */
export function parseEther(ether: string): bigint {
  return ethers.parseEther(ether);
}

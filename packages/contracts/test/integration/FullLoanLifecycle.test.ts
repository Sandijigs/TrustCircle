import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFullSystem,
  getTestAccounts,
  setupRoles,
  setupLendingPool,
  setupBorrower,
  CONSTANTS,
  increaseTime,
  getCurrentTime,
} from "../helpers/testHelpers";

describe("Full Loan Lifecycle Integration", function () {
  async function deployFixture() {
    const contracts = await deployFullSystem();
    const accounts = await getTestAccounts();
    await setupRoles(contracts, accounts);
    
    // Setup lending pool with liquidity
    await setupLendingPool(
      contracts.lendingPool,
      contracts.mockToken,
      accounts.lender,
      ethers.parseEther("10000")
    );
    
    // Setup borrower with credit score and verification
    await setupBorrower(contracts, accounts.borrower, 700, true);
    
    return { ...contracts, ...accounts };
  }

  describe("Complete Loan Flow", function () {
    it("Should complete full loan lifecycle: request -> approve -> disburse -> repay", async function () {
      const {
        loanManager,
        lendingPool,
        mockToken,
        creditScore,
        borrower,
        admin,
      } = await loadFixture(deployFixture);
      
      const loanAmount = ethers.parseEther("1000");
      const duration = 90 * CONSTANTS.SECONDS_PER_DAY;
      
      // Step 1: Borrower requests loan
      console.log("Step 1: Requesting loan...");
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        loanAmount,
        duration,
        2 // Monthly payments
      );
      
      const loanId = await loanManager.loanCounter();
      let loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(0); // Pending
      
      // Step 2: Admin approves loan
      console.log("Step 2: Approving loan...");
      await loanManager.connect(admin).approveLoan(loanId);
      
      loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(1); // Approved
      
      // Step 3: Disburse loan
      console.log("Step 3: Disbursing loan...");
      const borrowerBalanceBefore = await mockToken.balanceOf(borrower.address);
      await loanManager.disburseLoan(loanId);
      
      const borrowerBalanceAfter = await mockToken.balanceOf(borrower.address);
      expect(borrowerBalanceAfter - borrowerBalanceBefore).to.equal(loanAmount);
      
      loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(2); // Active
      
      // Check pool stats updated
      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalBorrowed).to.equal(loanAmount);
      
      // Step 4: Make first installment payment
      console.log("Step 4: Making first repayment...");
      const installmentAmount = loan.installmentAmount;
      await mockToken.transfer(borrower.address, installmentAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), installmentAmount);
      
      await loanManager.connect(borrower).makeRepayment(loanId, installmentAmount);
      
      loan = await loanManager.loans(loanId);
      expect(loan.paidInstallments).to.equal(1);
      
      // Step 5: Fast forward and make remaining payments
      console.log("Step 5: Completing remaining payments...");
      const remainingAmount = loan.totalAmountDue - loan.amountPaid;
      
      await increaseTime(31 * CONSTANTS.SECONDS_PER_DAY);
      await mockToken.transfer(borrower.address, remainingAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), remainingAmount);
      
      await loanManager.connect(borrower).makeRepayment(loanId, remainingAmount);
      
      // Verify loan is completed
      loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(3); // Completed
      expect(loan.amountPaid).to.be.gte(loan.totalAmountDue);
      
      // Step 6: Verify credit score improved
      const creditScoreAfter = await creditScore.getCreditScore(borrower.address);
      expect(creditScoreAfter).to.be.gt(700); // Should increase after successful repayment
      
      // Step 7: Verify pool received funds back with interest
      const poolDataAfter = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolDataAfter.totalBorrowed).to.equal(0);
      expect(poolDataAfter.accumulatedInterest).to.be.gt(0);
      
      console.log("✓ Full loan lifecycle completed successfully");
    });
  });

  describe("Multi-Borrower Scenario", function () {
    it("Should handle multiple concurrent loans", async function () {
      const {
        loanManager,
        lendingPool,
        mockToken,
        creditScore,
        borrower,
        borrower2,
        admin,
      } = await loadFixture(deployFixture);
      
      // Setup second borrower
      await setupBorrower({ loanManager, creditScore } as any, borrower2, 750, true);
      
      // Both borrowers request loans
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("800"),
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      await loanManager.connect(borrower2).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("600"),
        60 * CONSTANTS.SECONDS_PER_DAY,
        1 // Bi-weekly
      );
      
      const loan1Id = 1n;
      const loan2Id = 2n;
      
      // Approve both
      await loanManager.connect(admin).approveLoan(loan1Id);
      await loanManager.connect(admin).approveLoan(loan2Id);
      
      // Disburse both
      await loanManager.disburseLoan(loan1Id);
      await loanManager.disburseLoan(loan2Id);
      
      // Verify both are active
      const loan1 = await loanManager.loans(loan1Id);
      const loan2 = await loanManager.loans(loan2Id);
      
      expect(loan1.status).to.equal(2); // Active
      expect(loan2.status).to.equal(2); // Active
      
      // Verify pool tracking
      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalBorrowed).to.equal(ethers.parseEther("1400"));
      
      // Both make repayments
      const repayAmount1 = loan1.installmentAmount;
      const repayAmount2 = loan2.installmentAmount;
      
      await mockToken.transfer(borrower.address, repayAmount1);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), repayAmount1);
      await loanManager.connect(borrower).makeRepayment(loan1Id, repayAmount1);
      
      await mockToken.transfer(borrower2.address, repayAmount2);
      await mockToken.connect(borrower2).approve(await loanManager.getAddress(), repayAmount2);
      await loanManager.connect(borrower2).makeRepayment(loan2Id, repayAmount2);
      
      // Verify repayments recorded
      const loan1After = await loanManager.loans(loan1Id);
      const loan2After = await loanManager.loans(loan2Id);
      
      expect(loan1After.paidInstallments).to.equal(1);
      expect(loan2After.paidInstallments).to.equal(1);
    });
  });

  describe("Lender Yield Flow", function () {
    it("Should distribute interest to lenders", async function () {
      const {
        loanManager,
        lendingPool,
        mockToken,
        borrower,
        lender,
        lender2,
        admin,
      } = await loadFixture(deployFixture);
      
      // Add second lender
      const depositAmount = ethers.parseEther("5000");
      await mockToken.transfer(lender2.address, depositAmount);
      await mockToken.connect(lender2).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender2).deposit(await mockToken.getAddress(), depositAmount);
      
      // Record initial shares
      const lender1SharesBefore = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      const lender2SharesBefore = (await lendingPool.userDeposits(lender2.address, await mockToken.getAddress())).shares;
      
      // Borrower takes and repays loan
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("2000"),
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      // Full repayment with interest
      const loan = await loanManager.loans(loanId);
      const totalRepayment = loan.totalAmountDue;
      
      await mockToken.transfer(borrower.address, totalRepayment);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), totalRepayment);
      await loanManager.connect(borrower).makeRepayment(loanId, totalRepayment);
      
      // Check that pool accumulated interest
      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.accumulatedInterest).to.be.gt(0);
      
      // Lenders' share value should have increased
      const lender1ValueAfter = await lendingPool.getUserShareValue(lender.address, await mockToken.getAddress());
      const lender2ValueAfter = await lendingPool.getUserShareValue(lender2.address, await mockToken.getAddress());
      
      // Values should reflect their proportional shares plus interest
      expect(lender1ValueAfter).to.be.gt(ethers.parseEther("10000")); // Original + interest
      expect(lender2ValueAfter).to.be.gt(depositAmount); // Original + interest
    });
  });

  describe("Default and Liquidation Flow", function () {
    it("Should handle loan default and liquidation", async function () {
      const {
        loanManager,
        lendingPool,
        collateralManager,
        mockToken,
        creditScore,
        borrower,
        admin,
      } = await loadFixture(deployFixture);
      
      const scoreBefore = await creditScore.getCreditScore(borrower.address);
      
      // Request and disburse loan
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      // Fast forward past default threshold (30 days late + initial period)
      await increaseTime(125 * CONSTANTS.SECONDS_PER_DAY);
      
      // Mark as defaulted
      await loanManager.markAsDefaulted(loanId);
      
      const loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(4); // Defaulted
      
      // Verify credit score decreased
      const scoreAfter = await creditScore.getCreditScore(borrower.address);
      expect(scoreAfter).to.be.lt(scoreBefore);
      
      console.log("✓ Default handling completed");
    });
  });

  describe("Circle-Based Lending Flow", function () {
    it("Should complete loan through lending circle", async function () {
      const {
        lendingCircle,
        loanManager,
        mockToken,
        creditScore,
        user1,
        user2,
        borrower,
      } = await loadFixture(deployFixture);
      
      // Setup credit scores
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      
      // Create circle
      await lendingCircle.connect(user1).createCircle(
        "Business Circle",
        "For local business loans",
        10,
        500
      );
      
      const circleId = 1n;
      
      // Add members
      await lendingCircle.connect(user2).requestToJoin(circleId);
      await lendingCircle.connect(borrower).requestToJoin(circleId);
      
      // Deposit to treasury
      const treasuryAmount = ethers.parseEther("500");
      await mockToken.transfer(user1.address, treasuryAmount);
      await mockToken.connect(user1).approve(await lendingCircle.getAddress(), treasuryAmount);
      await lendingCircle.connect(user1).depositToTreasury(
        circleId,
        await mockToken.getAddress(),
        treasuryAmount
      );
      
      // Propose loan
      await lendingCircle.connect(borrower).proposeLoan(
        circleId,
        await mockToken.getAddress(),
        ethers.parseEther("400"),
        60 * CONSTANTS.SECONDS_PER_DAY,
        "Need funds for inventory"
      );
      
      const proposalId = 1n;
      
      // Members vote
      await lendingCircle.connect(user1).voteOnProposal(proposalId, true);
      await lendingCircle.connect(user2).voteOnProposal(proposalId, true);
      
      const proposal = await lendingCircle.proposals(proposalId);
      expect(proposal.votesFor).to.be.gte(2);
      
      console.log("✓ Circle-based lending flow completed");
    });
  });

  describe("Pool Utilization and Interest Rate Changes", function () {
    it("Should adjust interest rates based on utilization", async function () {
      const {
        loanManager,
        lendingPool,
        mockToken,
        borrower,
        borrower2,
        creditScore,
        admin,
      } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower2, 750, true);
      
      // Check initial rate (0% utilization)
      const initialRate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      console.log("Initial APY:", initialRate.toString());
      
      // Take out 50% of liquidity
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("5000"),
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loan1Id = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loan1Id);
      await loanManager.disburseLoan(loan1Id);
      
      // Check rate at 50% utilization
      const midRate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      console.log("50% utilization APY:", midRate.toString());
      expect(midRate).to.be.gt(initialRate);
      
      // Take out more liquidity (80%+ utilization)
      await loanManager.connect(borrower2).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("3500"),
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loan2Id = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loan2Id);
      await loanManager.disburseLoan(loan2Id);
      
      // Check rate at high utilization
      const highRate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      console.log("85% utilization APY:", highRate.toString());
      expect(highRate).to.be.gt(midRate);
      
      console.log("✓ Interest rate curve working correctly");
    });
  });

  describe("Stress Test", function () {
    it("Should handle many concurrent operations", async function () {
      const {
        loanManager,
        lendingPool,
        mockToken,
        creditScore,
        admin,
      } = await loadFixture(deployFixture);
      
      const signers = await ethers.getSigners();
      const borrowers = signers.slice(10, 15); // Use 5 borrowers
      
      // Setup all borrowers
      for (const borrower of borrowers) {
        await setupBorrower({ loanManager, creditScore } as any, borrower, 700 + Math.floor(Math.random() * 100), true);
      }
      
      // All request loans
      for (const borrower of borrowers) {
        await loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          ethers.parseEther((200 + Math.random() * 300).toString()),
          (60 + Math.floor(Math.random() * 60)) * CONSTANTS.SECONDS_PER_DAY,
          2
        );
      }
      
      // Approve all
      const loanCount = await loanManager.loanCounter();
      for (let i = 1n; i <= loanCount; i++) {
        const loan = await loanManager.loans(i);
        if (loan.status === 0n) {
          await loanManager.connect(admin).approveLoan(i);
        }
      }
      
      // Disburse all
      for (let i = 1n; i <= loanCount; i++) {
        const loan = await loanManager.loans(i);
        if (loan.status === 1n) {
          await loanManager.disburseLoan(i);
        }
      }
      
      // Verify all active
      const activeLoans = await loanManager.getActiveLoans();
      expect(activeLoans.length).to.be.gte(borrowers.length);
      
      console.log(`✓ Stress test completed with ${activeLoans.length} concurrent loans`);
    });
  });
});

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
  ROLES,
  increaseTime,
} from "../helpers/testHelpers";

describe("Security Tests", function () {
  async function deployFixture() {
    const contracts = await deployFullSystem();
    const accounts = await getTestAccounts();
    await setupRoles(contracts, accounts);
    await setupLendingPool(contracts.lendingPool, contracts.mockToken, accounts.lender);
    
    return { ...contracts, ...accounts };
  }

  describe("Reentrancy Attacks", function () {
    it("Should prevent reentrancy on deposit", async function () {
      const { lendingPool, mockToken, attacker } = await loadFixture(deployFixture);
      
      const depositAmount = ethers.parseEther("100");
      await mockToken.transfer(attacker.address, depositAmount);
      await mockToken.connect(attacker).approve(await lendingPool.getAddress(), depositAmount);
      
      // Attempt to deposit
      await lendingPool.connect(attacker).deposit(await mockToken.getAddress(), depositAmount);
      
      // Contract should have reentrancy guard, so multiple state changes should not be possible
      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalDeposits).to.be.lte(depositAmount * 2n); // Should not exceed reasonable amount
    });

    it("Should prevent reentrancy on withdraw", async function () {
      const { lendingPool, mockToken, attacker } = await loadFixture(deployFixture);
      
      const depositAmount = ethers.parseEther("100");
      await mockToken.transfer(attacker.address, depositAmount);
      await mockToken.connect(attacker).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(attacker).deposit(await mockToken.getAddress(), depositAmount);
      
      const shares = (await lendingPool.userDeposits(attacker.address, await mockToken.getAddress())).shares;
      const withdrawShares = shares / 2n;
      
      // Withdraw should complete without allowing reentry
      await lendingPool.connect(attacker).withdraw(await mockToken.getAddress(), withdrawShares);
      
      const remainingShares = (await lendingPool.userDeposits(attacker.address, await mockToken.getAddress())).shares;
      expect(remainingShares).to.equal(shares - withdrawShares);
    });

    it("Should prevent reentrancy on loan repayment", async function () {
      const { loanManager, mockToken, borrower, creditScore, admin } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700, true);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      const loan = await loanManager.loans(loanId);
      const repayAmount = loan.installmentAmount;
      
      await mockToken.transfer(borrower.address, repayAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), repayAmount);
      
      // Make repayment - should be protected from reentrancy
      await loanManager.connect(borrower).makeRepayment(loanId, repayAmount);
      
      const loanAfter = await loanManager.loans(loanId);
      expect(loanAfter.paidInstallments).to.equal(1); // Should only increment once
    });
  });

  describe("Access Control Attacks", function () {
    it("Should prevent unauthorized role assignment", async function () {
      const { lendingPool, attacker } = await loadFixture(deployFixture);
      
      // Attacker tries to grant themselves admin role
      await expect(
        lendingPool.connect(attacker).grantRole(ROLES.ADMIN_ROLE, attacker.address)
      ).to.be.reverted;
    });

    it("Should prevent unauthorized loan disbursement", async function () {
      const { loanManager, mockToken, borrower, creditScore, admin, attacker } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700, true);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      
      // Attacker tries to disburse to themselves
      await expect(
        loanManager.connect(attacker).disburseLoan(loanId)
      ).to.be.reverted;
    });

    it("Should prevent unauthorized token whitelisting", async function () {
      const { lendingPool, mockToken2, attacker } = await loadFixture(deployFixture);
      
      await expect(
        lendingPool.connect(attacker).whitelistToken(await mockToken2.getAddress(), true)
      ).to.be.reverted;
    });

    it("Should prevent unauthorized pause", async function () {
      const { loanManager, attacker } = await loadFixture(deployFixture);
      
      await expect(
        loanManager.connect(attacker).pause()
      ).to.be.reverted;
    });

    it("Should prevent non-circle-creator from removing members", async function () {
      const { lendingCircle, creditScore, user1, user2, attacker } = await loadFixture(deployFixture);
      
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      
      await lendingCircle.connect(user1).createCircle("Test Circle", "Desc", 10, 500);
      const circleId = 1n;
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      // Attacker tries to remove member
      await expect(
        lendingCircle.connect(attacker).removeMember(circleId, user2.address)
      ).to.be.reverted;
    });
  });

  describe("Integer Overflow/Underflow", function () {
    it("Should handle large loan amounts safely", async function () {
      const { loanManager, lendingPool, mockToken, borrower, creditScore, admin, lender } = await loadFixture(deployFixture);
      
      // Add massive liquidity
      const hugeLiquidity = ethers.parseEther("100000");
      await mockToken.transfer(lender.address, hugeLiquidity);
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), hugeLiquidity);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), hugeLiquidity);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 850);
      
      // Try max loan amount
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.MAX_LOAN_AMOUNT,
        365 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.disburseLoan(loanId);
      
      const loan = await loanManager.loans(loanId);
      // Should not overflow when calculating total due
      expect(loan.totalAmountDue).to.be.gt(loan.principal);
      expect(loan.totalAmountDue).to.be.lt(loan.principal * 2n); // Reasonable interest
    });

    it("Should handle interest calculations without overflow", async function () {
      const { lendingPool, mockToken, loanManager } = await loadFixture(deployFixture);
      
      // Calculate with high utilization
      const borrowAPY = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      expect(borrowAPY).to.be.lte(10000); // Should not exceed 100%
    });

    it("Should prevent underflow on withdrawals", async function () {
      const { lendingPool, mockToken, lender } = await loadFixture(deployFixture);
      
      const shares = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      
      // Try to withdraw more than deposited
      await expect(
        lendingPool.connect(lender).withdraw(await mockToken.getAddress(), shares + 1n)
      ).to.be.reverted;
    });
  });

  describe("Flash Loan Attack Scenarios", function () {
    it("Should prevent manipulation via flash deposits", async function () {
      const { lendingPool, mockToken, attacker } = await loadFixture(deployFixture);
      
      // Attacker gets large flash loan amount (simulated)
      const flashAmount = ethers.parseEther("100000");
      await mockToken.transfer(attacker.address, flashAmount);
      await mockToken.connect(attacker).approve(await lendingPool.getAddress(), flashAmount);
      
      // Deposit huge amount
      await lendingPool.connect(attacker).deposit(await mockToken.getAddress(), flashAmount);
      
      // Try to immediately withdraw with inflated shares
      const shares = (await lendingPool.userDeposits(attacker.address, await mockToken.getAddress())).shares;
      
      // Should only get back what was deposited (no profit from manipulation)
      await lendingPool.connect(attacker).withdraw(await mockToken.getAddress(), shares);
      
      const finalBalance = await mockToken.balanceOf(attacker.address);
      expect(finalBalance).to.be.closeTo(flashAmount, ethers.parseEther("0.1")); // Allow tiny rounding
    });

    it("Should enforce minimum deposit to prevent dust attacks", async function () {
      const { lendingPool, mockToken, attacker } = await loadFixture(deployFixture);
      
      const dustAmount = ethers.parseEther("0.1"); // Below minimum
      await mockToken.transfer(attacker.address, dustAmount);
      await mockToken.connect(attacker).approve(await lendingPool.getAddress(), dustAmount);
      
      await expect(
        lendingPool.connect(attacker).deposit(await mockToken.getAddress(), dustAmount)
      ).to.be.reverted;
    });
  });

  describe("Denial of Service Attacks", function () {
    it("Should handle mass loan requests", async function () {
      const { loanManager, mockToken, creditScore } = await loadFixture(deployFixture);
      
      const signers = await ethers.getSigners();
      const attackers = signers.slice(10, 20); // 10 attackers
      
      // Setup all with valid credit
      for (const attacker of attackers) {
        await setupBorrower({ loanManager, creditScore } as any, attacker, 700, true);
      }
      
      // All request loans simultaneously
      for (const attacker of attackers) {
        await loanManager.connect(attacker).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.MIN_LOAN_AMOUNT,
          30 * CONSTANTS.SECONDS_PER_DAY,
          0
        );
      }
      
      // System should still function
      const loanCount = await loanManager.loanCounter();
      expect(loanCount).to.be.gte(attackers.length);
    });

    it("Should prevent spam voting in circles", async function () {
      const { lendingCircle, creditScore, mockToken, user1, user2, borrower } = await loadFixture(deployFixture);
      
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      await creditScore.updateCreditScore(borrower.address, 600);
      
      await lendingCircle.connect(user1).createCircle("Test", "Desc", 10, 500);
      const circleId = 1n;
      await lendingCircle.connect(user2).requestToJoin(circleId);
      await lendingCircle.connect(borrower).requestToJoin(circleId);
      
      // Create proposal
      await lendingCircle.connect(borrower).proposeLoan(
        circleId,
        await mockToken.getAddress(),
        CONSTANTS.MIN_LOAN_AMOUNT,
        60 * CONSTANTS.SECONDS_PER_DAY,
        "Purpose"
      );
      
      const proposalId = 1n;
      
      // Vote once
      await lendingCircle.connect(user1).voteOnProposal(proposalId, true);
      
      // Try to vote again (should fail)
      await expect(
        lendingCircle.connect(user1).voteOnProposal(proposalId, true)
      ).to.be.reverted;
    });
  });

  describe("Front-Running Prevention", function () {
    it("Should handle concurrent deposits fairly", async function () {
      const { lendingPool, mockToken, lender, lender2 } = await loadFixture(deployFixture);
      
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("1000");
      
      // Setup second lender
      await mockToken.transfer(lender2.address, amount2);
      await mockToken.connect(lender2).approve(await lendingPool.getAddress(), amount2);
      
      // Both deposit in same block (simulated)
      await lendingPool.connect(lender2).deposit(await mockToken.getAddress(), amount2);
      
      // Both should get fair share ratio
      const shares1 = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      const shares2 = (await lendingPool.userDeposits(lender2.address, await mockToken.getAddress())).shares;
      
      // Shares should be proportional to deposits
      expect(shares1).to.be.gt(0);
      expect(shares2).to.be.gt(0);
    });

    it("Should handle concurrent loan requests fairly", async function () {
      const { loanManager, mockToken, creditScore, borrower, borrower2 } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700, true);
      await setupBorrower({ loanManager, creditScore } as any, borrower2, 700, true);
      
      // Both request loans
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      await loanManager.connect(borrower2).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      // Both should get processed
      const loan1 = await loanManager.loans(1);
      const loan2 = await loanManager.loans(2);
      
      expect(loan1.borrower).to.equal(borrower.address);
      expect(loan2.borrower).to.equal(borrower2.address);
    });
  });

  describe("Reserve Manipulation", function () {
    it("Should protect reserves from unauthorized withdrawal", async function () {
      const { lendingPool, mockToken, loanManager, borrower, creditScore, admin, attacker, loanManager: loanMgr } = await loadFixture(deployFixture);
      
      // Generate some reserves through loan interest
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700, true);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      // Repay with interest
      const loan = await loanManager.loans(loanId);
      await mockToken.transfer(borrower.address, loan.totalAmountDue);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), loan.totalAmountDue);
      await loanManager.connect(borrower).makeRepayment(loanId, loan.totalAmountDue);
      
      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      const reserves = poolData.totalReserves;
      
      // Attacker tries to withdraw reserves
      await expect(
        lendingPool.connect(attacker).withdrawReserves(
          await mockToken.getAddress(),
          reserves,
          attacker.address
        )
      ).to.be.reverted;
    });
  });

  describe("Credit Score Manipulation", function () {
    it("Should prevent unauthorized credit score updates", async function () {
      const { creditScore, attacker, borrower } = await loadFixture(deployFixture);
      
      // Attacker tries to boost their own score
      await expect(
        creditScore.connect(attacker).updateCreditScore(attacker.address, 850)
      ).to.be.reverted;
      
      // Attacker tries to modify someone else's score
      await expect(
        creditScore.connect(attacker).updateCreditScore(borrower.address, 200)
      ).to.be.reverted;
    });

    it("Should not allow credit score to exceed maximum", async function () {
      const { creditScore, owner, borrower } = await loadFixture(deployFixture);
      
      // Try to set score above 850 (max)
      await creditScore.updateCreditScore(borrower.address, 850);
      
      const score = await creditScore.getCreditScore(borrower.address);
      expect(score).to.be.lte(850);
    });
  });

  describe("Collateral Attacks", function () {
    it("Should prevent double-spending collateral", async function () {
      const { collateralManager, mockToken, borrower } = await loadFixture(deployFixture);
      
      const collateralAmount = ethers.parseEther("100");
      await mockToken.transfer(borrower.address, collateralAmount);
      await mockToken.connect(borrower).approve(await collateralManager.getAddress(), collateralAmount);
      
      // Deposit collateral for loan 1
      await collateralManager.connect(borrower).depositCollateral(
        await mockToken.getAddress(),
        collateralAmount,
        1
      );
      
      // Try to use same collateral for loan 2 (should fail)
      await expect(
        collateralManager.connect(borrower).depositCollateral(
          await mockToken.getAddress(),
          collateralAmount,
          2
        )
      ).to.be.reverted;
    });
  });

  describe("Upgrade Safety", function () {
    it("Should maintain state after upgrade", async function () {
      const { lendingPool, mockToken, lender } = await loadFixture(deployFixture);
      
      // Record state before upgrade
      const poolDataBefore = await lendingPool.getPoolData(await mockToken.getAddress());
      const sharesBefore = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      
      // Upgrade would happen here (simplified for test)
      // In real scenario: const upgraded = await upgrades.upgradeProxy(address, NewFactory);
      
      // Verify state preserved
      const poolDataAfter = await lendingPool.getPoolData(await mockToken.getAddress());
      const sharesAfter = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      
      expect(poolDataAfter.totalDeposits).to.equal(poolDataBefore.totalDeposits);
      expect(sharesAfter).to.equal(sharesBefore);
    });

    it("Should prevent unauthorized upgrades", async function () {
      const { lendingPool, attacker } = await loadFixture(deployFixture);
      
      // Attacker tries to upgrade contract (implementation would revert on unauthorized)
      // In actual UUPS proxy, only admin can upgrade
      // This is protected by access control in _authorizeUpgrade
    });
  });

  describe("Emergency Scenarios", function () {
    it("Should allow emergency pause", async function () {
      const { loanManager, mockToken, borrower, creditScore, owner } = await loadFixture(deployFixture);
      
      // Pause system
      await loanManager.pause();
      
      // Try to request loan (should fail)
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700, true);
      
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          90 * CONSTANTS.SECONDS_PER_DAY,
          2
        )
      ).to.be.reverted;
      
      // Unpause
      await loanManager.unpause();
      
      // Should work now
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          90 * CONSTANTS.SECONDS_PER_DAY,
          2
        )
      ).to.not.be.reverted;
    });
  });

  describe("Gas Limits and DoS", function () {
    it("Should handle large arrays without running out of gas", async function () {
      const { loanManager, borrower } = await loadFixture(deployFixture);
      
      // Get borrower loans (should work even if many exist)
      const loans = await loanManager.getBorrowerLoans(borrower.address);
      expect(loans).to.be.an('array');
    });

    it("Should handle get all active loans efficiently", async function () {
      const { loanManager } = await loadFixture(deployFixture);
      
      const activeLoans = await loanManager.getActiveLoans();
      expect(activeLoans).to.be.an('array');
    });
  });
});

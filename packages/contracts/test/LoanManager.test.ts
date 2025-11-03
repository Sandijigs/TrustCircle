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
  getCurrentTime,
  calculateSimpleInterest,
} from "./helpers/testHelpers";

describe("LoanManager", function () {
  async function deployFixture() {
    const contracts = await deployFullSystem();
    const accounts = await getTestAccounts();
    await setupRoles(contracts, accounts);
    await setupLendingPool(contracts.lendingPool, contracts.mockToken, accounts.lender);
    
    return { ...contracts, ...accounts };
  }

  describe("Loan Request", function () {
    it("Should allow borrower to request loan", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      // Setup borrower
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700, true);
      
      const amount = CONSTANTS.TYPICAL_LOAN_AMOUNT;
      const duration = 90 * CONSTANTS.SECONDS_PER_DAY;
      
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          amount,
          duration,
          2 // Monthly payments
        )
      ).to.emit(loanManager, "LoanRequested");
      
      const loanId = await loanManager.loanCounter();
      const loan = await loanManager.loans(loanId);
      
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.principal).to.equal(amount);
    });

    it("Should reject loan below minimum amount", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      
      const tooSmall = ethers.parseEther("25"); // Below $50 minimum
      
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          tooSmall,
          90 * CONSTANTS.SECONDS_PER_DAY,
          2
        )
      ).to.be.reverted;
    });

    it("Should reject loan above maximum amount", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      
      const tooLarge = ethers.parseEther("6000"); // Above $5000 maximum
      
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          tooLarge,
          90 * CONSTANTS.SECONDS_PER_DAY,
          2
        )
      ).to.be.reverted;
    });

    it("Should reject loan with invalid duration", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      
      // Duration too short
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          15 * CONSTANTS.SECONDS_PER_DAY, // Less than 30 days
          2
        )
      ).to.be.reverted;
      
      // Duration too long
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          400 * CONSTANTS.SECONDS_PER_DAY, // More than 365 days
          2
        )
      ).to.be.reverted;
    });

    it("Should reject borrower with low credit score", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 250); // Below 300 minimum
      
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          90 * CONSTANTS.SECONDS_PER_DAY,
          2
        )
      ).to.be.reverted;
    });

    it("Should auto-approve high credit score borrowers", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 850); // Above 800
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      const loan = await loanManager.loans(loanId);
      
      expect(loan.status).to.equal(1); // Approved
    });

    it("Should require manual approval for medium credit scores", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 650);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      const loan = await loanManager.loans(loanId);
      
      expect(loan.status).to.equal(0); // Pending
    });
  });

  describe("Loan Approval", function () {
    async function pendingLoanFixture() {
      const fixture = await deployFixture();
      const { loanManager, mockToken, borrower, creditScore } = fixture;
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 650);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      return { ...fixture, loanId };
    }

    it("Should allow approver to approve loan", async function () {
      const { loanManager, admin, loanId } = await loadFixture(pendingLoanFixture);
      
      await expect(
        loanManager.connect(admin).approveLoan(loanId)
      ).to.emit(loanManager, "LoanApproved");
      
      const loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(1); // Approved
    });

    it("Should not allow non-approver to approve", async function () {
      const { loanManager, borrower2, loanId } = await loadFixture(pendingLoanFixture);
      
      await expect(
        loanManager.connect(borrower2).approveLoan(loanId)
      ).to.be.reverted;
    });

    it("Should allow approver to reject loan", async function () {
      const { loanManager, admin, loanId } = await loadFixture(pendingLoanFixture);
      
      await expect(
        loanManager.connect(admin).rejectLoan(loanId)
      ).to.emit(loanManager, "LoanRejected");
      
      const loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(5); // Cancelled
    });
  });

  describe("Loan Disbursement", function () {
    async function approvedLoanFixture() {
      const fixture = await deployFixture();
      const { loanManager, mockToken, borrower, creditScore, admin } = fixture;
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 650);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      
      return { ...fixture, loanId };
    }

    it("Should disburse approved loan", async function () {
      const { loanManager, borrower, loanId, mockToken } = await loadFixture(approvedLoanFixture);
      
      const balanceBefore = await mockToken.balanceOf(borrower.address);
      
      await expect(
        loanManager.disburseLoan(loanId)
      ).to.emit(loanManager, "LoanDisbursed");
      
      const balanceAfter = await mockToken.balanceOf(borrower.address);
      expect(balanceAfter - balanceBefore).to.equal(CONSTANTS.TYPICAL_LOAN_AMOUNT);
      
      const loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(2); // Active
    });

    it("Should not disburse pending loan", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 650);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      
      await expect(
        loanManager.disburseLoan(loanId)
      ).to.be.reverted;
    });

    it("Should not disburse same loan twice", async function () {
      const { loanManager, loanId } = await loadFixture(approvedLoanFixture);
      
      await loanManager.disburseLoan(loanId);
      
      await expect(
        loanManager.disburseLoan(loanId)
      ).to.be.reverted;
    });
  });

  describe("Loan Repayment", function () {
    async function activeLoanFixture() {
      const fixture = await deployFixture();
      const { loanManager, mockToken, borrower, creditScore, admin } = fixture;
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 650);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2 // Monthly
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      return { ...fixture, loanId };
    }

    it("Should accept repayment", async function () {
      const { loanManager, mockToken, borrower, loanId } = await loadFixture(activeLoanFixture);
      
      const loan = await loanManager.loans(loanId);
      const repaymentAmount = loan.installmentAmount;
      
      // Give borrower tokens for repayment
      await mockToken.transfer(borrower.address, repaymentAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), repaymentAmount);
      
      await expect(
        loanManager.connect(borrower).makeRepayment(loanId, repaymentAmount)
      ).to.emit(loanManager, "RepaymentMade");
      
      const loanAfter = await loanManager.loans(loanId);
      expect(loanAfter.paidInstallments).to.equal(1);
    });

    it("Should track total repaid amount", async function () {
      const { loanManager, mockToken, borrower, loanId } = await loadFixture(activeLoanFixture);
      
      const loan = await loanManager.loans(loanId);
      const repaymentAmount = loan.installmentAmount;
      
      await mockToken.transfer(borrower.address, repaymentAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), repaymentAmount);
      
      await loanManager.connect(borrower).makeRepayment(loanId, repaymentAmount);
      
      const loanAfter = await loanManager.loans(loanId);
      expect(loanAfter.amountPaid).to.be.gt(0);
    });

    it("Should complete loan when fully repaid", async function () {
      const { loanManager, mockToken, borrower, loanId } = await loadFixture(activeLoanFixture);
      
      const loan = await loanManager.loans(loanId);
      const totalAmount = loan.totalAmountDue;
      
      // Give borrower enough tokens
      await mockToken.transfer(borrower.address, totalAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), totalAmount);
      
      // Make full repayment
      await loanManager.connect(borrower).makeRepayment(loanId, totalAmount);
      
      const loanAfter = await loanManager.loans(loanId);
      expect(loanAfter.status).to.equal(3); // Completed
    });

    it("Should not allow repayment of non-active loan", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 850);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      const repayAmount = ethers.parseEther("100");
      
      await mockToken.transfer(borrower.address, repayAmount);
      await mockToken.connect(borrower).approve(await loanManager.getAddress(), repayAmount);
      
      // Loan is approved but not disbursed yet
      await expect(
        loanManager.connect(borrower).makeRepayment(loanId, repayAmount)
      ).to.be.reverted;
    });
  });

  describe("Late Payments and Default", function () {
    async function activeLoanFixture() {
      const fixture = await deployFixture();
      const { loanManager, mockToken, borrower, creditScore, admin } = fixture;
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 650);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      return { ...fixture, loanId };
    }

    it("Should calculate late payment penalty", async function () {
      const { loanManager, loanId } = await loadFixture(activeLoanFixture);
      
      // Fast forward past first payment deadline + grace period
      await increaseTime(35 * CONSTANTS.SECONDS_PER_DAY);
      
      const penalty = await loanManager.calculateLatePenalty(loanId);
      expect(penalty).to.be.gt(0);
    });

    it("Should mark loan as defaulted after threshold", async function () {
      const { loanManager, loanId } = await loadFixture(activeLoanFixture);
      
      // Fast forward past default threshold (30 days late)
      await increaseTime(65 * CONSTANTS.SECONDS_PER_DAY);
      
      await loanManager.markAsDefaulted(loanId);
      
      const loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(4); // Defaulted
    });

    it("Should not mark as defaulted if within grace period", async function () {
      const { loanManager, loanId } = await loadFixture(activeLoanFixture);
      
      // Fast forward but stay within grace period
      await increaseTime(32 * CONSTANTS.SECONDS_PER_DAY);
      
      await expect(
        loanManager.markAsDefaulted(loanId)
      ).to.be.reverted;
    });

    it("Should update credit score on default", async function () {
      const { loanManager, creditScore, borrower, loanId } = await loadFixture(activeLoanFixture);
      
      const scoreBefore = await creditScore.getCreditScore(borrower.address);
      
      // Fast forward and default
      await increaseTime(65 * CONSTANTS.SECONDS_PER_DAY);
      await loanManager.markAsDefaulted(loanId);
      
      const scoreAfter = await creditScore.getCreditScore(borrower.address);
      expect(scoreAfter).to.be.lt(scoreBefore);
    });
  });

  describe("Interest Calculation", function () {
    it("Should calculate correct interest based on credit score", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      // High credit score = lower interest
      await setupBorrower({ loanManager, creditScore } as any, borrower, 850);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      const loan = await loanManager.loans(loanId);
      
      // Interest rate should be lower for high credit score
      expect(loan.interestRate).to.be.lte(1500); // <= 15%
    });

    it("Should calculate installment amounts correctly", async function () {
      const { loanManager, mockToken, borrower, creditScore, admin } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      
      const principal = ethers.parseEther("1000");
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        principal,
        90 * CONSTANTS.SECONDS_PER_DAY,
        2 // Monthly - 3 installments
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      
      const loan = await loanManager.loans(loanId);
      
      // Total amount due should be principal + interest
      expect(loan.totalAmountDue).to.be.gt(principal);
      
      // Installments should be roughly equal
      const expectedInstallments = 3n;
      expect(loan.numInstallments).to.equal(expectedInstallments);
    });
  });

  describe("Loan Queries", function () {
    async function multiLoanFixture() {
      const fixture = await deployFixture();
      const { loanManager, mockToken, borrower, borrower2, creditScore, admin } = fixture;
      
      // Setup borrowers
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      await setupBorrower({ loanManager, creditScore } as any, borrower2, 750);
      
      // Create multiple loans
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("500"),
        90 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      await loanManager.connect(borrower2).requestLoan(
        await mockToken.getAddress(),
        ethers.parseEther("800"),
        120 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      return fixture;
    }

    it("Should return borrower loans", async function () {
      const { loanManager, borrower } = await loadFixture(multiLoanFixture);
      
      const loans = await loanManager.getBorrowerLoans(borrower.address);
      expect(loans.length).to.be.gte(1);
    });

    it("Should return active loans", async function () {
      const { loanManager, mockToken, borrower, admin } = await loadFixture(multiLoanFixture);
      
      // Approve and disburse first loan
      await loanManager.connect(admin).approveLoan(1);
      await loanManager.disburseLoan(1);
      
      const activeLoans = await loanManager.getActiveLoans();
      expect(activeLoans.length).to.be.gte(1);
    });

    it("Should return loan details", async function () {
      const { loanManager } = await loadFixture(multiLoanFixture);
      
      const loan = await loanManager.loans(1);
      expect(loan.principal).to.be.gt(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to pause contract", async function () {
      const { loanManager } = await loadFixture(deployFixture);
      
      await loanManager.pause();
      expect(await loanManager.paused()).to.be.true;
    });

    it("Should prevent loan requests when paused", async function () {
      const { loanManager, mockToken, borrower, creditScore } = await loadFixture(deployFixture);
      
      await loanManager.pause();
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      
      await expect(
        loanManager.connect(borrower).requestLoan(
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          90 * CONSTANTS.SECONDS_PER_DAY,
          2
        )
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle minimum loan amount", async function () {
      const { loanManager, mockToken, borrower, creditScore, admin } = await loadFixture(deployFixture);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 700);
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.MIN_LOAN_AMOUNT,
        30 * CONSTANTS.SECONDS_PER_DAY,
        0 // Weekly
      );
      
      const loanId = await loanManager.loanCounter();
      await loanManager.connect(admin).approveLoan(loanId);
      await loanManager.disburseLoan(loanId);
      
      const loan = await loanManager.loans(loanId);
      expect(loan.status).to.equal(2); // Active
    });

    it("Should handle maximum loan amount", async function () {
      const { loanManager, lendingPool, mockToken, borrower, creditScore, admin, lender } = await loadFixture(deployFixture);
      
      // Add more liquidity
      const extraLiquidity = ethers.parseEther("10000");
      await mockToken.transfer(lender.address, extraLiquidity);
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), extraLiquidity);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), extraLiquidity);
      
      await setupBorrower({ loanManager, creditScore } as any, borrower, 850); // High score for max loan
      
      await loanManager.connect(borrower).requestLoan(
        await mockToken.getAddress(),
        CONSTANTS.MAX_LOAN_AMOUNT,
        365 * CONSTANTS.SECONDS_PER_DAY,
        2
      );
      
      const loanId = await loanManager.loanCounter();
      const loan = await loanManager.loans(loanId);
      expect(loan.principal).to.equal(CONSTANTS.MAX_LOAN_AMOUNT);
    });
  });
});

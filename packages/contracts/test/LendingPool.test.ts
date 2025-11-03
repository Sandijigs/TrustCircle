import { expect } from "chai";
import hre from "hardhat";
const { ethers, upgrades } = hre;
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { LendingPool } from "../typechain-types";

describe("LendingPool", function () {
  let lendingPool: LendingPool;
  let owner: HardhatEthersSigner;
  let lender: HardhatEthersSigner;
  let lender2: HardhatEthersSigner;
  let borrower: HardhatEthersSigner;
  let loanManager: HardhatEthersSigner;
  let mockToken: any;
  let mockToken2: any;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const DEPOSIT_AMOUNT = ethers.parseEther("1000");
  const LOAN_AMOUNT = ethers.parseEther("500");

  beforeEach(async function () {
    [owner, lender, lender2, borrower, loanManager] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock USD", "mUSD", INITIAL_SUPPLY);
    await mockToken.waitForDeployment();
    
    mockToken2 = await MockERC20.deploy("Mock EUR", "mEUR", INITIAL_SUPPLY);
    await mockToken2.waitForDeployment();

    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await upgrades.deployProxy(
      LendingPool,
      [owner.address],
      { kind: "uups" }
    ) as unknown as LendingPool;
    await lendingPool.waitForDeployment();

    // Whitelist and create pool
    await lendingPool.whitelistToken(await mockToken.getAddress(), true);
    await lendingPool.createPool(await mockToken.getAddress());

    // Grant LOAN_MANAGER_ROLE
    const LOAN_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LOAN_MANAGER_ROLE"));
    await lendingPool.grantRole(LOAN_MANAGER_ROLE, loanManager.address);

    // Transfer tokens to lenders
    await mockToken.transfer(lender.address, DEPOSIT_AMOUNT);
    await mockToken.transfer(lender2.address, DEPOSIT_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
      expect(await lendingPool.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should create pool with correct asset", async function () {
      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.asset).to.equal(await mockToken.getAddress());
      expect(poolData.isActive).to.be.true;
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);

      await expect(
        lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT)
      ).to.emit(lendingPool, "Deposited");

      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalDeposits).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should mint LP shares on deposit", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      const userDeposit = await lendingPool.userDeposits(lender.address, await mockToken.getAddress());
      expect(userDeposit.shares).to.equal(DEPOSIT_AMOUNT); // 1:1 for first deposit
    });

    it("Should reject deposits below minimum", async function () {
      const tinyAmount = ethers.parseEther("0.5");
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), tinyAmount);

      await expect(
        lendingPool.connect(lender).deposit(await mockToken.getAddress(), tinyAmount)
      ).to.be.reverted;
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should allow withdrawals", async function () {
      const shares = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      // Withdraw 80% to account for 10% reserve factor
      const withdrawShares = shares * 80n / 100n;

      await expect(
        lendingPool.connect(lender).withdraw(await mockToken.getAddress(), withdrawShares)
      ).to.emit(lendingPool, "Withdrawn");
    });

    it("Should burn LP shares on withdrawal", async function () {
      const shares = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      // Withdraw 80% to account for 10% reserve factor
      const withdrawShares = shares * 80n / 100n;
      
      await lendingPool.connect(lender).withdraw(await mockToken.getAddress(), withdrawShares);

      const userDeposit = await lendingPool.userDeposits(lender.address, await mockToken.getAddress());
      const remainingShares = shares - withdrawShares;
      expect(userDeposit.shares).to.equal(remainingShares);
    });
  });

  describe("Interest Rates", function () {
    it("Should calculate base rate with 0% utilization", async function () {
      const rate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      expect(rate).to.equal(500); // 5% base rate
    });

    it("Should calculate lender APY", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      const lenderAPY = await lendingPool.calculateLenderAPY(await mockToken.getAddress());
      expect(lenderAPY).to.equal(0); // 0% with no borrows
    });
  });

  describe("Utilization", function () {
    it("Should calculate 0% utilization with no borrows", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      const utilization = await lendingPool.getUtilizationRate(await mockToken.getAddress());
      expect(utilization).to.equal(0);
    });
  });

  describe("Token Whitelist", function () {
    it("Should allow admin to whitelist tokens", async function () {
      await lendingPool.whitelistToken(await mockToken2.getAddress(), true);
      expect(await lendingPool.isWhitelisted(await mockToken2.getAddress())).to.be.true;
    });

    it("Should prevent creating pool for non-whitelisted token", async function () {
      await expect(
        lendingPool.createPool(await mockToken2.getAddress())
      ).to.be.reverted;
    });

    it("Should allow creating pool after whitelisting", async function () {
      await lendingPool.whitelistToken(await mockToken2.getAddress(), true);
      await lendingPool.createPool(await mockToken2.getAddress());
      
      const poolData = await lendingPool.getPoolData(await mockToken2.getAddress());
      expect(poolData.isActive).to.be.true;
    });

    it("Should emit TokenWhitelisted event", async function () {
      await expect(
        lendingPool.whitelistToken(await mockToken2.getAddress(), true)
      ).to.emit(lendingPool, "TokenWhitelisted")
       .withArgs(await mockToken2.getAddress(), true);
    });
  });

  describe("Multi-Pool Operations", function () {
    beforeEach(async function () {
      await lendingPool.whitelistToken(await mockToken2.getAddress(), true);
      await lendingPool.createPool(await mockToken2.getAddress());
      await mockToken2.transfer(lender.address, DEPOSIT_AMOUNT);
    });

    it("Should handle deposits to multiple pools", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await mockToken2.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);

      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken2.getAddress(), DEPOSIT_AMOUNT);

      const pool1 = await lendingPool.getPoolData(await mockToken.getAddress());
      const pool2 = await lendingPool.getPoolData(await mockToken2.getAddress());

      expect(pool1.totalDeposits).to.equal(DEPOSIT_AMOUNT);
      expect(pool2.totalDeposits).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should track shares separately per pool", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await mockToken2.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);

      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken2.getAddress(), DEPOSIT_AMOUNT);

      const shares1 = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      const shares2 = (await lendingPool.userDeposits(lender.address, await mockToken2.getAddress())).shares;

      expect(shares1).to.equal(DEPOSIT_AMOUNT);
      expect(shares2).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Loan Operations", function () {
    beforeEach(async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should allow loan manager to disburse loans", async function () {
      const loanId = 1;
      
      await expect(
        lendingPool.connect(loanManager).disburseLoan(
          await mockToken.getAddress(),
          borrower.address,
          LOAN_AMOUNT,
          loanId
        )
      ).to.emit(lendingPool, "LoanDisbursed");

      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalBorrowed).to.equal(LOAN_AMOUNT);
    });

    it("Should prevent non-loan-manager from disbursing", async function () {
      await expect(
        lendingPool.connect(borrower).disburseLoan(
          await mockToken.getAddress(),
          borrower.address,
          LOAN_AMOUNT,
          1
        )
      ).to.be.reverted;
    });

    it("Should handle loan repayment", async function () {
      const loanId = 1;
      const interest = ethers.parseEther("50");

      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        loanId
      );

      // Borrower approves and repays
      await mockToken.connect(borrower).approve(await lendingPool.getAddress(), LOAN_AMOUNT + interest);
      await lendingPool.connect(loanManager).repayLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        interest
      );

      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalBorrowed).to.equal(0);
      expect(poolData.accumulatedInterest).to.be.gt(0);
    });

    it("Should calculate utilization after loan", async function () {
      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        1
      );

      const utilization = await lendingPool.getUtilizationRate(await mockToken.getAddress());
      expect(utilization).to.equal(5000); // 50% (500/1000)
    });

    it("Should increase interest rate with higher utilization", async function () {
      const rateAt0 = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());

      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        1
      );

      const rateAt50 = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      expect(rateAt50).to.be.gt(rateAt0);
    });

    it("Should prevent over-withdrawal with active loans", async function () {
      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        1
      );

      const shares = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;

      // Try to withdraw all shares (should fail due to insufficient liquidity + reserves)
      await expect(
        lendingPool.connect(lender).withdraw(await mockToken.getAddress(), shares)
      ).to.be.reverted;
    });
  });

  describe("Share-Based Accounting", function () {
    it("Should handle multiple depositors correctly", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await mockToken.connect(lender2).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);

      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender2).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      const shares1 = (await lendingPool.userDeposits(lender.address, await mockToken.getAddress())).shares;
      const shares2 = (await lendingPool.userDeposits(lender2.address, await mockToken.getAddress())).shares;

      expect(shares1).to.equal(shares2);
    });

    it("Should distribute value proportionally", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      await mockToken.connect(lender2).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender2).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      const value1 = await lendingPool.getUserShareValue(lender.address, await mockToken.getAddress());
      const value2 = await lendingPool.getUserShareValue(lender2.address, await mockToken.getAddress());

      expect(value1).to.be.closeTo(value2, ethers.parseEther("0.1"));
    });
  });

  describe("Reserve Management", function () {
    beforeEach(async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should accumulate reserves from interest", async function () {
      const interest = ethers.parseEther("100");

      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        1
      );

      await mockToken.connect(borrower).approve(await lendingPool.getAddress(), LOAN_AMOUNT + interest);
      await lendingPool.connect(loanManager).repayLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        interest
      );

      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      expect(poolData.totalReserves).to.be.gt(0);
    });

    it("Should allow admin to withdraw reserves", async function () {
      const interest = ethers.parseEther("100");

      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        1
      );

      await mockToken.connect(borrower).approve(await lendingPool.getAddress(), LOAN_AMOUNT + interest);
      await lendingPool.connect(loanManager).repayLoan(
        await mockToken.getAddress(),
        borrower.address,
        LOAN_AMOUNT,
        interest
      );

      const poolData = await lendingPool.getPoolData(await mockToken.getAddress());
      const reserves = poolData.totalReserves;

      await expect(
        lendingPool.withdrawReserves(
          await mockToken.getAddress(),
          reserves,
          owner.address
        )
      ).to.emit(lendingPool, "ReservesWithdrawn");
    });
  });

  describe("Interest Rate Curve", function () {
    beforeEach(async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);
    });

    it("Should have correct rate at 0% utilization", async function () {
      const rate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      expect(rate).to.equal(500); // 5%
    });

    it("Should have correct rate at 80% utilization", async function () {
      const borrowAmount = ethers.parseEther("800");
      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        borrowAmount,
        1
      );

      const rate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      expect(rate).to.equal(1500); // 15% at optimal utilization
    });

    it("Should have steep rate above 80% utilization", async function () {
      const borrowAmount = ethers.parseEther("900");
      await lendingPool.connect(loanManager).disburseLoan(
        await mockToken.getAddress(),
        borrower.address,
        borrowAmount,
        1
      );

      const rate = await lendingPool.calculateBorrowAPY(await mockToken.getAddress());
      expect(rate).to.be.gt(1500); // > 15%
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to pause", async function () {
      await lendingPool.pause();
      expect(await lendingPool.paused()).to.be.true;
    });

    it("Should prevent deposits when paused", async function () {
      await lendingPool.pause();

      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await expect(
        lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT)
      ).to.be.reverted;
    });

    it("Should allow operations after unpause", async function () {
      await lendingPool.pause();
      await lendingPool.unpause();

      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await expect(
        lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT)
      ).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return supported tokens", async function () {
      const tokens = await lendingPool.getSupportedTokens();
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal(await mockToken.getAddress());
    });

    it("Should return user share value", async function () {
      await mockToken.connect(lender).approve(await lendingPool.getAddress(), DEPOSIT_AMOUNT);
      await lendingPool.connect(lender).deposit(await mockToken.getAddress(), DEPOSIT_AMOUNT);

      const value = await lendingPool.getUserShareValue(lender.address, await mockToken.getAddress());
      expect(value).to.be.closeTo(DEPOSIT_AMOUNT, ethers.parseEther("0.1"));
    });
  });
});

// Mock ERC20 for testing
const MockERC20 = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
`;

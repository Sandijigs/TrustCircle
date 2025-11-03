import { expect } from "chai";
import hre from "hardhat";
const { ethers, upgrades } = hre;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFullSystem,
  getTestAccounts,
  setupRoles,
  setupBorrower,
  CONSTANTS,
  ROLES,
  increaseTime,
  getCurrentTime,
} from "./helpers/testHelpers";

describe("LendingCircle", function () {
  async function deployFixture() {
    const contracts = await deployFullSystem();
    const accounts = await getTestAccounts();
    await setupRoles(contracts, accounts);
    
    return { ...contracts, ...accounts };
  }

  describe("Circle Creation", function () {
    it("Should create a new circle", async function () {
      const { lendingCircle, user1 } = await loadFixture(deployFixture);
      
      const tx = await lendingCircle.connect(user1).createCircle(
        "Test Circle",
        "A test lending circle",
        10, // max members
        500 // min credit score
      );
      
      await expect(tx).to.emit(lendingCircle, "CircleCreated");
      
      const circleId = 1n;
      const circle = await lendingCircle.circles(circleId);
      
      expect(circle.name).to.equal("Test Circle");
      expect(circle.creator).to.equal(user1.address);
      expect(circle.maxMembers).to.equal(10);
    });

    it("Should fail with invalid parameters", async function () {
      const { lendingCircle, user1 } = await loadFixture(deployFixture);
      
      // Max members too low
      await expect(
        lendingCircle.connect(user1).createCircle("Test", "Desc", 3, 500)
      ).to.be.reverted;
      
      // Max members too high
      await expect(
        lendingCircle.connect(user1).createCircle("Test", "Desc", 25, 500)
      ).to.be.reverted;
    });

    it("Should automatically add creator as first member", async function () {
      const { lendingCircle, creditScore, user1 } = await loadFixture(deployFixture);
      
      // Set credit score for user1
      await creditScore.updateCreditScore(user1.address, 600);
      
      await lendingCircle.connect(user1).createCircle(
        "Test Circle",
        "Description",
        10,
        500
      );
      
      const circleId = 1n;
      const isMember = await lendingCircle.isCircleMember(circleId, user1.address);
      expect(isMember).to.be.true;
      
      const circle = await lendingCircle.circles(circleId);
      expect(circle.memberCount).to.equal(1);
    });
  });

  describe("Member Management", function () {
    async function createCircleFixture() {
      const fixture = await deployFixture();
      const { lendingCircle, creditScore, user1, user2 } = fixture;
      
      // Setup credit scores
      await creditScore.updateCreditScore(user1.address, 600);
      await creditScore.updateCreditScore(user2.address, 550);
      
      // Create circle
      await lendingCircle.connect(user1).createCircle(
        "Test Circle",
        "Description",
        10,
        500
      );
      
      return { ...fixture, circleId: 1n };
    }

    it("Should allow members to join circle", async function () {
      const { lendingCircle, user2, circleId } = await loadFixture(createCircleFixture);
      
      await expect(
        lendingCircle.connect(user2).requestToJoin(circleId)
      ).to.emit(lendingCircle, "MemberJoined");
      
      const isMember = await lendingCircle.isCircleMember(circleId, user2.address);
      expect(isMember).to.be.true;
    });

    it("Should reject members with low credit score", async function () {
      const { lendingCircle, creditScore, borrower, circleId } = await loadFixture(createCircleFixture);
      
      // Set low credit score
      await creditScore.updateCreditScore(borrower.address, 400);
      
      await expect(
        lendingCircle.connect(borrower).requestToJoin(circleId)
      ).to.be.reverted;
    });

    it("Should not allow duplicate members", async function () {
      const { lendingCircle, user2, circleId } = await loadFixture(createCircleFixture);
      
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      // Try to join again
      await expect(
        lendingCircle.connect(user2).requestToJoin(circleId)
      ).to.be.reverted;
    });

    it("Should not exceed max members", async function () {
      const { lendingCircle, creditScore, circleId } = await loadFixture(deployFixture);
      const signers = await ethers.getSigners();
      
      // Create circle with max 5 members
      await creditScore.updateCreditScore(signers[0].address, 600);
      await lendingCircle.createCircle("Small Circle", "Desc", 5, 500);
      const smallCircleId = 1n;
      
      // Add members up to limit
      for (let i = 1; i < 5; i++) {
        await creditScore.updateCreditScore(signers[i].address, 600);
        await lendingCircle.connect(signers[i]).requestToJoin(smallCircleId);
      }
      
      // Try to add one more
      await creditScore.updateCreditScore(signers[5].address, 600);
      await expect(
        lendingCircle.connect(signers[5]).requestToJoin(smallCircleId)
      ).to.be.reverted;
    });

    it("Should allow member removal by creator", async function () {
      const { lendingCircle, user1, user2, circleId } = await loadFixture(createCircleFixture);
      
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      await expect(
        lendingCircle.connect(user1).removeMember(circleId, user2.address)
      ).to.emit(lendingCircle, "MemberRemoved");
      
      const isMember = await lendingCircle.isCircleMember(circleId, user2.address);
      expect(isMember).to.be.false;
    });

    it("Should not allow non-creator to remove members", async function () {
      const { lendingCircle, user1, user2, circleId } = await loadFixture(createCircleFixture);
      
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      await expect(
        lendingCircle.connect(user2).removeMember(circleId, user1.address)
      ).to.be.reverted;
    });
  });

  describe("Loan Proposals", function () {
    async function circleWithMembersFixture() {
      const fixture = await deployFixture();
      const { lendingCircle, creditScore, user1, user2, borrower, mockToken } = fixture;
      
      // Setup credit scores
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      await creditScore.updateCreditScore(borrower.address, 600);
      
      // Create circle and add members
      await lendingCircle.connect(user1).createCircle("Test Circle", "Desc", 10, 500);
      const circleId = 1n;
      
      await lendingCircle.connect(user2).requestToJoin(circleId);
      await lendingCircle.connect(borrower).requestToJoin(circleId);
      
      return { ...fixture, circleId };
    }

    it("Should create loan proposal", async function () {
      const { lendingCircle, borrower, circleId, mockToken } = await loadFixture(circleWithMembersFixture);
      
      const loanAmount = CONSTANTS.TYPICAL_LOAN_AMOUNT;
      const duration = 90 * CONSTANTS.SECONDS_PER_DAY; // 90 days
      
      await expect(
        lendingCircle.connect(borrower).proposeLoan(
          circleId,
          await mockToken.getAddress(),
          loanAmount,
          duration,
          "Need funds for business"
        )
      ).to.emit(lendingCircle, "LoanProposed");
      
      const proposalId = 1n;
      const proposal = await lendingCircle.proposals(proposalId);
      
      expect(proposal.proposer).to.equal(borrower.address);
      expect(proposal.amount).to.equal(loanAmount);
    });

    it("Should only allow members to create proposals", async function () {
      const { lendingCircle, attacker, circleId, mockToken } = await loadFixture(circleWithMembersFixture);
      
      await expect(
        lendingCircle.connect(attacker).proposeLoan(
          circleId,
          await mockToken.getAddress(),
          CONSTANTS.TYPICAL_LOAN_AMOUNT,
          90 * CONSTANTS.SECONDS_PER_DAY,
          "Purpose"
        )
      ).to.be.reverted;
    });

    it("Should allow members to vote on proposals", async function () {
      const { lendingCircle, borrower, user1, circleId, mockToken } = await loadFixture(circleWithMembersFixture);
      
      await lendingCircle.connect(borrower).proposeLoan(
        circleId,
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        "Purpose"
      );
      
      const proposalId = 1n;
      
      await expect(
        lendingCircle.connect(user1).voteOnProposal(proposalId, true)
      ).to.emit(lendingCircle, "ProposalVoted");
      
      const proposal = await lendingCircle.proposals(proposalId);
      expect(proposal.votesFor).to.equal(1);
    });

    it("Should not allow double voting", async function () {
      const { lendingCircle, borrower, user1, circleId, mockToken } = await loadFixture(circleWithMembersFixture);
      
      await lendingCircle.connect(borrower).proposeLoan(
        circleId,
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        "Purpose"
      );
      
      const proposalId = 1n;
      await lendingCircle.connect(user1).voteOnProposal(proposalId, true);
      
      await expect(
        lendingCircle.connect(user1).voteOnProposal(proposalId, true)
      ).to.be.reverted;
    });

    it("Should approve proposal with quorum", async function () {
      const { lendingCircle, borrower, user1, user2, circleId, mockToken } = await loadFixture(circleWithMembersFixture);
      
      await lendingCircle.connect(borrower).proposeLoan(
        circleId,
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        "Purpose"
      );
      
      const proposalId = 1n;
      
      // Vote with majority (2 out of 3 = 66.7% > 60% quorum)
      await lendingCircle.connect(user1).voteOnProposal(proposalId, true);
      await lendingCircle.connect(user2).voteOnProposal(proposalId, true);
      
      const proposal = await lendingCircle.proposals(proposalId);
      expect(proposal.votesFor).to.be.gte(2);
    });

    it("Should reject proposal after voting period", async function () {
      const { lendingCircle, borrower, circleId, mockToken } = await loadFixture(circleWithMembersFixture);
      
      await lendingCircle.connect(borrower).proposeLoan(
        circleId,
        await mockToken.getAddress(),
        CONSTANTS.TYPICAL_LOAN_AMOUNT,
        90 * CONSTANTS.SECONDS_PER_DAY,
        "Purpose"
      );
      
      const proposalId = 1n;
      
      // Fast forward past voting period (7 days)
      await increaseTime(8 * CONSTANTS.SECONDS_PER_DAY);
      
      await expect(
        lendingCircle.voteOnProposal(proposalId, true)
      ).to.be.reverted;
    });
  });

  describe("Vouching System", function () {
    async function circleWithMembersFixture() {
      const fixture = await deployFixture();
      const { lendingCircle, creditScore, user1, user2 } = fixture;
      
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      
      await lendingCircle.connect(user1).createCircle("Test Circle", "Desc", 10, 500);
      const circleId = 1n;
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      return { ...fixture, circleId };
    }

    it("Should allow members to vouch for each other", async function () {
      const { lendingCircle, user1, user2, circleId } = await loadFixture(circleWithMembersFixture);
      
      await expect(
        lendingCircle.connect(user1).vouchForMember(circleId, user2.address)
      ).to.emit(lendingCircle, "MemberVouched");
      
      const vouches = await lendingCircle.getVouchesForMember(circleId, user2.address);
      expect(vouches).to.equal(1);
    });

    it("Should cost reputation to vouch", async function () {
      const { lendingCircle, user1, user2, circleId } = await loadFixture(circleWithMembersFixture);
      
      const repBefore = await lendingCircle.getMemberReputation(circleId, user1.address);
      
      await lendingCircle.connect(user1).vouchForMember(circleId, user2.address);
      
      const repAfter = await lendingCircle.getMemberReputation(circleId, user1.address);
      expect(repBefore - repAfter).to.equal(10); // VOUCH_COST
    });

    it("Should not allow self-vouching", async function () {
      const { lendingCircle, user1, circleId } = await loadFixture(circleWithMembersFixture);
      
      await expect(
        lendingCircle.connect(user1).vouchForMember(circleId, user1.address)
      ).to.be.reverted;
    });

    it("Should not allow vouching twice", async function () {
      const { lendingCircle, user1, user2, circleId } = await loadFixture(circleWithMembersFixture);
      
      await lendingCircle.connect(user1).vouchForMember(circleId, user2.address);
      
      await expect(
        lendingCircle.connect(user1).vouchForMember(circleId, user2.address)
      ).to.be.reverted;
    });
  });

  describe("Treasury Management", function () {
    async function circleWithTreasuryFixture() {
      const fixture = await deployFixture();
      const { lendingCircle, creditScore, mockToken, user1, user2 } = fixture;
      
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      
      await lendingCircle.connect(user1).createCircle("Test Circle", "Desc", 10, 500);
      const circleId = 1n;
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      return { ...fixture, circleId };
    }

    it("Should allow members to deposit to treasury", async function () {
      const { lendingCircle, mockToken, user1, circleId } = await loadFixture(circleWithTreasuryFixture);
      
      const depositAmount = ethers.parseEther("100");
      await mockToken.transfer(user1.address, depositAmount);
      await mockToken.connect(user1).approve(await lendingCircle.getAddress(), depositAmount);
      
      await expect(
        lendingCircle.connect(user1).depositToTreasury(
          circleId,
          await mockToken.getAddress(),
          depositAmount
        )
      ).to.emit(lendingCircle, "TreasuryDeposit");
      
      const circle = await lendingCircle.circles(circleId);
      expect(circle.totalTreasury).to.be.gt(0);
    });

    it("Should only allow members to deposit", async function () {
      const { lendingCircle, mockToken, attacker, circleId } = await loadFixture(circleWithTreasuryFixture);
      
      const depositAmount = ethers.parseEther("100");
      await mockToken.transfer(attacker.address, depositAmount);
      await mockToken.connect(attacker).approve(await lendingCircle.getAddress(), depositAmount);
      
      await expect(
        lendingCircle.connect(attacker).depositToTreasury(
          circleId,
          await mockToken.getAddress(),
          depositAmount
        )
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return circle details", async function () {
      const { lendingCircle, creditScore, user1 } = await loadFixture(deployFixture);
      
      await creditScore.updateCreditScore(user1.address, 700);
      await lendingCircle.connect(user1).createCircle("Test Circle", "Description", 10, 500);
      
      const circleId = 1n;
      const circle = await lendingCircle.circles(circleId);
      
      expect(circle.name).to.equal("Test Circle");
      expect(circle.description).to.equal("Description");
    });

    it("Should return member count", async function () {
      const { lendingCircle, creditScore, user1, user2 } = await loadFixture(deployFixture);
      
      await creditScore.updateCreditScore(user1.address, 700);
      await creditScore.updateCreditScore(user2.address, 650);
      
      await lendingCircle.connect(user1).createCircle("Test Circle", "Desc", 10, 500);
      const circleId = 1n;
      
      await lendingCircle.connect(user2).requestToJoin(circleId);
      
      const circle = await lendingCircle.circles(circleId);
      expect(circle.memberCount).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should allow pauser to pause contract", async function () {
      const { lendingCircle, owner } = await loadFixture(deployFixture);
      
      await lendingCircle.pause();
      expect(await lendingCircle.paused()).to.be.true;
    });

    it("Should prevent operations when paused", async function () {
      const { lendingCircle, creditScore, user1, owner } = await loadFixture(deployFixture);
      
      await lendingCircle.pause();
      
      await creditScore.updateCreditScore(user1.address, 700);
      await expect(
        lendingCircle.connect(user1).createCircle("Test", "Desc", 10, 500)
      ).to.be.reverted;
    });
  });
});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICreditScore {
    function getCreditScore(address user) external view returns (uint256);
}

/**
 * @title LendingCircle
 * @notice Manages social lending circles where members vouch for each other
 * @dev Implements community-based lending with shared responsibility
 *
 * CIRCLE MECHANICS:
 * - 5-20 members per circle
 * - Members vouch for each other (stake reputation)
 * - Loans require circle approval (voting)
 * - Shared loss if member defaults
 * - Circle treasury funded by members
 *
 * BENEFITS:
 * - Lower interest rates for circle members
 * - Community support and accountability
 * - Shared learning and financial literacy
 * - Social capital building
 */
contract LendingCircle is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MIN_MEMBERS = 5;
    uint256 public constant MAX_MEMBERS = 20;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant QUORUM_PERCENTAGE = 6000; // 60% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_CREDIT_SCORE = 400;
    uint256 public constant VOUCH_COST = 10; // Reputation points staked

    /*//////////////////////////////////////////////////////////////
                                  ENUMS
    //////////////////////////////////////////////////////////////*/

    enum CircleStatus {
        Active,
        Paused,
        Closed
    }

    enum ProposalType {
        LoanApproval,
        AddMember,
        RemoveMember,
        ChangeSettings
    }

    enum ProposalStatus {
        Pending,
        Approved,
        Rejected,
        Executed
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Circle {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 memberCount;
        uint256 maxMembers;
        uint256 minCreditScore;
        uint256 totalTreasury;
        uint256 activeLoans;
        uint256 completedLoans;
        uint256 defaultedLoans;
        uint256 createdAt;
        CircleStatus status;
    }

    struct Member {
        address memberAddress;
        uint256 joinedAt;
        uint256 reputation;
        uint256 loansReceived;
        uint256 loansVotedOn;
        uint256 vouchesGiven;
        uint256 contributedAmount;
        bool isActive;
    }

    struct Proposal {
        uint256 id;
        uint256 circleId;
        ProposalType proposalType;
        address proposer;
        address targetAddress;
        uint256 loanAmount;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVoters;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        string description;
    }

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    ICreditScore public creditScore;

    uint256 public nextCircleId;
    uint256 public nextProposalId;

    // Mapping: circleId => Circle
    mapping(uint256 => Circle) public circles;

    // Mapping: circleId => memberAddress => Member
    mapping(uint256 => mapping(address => Member)) public members;

    // Mapping: circleId => member addresses array
    mapping(uint256 => address[]) public circleMembers;

    // Mapping: proposalId => Proposal
    mapping(uint256 => Proposal) public proposals;

    // Mapping: circleId => proposalIds[]
    mapping(uint256 => uint256[]) public circleProposals;

    // Mapping: user => circleIds[] (circles user belongs to)
    mapping(address => uint256[]) public userCircles;

    // Mapping: circleId => asset => balance
    mapping(uint256 => mapping(address => uint256)) public circleTreasury;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CircleCreated(
        uint256 indexed circleId,
        string name,
        address indexed creator
    );
    event MemberJoined(uint256 indexed circleId, address indexed member);
    event MemberLeft(uint256 indexed circleId, address indexed member);
    event MemberRemoved(uint256 indexed circleId, address indexed member);
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed circleId,
        ProposalType proposalType
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    event ProposalExecuted(uint256 indexed proposalId, bool approved);
    event TreasuryContribution(
        uint256 indexed circleId,
        address indexed contributor,
        address asset,
        uint256 amount
    );
    event VouchGiven(
        uint256 indexed circleId,
        address indexed voucher,
        address indexed vouchee
    );
    event CircleStatusChanged(uint256 indexed circleId, CircleStatus newStatus);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidCircleId();
    error CircleNotActive();
    error NotCircleMember();
    error AlreadyMember();
    error CircleFull();
    error InsufficientCreditScore();
    error InvalidMemberCount();
    error ProposalNotFound();
    error ProposalExpired();
    error AlreadyVoted();
    error NotProposer();
    error InvalidProposalStatus();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the LendingCircle contract
     * @param admin Address to be granted admin role
     * @param _creditScore Address of CreditScore contract
     */
    function initialize(address admin, address _creditScore) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        creditScore = ICreditScore(_creditScore);
        nextCircleId = 1;
        nextProposalId = 1;
    }

    /*//////////////////////////////////////////////////////////////
                       CIRCLE CREATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new lending circle
     * @param name Circle name
     * @param description Circle description
     * @param maxMembers Maximum number of members
     * @param minCreditScore Minimum credit score to join
     * @return circleId Unique circle identifier
     */
    function createCircle(
        string calldata name,
        string calldata description,
        uint256 maxMembers,
        uint256 minCreditScore
    ) external nonReentrant whenNotPaused returns (uint256 circleId) {
        if (maxMembers < MIN_MEMBERS || maxMembers > MAX_MEMBERS) {
            revert InvalidMemberCount();
        }

        // Check creator's credit score
        uint256 creatorScore = creditScore.getCreditScore(msg.sender);
        if (creatorScore < MIN_CREDIT_SCORE) {
            revert InsufficientCreditScore();
        }

        circleId = nextCircleId++;

        Circle storage circle = circles[circleId];
        circle.id = circleId;
        circle.name = name;
        circle.description = description;
        circle.creator = msg.sender;
        circle.memberCount = 1;
        circle.maxMembers = maxMembers;
        circle.minCreditScore = minCreditScore;
        circle.createdAt = block.timestamp;
        circle.status = CircleStatus.Active;

        // Add creator as first member
        Member storage creatorMember = members[circleId][msg.sender];
        creatorMember.memberAddress = msg.sender;
        creatorMember.joinedAt = block.timestamp;
        creatorMember.reputation = 100; // Initial reputation
        creatorMember.isActive = true;

        circleMembers[circleId].push(msg.sender);
        userCircles[msg.sender].push(circleId);

        emit CircleCreated(circleId, name, msg.sender);
        emit MemberJoined(circleId, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                       MEMBERSHIP FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Request to join a circle
     * @param circleId Circle identifier
     */
    function requestToJoin(uint256 circleId) external nonReentrant whenNotPaused {
        Circle storage circle = circles[circleId];

        if (circle.id == 0) revert InvalidCircleId();
        if (circle.status != CircleStatus.Active) revert CircleNotActive();
        if (members[circleId][msg.sender].isActive) revert AlreadyMember();
        if (circle.memberCount >= circle.maxMembers) revert CircleFull();

        // Check credit score
        uint256 userScore = creditScore.getCreditScore(msg.sender);
        if (userScore < circle.minCreditScore) {
            revert InsufficientCreditScore();
        }

        // Create proposal for adding member
        uint256 proposalId = _createProposal(
            circleId,
            ProposalType.AddMember,
            msg.sender,
            0,
            "Add member to circle"
        );

        emit ProposalCreated(proposalId, circleId, ProposalType.AddMember);
    }

    /**
     * @notice Approves a join request (after proposal passes)
     * @param circleId Circle identifier
     * @param newMember Address of new member
     */
    function _approveMember(uint256 circleId, address newMember) internal {
        Circle storage circle = circles[circleId];

        Member storage member = members[circleId][newMember];
        member.memberAddress = newMember;
        member.joinedAt = block.timestamp;
        member.reputation = 50; // Initial reputation for new members
        member.isActive = true;

        circleMembers[circleId].push(newMember);
        userCircles[newMember].push(circleId);
        circle.memberCount++;

        emit MemberJoined(circleId, newMember);
    }

    /**
     * @notice Leave a circle voluntarily
     * @param circleId Circle identifier
     */
    function leaveCircle(uint256 circleId) external nonReentrant {
        if (!members[circleId][msg.sender].isActive) revert NotCircleMember();

        // Cannot leave if you have active loans
        Member storage member = members[circleId][msg.sender];
        require(member.loansReceived == 0, "Has active loans");

        member.isActive = false;
        circles[circleId].memberCount--;

        // Remove from array (expensive, but necessary)
        _removeMemberFromArray(circleId, msg.sender);

        emit MemberLeft(circleId, msg.sender);
    }

    /**
     * @notice Propose to remove a member (requires voting)
     * @param circleId Circle identifier
     * @param memberToRemove Address of member to remove
     */
    function proposeRemoveMember(uint256 circleId, address memberToRemove)
        external
        nonReentrant
    {
        if (!members[circleId][msg.sender].isActive) revert NotCircleMember();
        if (!members[circleId][memberToRemove].isActive) revert NotCircleMember();

        uint256 proposalId = _createProposal(
            circleId,
            ProposalType.RemoveMember,
            memberToRemove,
            0,
            "Remove member from circle"
        );

        emit ProposalCreated(proposalId, circleId, ProposalType.RemoveMember);
    }

    /*//////////////////////////////////////////////////////////////
                         LOAN PROPOSAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Propose a loan for circle approval
     * @param circleId Circle identifier
     * @param loanAmount Requested loan amount
     * @param description Loan purpose
     * @return proposalId Proposal identifier
     */
    function proposeLoan(
        uint256 circleId,
        uint256 loanAmount,
        string calldata description
    ) external nonReentrant whenNotPaused returns (uint256 proposalId) {
        Circle storage circle = circles[circleId];

        if (circle.id == 0) revert InvalidCircleId();
        if (circle.status != CircleStatus.Active) revert CircleNotActive();
        if (!members[circleId][msg.sender].isActive) revert NotCircleMember();

        // Check if member has too many active loans
        Member storage member = members[circleId][msg.sender];
        require(member.loansReceived < 2, "Too many active loans");

        proposalId = _createProposal(
            circleId,
            ProposalType.LoanApproval,
            msg.sender,
            loanAmount,
            description
        );

        emit ProposalCreated(proposalId, circleId, ProposalType.LoanApproval);
    }

    /*//////////////////////////////////////////////////////////////
                           VOTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Vote on a proposal
     * @param proposalId Proposal identifier
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.status != ProposalStatus.Pending) revert InvalidProposalStatus();
        if (block.timestamp > proposal.createdAt + VOTING_PERIOD) revert ProposalExpired();

        uint256 circleId = proposal.circleId;
        if (!members[circleId][msg.sender].isActive) revert NotCircleMember();
        if (proposal.hasVoted[msg.sender]) revert AlreadyVoted();

        proposal.hasVoted[msg.sender] = true;
        proposal.totalVoters++;

        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        // Update member reputation for participating
        members[circleId][msg.sender].loansVotedOn++;
        members[circleId][msg.sender].reputation += 1;

        emit VoteCast(proposalId, msg.sender, support);

        // Check if we can execute now
        _tryExecuteProposal(proposalId);
    }

    /**
     * @notice Execute a proposal if quorum reached
     * @param proposalId Proposal identifier
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        _tryExecuteProposal(proposalId);
    }

    /**
     * @notice Internal function to execute proposal
     * @param proposalId Proposal identifier
     */
    function _tryExecuteProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.status != ProposalStatus.Pending) return;

        uint256 circleId = proposal.circleId;
        uint256 totalMembers = circles[circleId].memberCount;

        // Check if voting period ended
        bool votingEnded = block.timestamp > proposal.createdAt + VOTING_PERIOD;

        // Calculate if quorum reached
        uint256 quorumVotes = (totalMembers * QUORUM_PERCENTAGE) / BASIS_POINTS;
        bool quorumReached = proposal.totalVoters >= quorumVotes;

        if (!votingEnded && !quorumReached) return;

        // Determine if approved
        bool approved = proposal.votesFor > proposal.votesAgainst;

        if (approved) {
            proposal.status = ProposalStatus.Approved;

            // Execute based on proposal type
            if (proposal.proposalType == ProposalType.LoanApproval) {
                // Loan will be processed by LoanManager
                circles[circleId].activeLoans++;
                members[circleId][proposal.targetAddress].loansReceived++;
            } else if (proposal.proposalType == ProposalType.AddMember) {
                _approveMember(circleId, proposal.targetAddress);
            } else if (proposal.proposalType == ProposalType.RemoveMember) {
                members[circleId][proposal.targetAddress].isActive = false;
                circles[circleId].memberCount--;
                _removeMemberFromArray(circleId, proposal.targetAddress);
                emit MemberRemoved(circleId, proposal.targetAddress);
            }

            proposal.status = ProposalStatus.Executed;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }

        emit ProposalExecuted(proposalId, approved);
    }

    /*//////////////////////////////////////////////////////////////
                         TREASURY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Contribute to circle treasury
     * @param circleId Circle identifier
     * @param asset Token address
     * @param amount Contribution amount
     */
    function contributeToTreasury(
        uint256 circleId,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (!members[circleId][msg.sender].isActive) revert NotCircleMember();

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        circleTreasury[circleId][asset] += amount;
        circles[circleId].totalTreasury += amount;
        members[circleId][msg.sender].contributedAmount += amount;
        members[circleId][msg.sender].reputation += 5; // Reward contribution

        emit TreasuryContribution(circleId, msg.sender, asset, amount);
    }

    /**
     * @notice Vouch for another member (stake reputation)
     * @param circleId Circle identifier
     * @param vouchee Member to vouch for
     */
    function vouchForMember(uint256 circleId, address vouchee) external {
        if (!members[circleId][msg.sender].isActive) revert NotCircleMember();
        if (!members[circleId][vouchee].isActive) revert NotCircleMember();

        Member storage voucher = members[circleId][msg.sender];
        require(voucher.reputation >= VOUCH_COST, "Insufficient reputation");

        voucher.reputation -= VOUCH_COST;
        voucher.vouchesGiven++;

        members[circleId][vouchee].reputation += VOUCH_COST;

        emit VouchGiven(circleId, msg.sender, vouchee);
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new proposal
     */
    function _createProposal(
        uint256 circleId,
        ProposalType proposalType,
        address targetAddress,
        uint256 loanAmount,
        string memory description
    ) internal returns (uint256 proposalId) {
        proposalId = nextProposalId++;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.circleId = circleId;
        proposal.proposalType = proposalType;
        proposal.proposer = msg.sender;
        proposal.targetAddress = targetAddress;
        proposal.loanAmount = loanAmount;
        proposal.createdAt = block.timestamp;
        proposal.status = ProposalStatus.Pending;
        proposal.description = description;

        circleProposals[circleId].push(proposalId);
    }

    /**
     * @notice Removes member from circle members array
     */
    function _removeMemberFromArray(uint256 circleId, address member) internal {
        address[] storage memberArray = circleMembers[circleId];
        for (uint256 i = 0; i < memberArray.length; i++) {
            if (memberArray[i] == member) {
                memberArray[i] = memberArray[memberArray.length - 1];
                memberArray.pop();
                break;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getCircle(uint256 circleId) external view returns (Circle memory) {
        return circles[circleId];
    }

    function getMember(uint256 circleId, address memberAddress)
        external
        view
        returns (Member memory)
    {
        return members[circleId][memberAddress];
    }

    function getCircleMembers(uint256 circleId) external view returns (address[] memory) {
        return circleMembers[circleId];
    }

    function getUserCircles(address user) external view returns (uint256[] memory) {
        return userCircles[user];
    }

    function getCircleProposals(uint256 circleId) external view returns (uint256[] memory) {
        return circleProposals[circleId];
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title CreditScore
 * @notice Stores and manages on-chain credit scores for TrustCircle users
 * @dev Credit scores range from 0-1000
 *
 * SCORE COMPONENTS:
 * - On-chain history: Loan repayment, transaction volume, wallet age
 * - Social reputation: Farcaster followers, circle vouches
 * - Verification: KYC completion level
 *
 * PERMISSIONS:
 * - AI Agent: Can update scores based on analysis
 * - Loan Manager: Updates scores on loan events
 * - Public: Can query any user's score (transparency)
 */
contract CreditScore is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SCORE_UPDATER_ROLE = keccak256("SCORE_UPDATER_ROLE");
    bytes32 public constant AI_AGENT_ROLE = keccak256("AI_AGENT_ROLE");

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MIN_SCORE = 0;
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant DEFAULT_SCORE = 500; // New users start at 500

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Score {
        uint256 currentScore;        // Current credit score (0-1000)
        uint256 lastUpdated;         // Last update timestamp
        uint256 updateCount;         // Number of score updates
        bool hasScore;               // Whether user has a score
    }

    struct LoanHistory {
        uint256 totalLoans;          // Total loans taken
        uint256 completedLoans;      // Successfully completed loans
        uint256 defaultedLoans;      // Defaulted loans
        uint256 totalBorrowed;       // Total amount borrowed (wei)
        uint256 totalRepaid;         // Total amount repaid (wei)
        uint256 onTimePayments;      // On-time payment count
        uint256 latePayments;        // Late payment count
        uint256 lastLoanTimestamp;   // Last loan timestamp
    }

    struct SocialReputation {
        uint256 farcasterFollowers;  // Farcaster follower count
        uint256 vouchesReceived;     // Vouches from other users
        uint256 circlesMemberOf;     // Number of circles joined
        uint256 lastSocialUpdate;    // Last social data update
    }

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    // Mapping: user => Score
    mapping(address => Score) public scores;

    // Mapping: user => LoanHistory
    mapping(address => LoanHistory) public loanHistory;

    // Mapping: user => SocialReputation
    mapping(address => SocialReputation) public socialReputation;

    // Mapping: voucher => vouchee => has vouched
    mapping(address => mapping(address => bool)) public vouches;

    // Score history (for analytics)
    mapping(address => uint256[]) public scoreHistory;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        string reason
    );
    event LoanHistoryUpdated(
        address indexed user,
        uint256 totalLoans,
        uint256 completedLoans,
        uint256 defaultedLoans
    );
    event SocialReputationUpdated(
        address indexed user,
        uint256 farcasterFollowers,
        uint256 vouchesReceived
    );
    event VouchGiven(address indexed voucher, address indexed vouchee);
    event VouchRemoved(address indexed voucher, address indexed vouchee);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidScore();
    error CannotVouchSelf();
    error AlreadyVouched();
    error NotVouched();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the CreditScore contract
     * @param admin Address to be granted admin role
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(SCORE_UPDATER_ROLE, admin);
    }

    /*//////////////////////////////////////////////////////////////
                        SCORE QUERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets a user's current credit score
     * @param user User address
     * @return score Credit score (0-1000)
     */
    function getCreditScore(address user) external view returns (uint256 score) {
        Score storage userScore = scores[user];

        if (!userScore.hasScore) {
            return DEFAULT_SCORE;
        }

        return userScore.currentScore;
    }

    /**
     * @notice Gets complete credit score data for a user
     * @param user User address
     * @return Complete Score struct
     */
    function getScoreData(address user) external view returns (Score memory) {
        return scores[user];
    }

    /**
     * @notice Gets loan history for a user
     * @param user User address
     * @return LoanHistory struct
     */
    function getLoanHistory(address user) external view returns (LoanHistory memory) {
        return loanHistory[user];
    }

    /**
     * @notice Gets social reputation for a user
     * @param user User address
     * @return SocialReputation struct
     */
    function getSocialReputation(address user) external view returns (SocialReputation memory) {
        return socialReputation[user];
    }

    /**
     * @notice Gets score history for a user
     * @param user User address
     * @return Array of historical scores
     */
    function getScoreHistory(address user) external view returns (uint256[] memory) {
        return scoreHistory[user];
    }

    /**
     * @notice Checks if one user has vouched for another
     * @param voucher Voucher address
     * @param vouchee Vouchee address
     * @return True if vouched
     */
    function hasVouched(address voucher, address vouchee) external view returns (bool) {
        return vouches[voucher][vouchee];
    }

    /*//////////////////////////////////////////////////////////////
                      SCORE UPDATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates a user's credit score
     * @param user User address
     * @param newScore New score (0-1000)
     * @dev Only callable by authorized updaters (AI agent, LoanManager)
     */
    function updateCreditScore(address user, uint256 newScore)
        external
        onlyRole(SCORE_UPDATER_ROLE)
        whenNotPaused
    {
        if (newScore > MAX_SCORE) revert InvalidScore();

        Score storage userScore = scores[user];
        uint256 oldScore = userScore.hasScore ? userScore.currentScore : DEFAULT_SCORE;

        userScore.currentScore = newScore;
        userScore.lastUpdated = block.timestamp;
        userScore.updateCount++;
        userScore.hasScore = true;

        // Store in history
        scoreHistory[user].push(newScore);

        emit ScoreUpdated(user, oldScore, newScore, "Manual update");
    }

    /**
     * @notice Updates a user's credit score with reason
     * @param user User address
     * @param newScore New score (0-1000)
     * @param reason Update reason
     */
    function updateCreditScoreWithReason(
        address user,
        uint256 newScore,
        string calldata reason
    ) external onlyRole(SCORE_UPDATER_ROLE) whenNotPaused {
        if (newScore > MAX_SCORE) revert InvalidScore();

        Score storage userScore = scores[user];
        uint256 oldScore = userScore.hasScore ? userScore.currentScore : DEFAULT_SCORE;

        userScore.currentScore = newScore;
        userScore.lastUpdated = block.timestamp;
        userScore.updateCount++;
        userScore.hasScore = true;

        scoreHistory[user].push(newScore);

        emit ScoreUpdated(user, oldScore, newScore, reason);
    }

    /**
     * @notice AI agent updates score based on comprehensive analysis
     * @param user User address
     * @param newScore New calculated score
     * @param onChainScore Score from on-chain analysis
     * @param socialScore Score from social analysis
     * @param verificationScore Score from verification level
     */
    function aiUpdateScore(
        address user,
        uint256 newScore,
        uint256 onChainScore,
        uint256 socialScore,
        uint256 verificationScore
    ) external onlyRole(AI_AGENT_ROLE) whenNotPaused {
        if (newScore > MAX_SCORE) revert InvalidScore();

        Score storage userScore = scores[user];
        uint256 oldScore = userScore.hasScore ? userScore.currentScore : DEFAULT_SCORE;

        userScore.currentScore = newScore;
        userScore.lastUpdated = block.timestamp;
        userScore.updateCount++;
        userScore.hasScore = true;

        scoreHistory[user].push(newScore);

        emit ScoreUpdated(
            user,
            oldScore,
            newScore,
            string(abi.encodePacked(
                "AI: OnChain=", _toString(onChainScore),
                " Social=", _toString(socialScore),
                " Verification=", _toString(verificationScore)
            ))
        );
    }

    /*//////////////////////////////////////////////////////////////
                    LOAN HISTORY UPDATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Records a new loan
     * @param user User address
     * @param amount Loan amount
     */
    function recordLoan(address user, uint256 amount)
        external
        onlyRole(SCORE_UPDATER_ROLE)
    {
        LoanHistory storage history = loanHistory[user];
        history.totalLoans++;
        history.totalBorrowed += amount;
        history.lastLoanTimestamp = block.timestamp;

        emit LoanHistoryUpdated(
            user,
            history.totalLoans,
            history.completedLoans,
            history.defaultedLoans
        );
    }

    /**
     * @notice Records a completed loan
     * @param user User address
     * @param amountRepaid Total amount repaid
     */
    function recordLoanCompletion(address user, uint256 amountRepaid)
        external
        onlyRole(SCORE_UPDATER_ROLE)
    {
        LoanHistory storage history = loanHistory[user];
        history.completedLoans++;
        history.totalRepaid += amountRepaid;

        emit LoanHistoryUpdated(
            user,
            history.totalLoans,
            history.completedLoans,
            history.defaultedLoans
        );
    }

    /**
     * @notice Records a loan default
     * @param user User address
     */
    function recordLoanDefault(address user)
        external
        onlyRole(SCORE_UPDATER_ROLE)
    {
        LoanHistory storage history = loanHistory[user];
        history.defaultedLoans++;

        emit LoanHistoryUpdated(
            user,
            history.totalLoans,
            history.completedLoans,
            history.defaultedLoans
        );
    }

    /**
     * @notice Records a loan payment
     * @param user User address
     * @param isOnTime Whether payment was on time
     */
    function recordPayment(address user, bool isOnTime)
        external
        onlyRole(SCORE_UPDATER_ROLE)
    {
        LoanHistory storage history = loanHistory[user];

        if (isOnTime) {
            history.onTimePayments++;
        } else {
            history.latePayments++;
        }
    }

    /*//////////////////////////////////////////////////////////////
                 SOCIAL REPUTATION UPDATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates social reputation data
     * @param user User address
     * @param farcasterFollowers Farcaster follower count
     * @param circlesMemberOf Number of circles
     */
    function updateSocialReputation(
        address user,
        uint256 farcasterFollowers,
        uint256 circlesMemberOf
    ) external onlyRole(AI_AGENT_ROLE) {
        SocialReputation storage social = socialReputation[user];
        social.farcasterFollowers = farcasterFollowers;
        social.circlesMemberOf = circlesMemberOf;
        social.lastSocialUpdate = block.timestamp;

        emit SocialReputationUpdated(user, farcasterFollowers, social.vouchesReceived);
    }

    /**
     * @notice Vouch for another user
     * @param vouchee User to vouch for
     * @dev Anyone can vouch, but it affects reputation
     */
    function vouchForUser(address vouchee) external whenNotPaused {
        if (msg.sender == vouchee) revert CannotVouchSelf();
        if (vouches[msg.sender][vouchee]) revert AlreadyVouched();

        vouches[msg.sender][vouchee] = true;
        socialReputation[vouchee].vouchesReceived++;

        emit VouchGiven(msg.sender, vouchee);
    }

    /**
     * @notice Remove a vouch
     * @param vouchee User to remove vouch from
     */
    function removeVouch(address vouchee) external whenNotPaused {
        if (!vouches[msg.sender][vouchee]) revert NotVouched();

        vouches[msg.sender][vouchee] = false;
        socialReputation[vouchee].vouchesReceived--;

        emit VouchRemoved(msg.sender, vouchee);
    }

    /*//////////////////////////////////////////////////////////////
                       CALCULATION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculates a basic credit score from on-chain data
     * @param user User address
     * @return calculatedScore Score based on loan history
     * @dev This is a simple calculation; AI agent provides comprehensive scores
     */
    function calculateBasicScore(address user) public view returns (uint256 calculatedScore) {
        LoanHistory storage history = loanHistory[user];

        // Start with default score
        uint256 score = DEFAULT_SCORE;

        // No loans yet - return default
        if (history.totalLoans == 0) {
            return DEFAULT_SCORE;
        }

        // Completion rate (40% weight)
        uint256 completionRate = (history.completedLoans * 1000) / history.totalLoans;
        score += (completionRate * 400) / 1000;

        // Default rate penalty (30% weight)
        if (history.defaultedLoans > 0) {
            uint256 defaultRate = (history.defaultedLoans * 1000) / history.totalLoans;
            score -= (defaultRate * 300) / 1000;
        }

        // On-time payment rate (20% weight)
        uint256 totalPayments = history.onTimePayments + history.latePayments;
        if (totalPayments > 0) {
            uint256 onTimeRate = (history.onTimePayments * 1000) / totalPayments;
            score += (onTimeRate * 200) / 1000;
        }

        // Volume bonus (10% weight) - more activity = higher score
        if (history.totalLoans >= 10) {
            score += 100;
        } else if (history.totalLoans >= 5) {
            score += 50;
        }

        // Cap at MAX_SCORE
        if (score > MAX_SCORE) {
            score = MAX_SCORE;
        }

        return score;
    }

    /**
     * @notice Gets a user's score tier
     * @param user User address
     * @return tier Score tier (0-4)
     * @dev 0=Bad, 1=Poor, 2=Fair, 3=Good, 4=Excellent
     */
    function getScoreTier(address user) external view returns (uint256 tier) {
        uint256 score = scores[user].hasScore ? scores[user].currentScore : DEFAULT_SCORE;

        if (score >= 800) return 4; // Excellent
        if (score >= 700) return 3; // Good
        if (score >= 600) return 2; // Fair
        if (score >= 500) return 1; // Poor
        return 0; // Bad
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pauses score updates
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses score updates
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Batch update scores (admin emergency function)
     * @param users Array of user addresses
     * @param newScores Array of new scores
     */
    function batchUpdateScores(
        address[] calldata users,
        uint256[] calldata newScores
    ) external onlyRole(ADMIN_ROLE) {
        require(users.length == newScores.length, "Length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            if (newScores[i] <= MAX_SCORE) {
                scores[users[i]].currentScore = newScores[i];
                scores[users[i]].lastUpdated = block.timestamp;
                scores[users[i]].hasScore = true;

                scoreHistory[users[i]].push(newScores[i]);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Converts uint to string
     * @param value Value to convert
     * @return String representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @notice Authorizes contract upgrades
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}
}

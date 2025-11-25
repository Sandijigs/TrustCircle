// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ILendingPool {
    function disburseLoan(address asset, address borrower, uint256 amount, uint256 loanId) external;
    function repayLoan(address asset, address borrower, uint256 principal, uint256 interest) external;
    function calculateBorrowAPY(address asset) external view returns (uint256);
}

interface ICreditScore {
    function getCreditScore(address user) external view returns (uint256);
    function updateCreditScore(address user, uint256 newScore) external;
}

interface ICollateralManager {
    function hasCollateral(address user, uint256 loanId) external view returns (bool);
    function lockCollateral(address user, uint256 loanId) external;
    function releaseCollateral(address user, uint256 loanId) external;
    function liquidateCollateral(address user, uint256 loanId) external returns (uint256);
}

/**
 * @title LoanManager
 * @notice Manages the complete lifecycle of loans in TrustCircle
 * @dev Handles loan requests, approvals, disbursements, repayments, and defaults
 *
 * LOAN LIFECYCLE:
 * 1. Request: Borrower requests loan with terms
 * 2. Approval: Auto-approved if high credit score or requires circle voting
 * 3. Disbursement: Funds transferred from LendingPool
 * 4. Repayment: Borrower makes installment payments
 * 5. Completion: Loan fully repaid or defaulted
 *
 * INTEREST CALCULATION:
 * - Uses amortization formula for equal installments
 * - Interest rate based on credit score (8-25% APY)
 * - Late payment penalty: 2% per week
 */
contract LoanManager is
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
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_LOAN_AMOUNT = 50 * 1e18; // $50 minimum
    uint256 public constant MAX_LOAN_AMOUNT = 5000 * 1e18; // $5000 maximum
    uint256 public constant MIN_DURATION = 30 days; // 1 month minimum
    uint256 public constant MAX_DURATION = 365 days; // 12 months maximum
    uint256 public constant MIN_CREDIT_SCORE = 300; // Minimum credit score to borrow
    uint256 public constant AUTO_APPROVE_SCORE = 800; // Auto-approve if score >= 800
    uint256 public constant LATE_PAYMENT_PENALTY = 200; // 2% per week
    uint256 public constant GRACE_PERIOD = 7 days; // 7 days grace period
    uint256 public constant DEFAULT_THRESHOLD = 30 days; // Default after 30 days late
    uint256 public constant SECONDS_PER_WEEK = 7 days;

    /*//////////////////////////////////////////////////////////////
                                  ENUMS
    //////////////////////////////////////////////////////////////*/

    enum LoanStatus {
        Pending,        // 0: Loan requested, awaiting approval
        Approved,       // 1: Loan approved, ready for disbursement
        Active,         // 2: Loan disbursed, repayment in progress
        Completed,      // 3: Loan fully repaid
        Defaulted,      // 4: Loan defaulted
        Cancelled       // 5: Loan cancelled
    }

    enum PaymentFrequency {
        Weekly,         // 0: Weekly payments
        BiWeekly,       // 1: Every 2 weeks
        Monthly         // 2: Monthly payments
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Loan {
        uint256 id;                      // Unique loan ID
        address borrower;                // Borrower address
        address asset;                   // Stablecoin address
        uint256 principalAmount;         // Loan principal
        uint256 interestRate;            // APY in basis points
        uint256 duration;                // Loan duration in seconds
        PaymentFrequency frequency;      // Payment frequency
        uint256 installmentAmount;       // Amount per installment
        uint256 totalInstallments;       // Total number of installments
        uint256 paidInstallments;        // Installments paid so far
        uint256 totalRepaid;             // Total amount repaid
        uint256 interestPaid;            // Total interest paid
        uint256 startTime;               // Loan start timestamp
        uint256 nextPaymentDue;          // Next payment due date
        LoanStatus status;               // Current loan status
        bool hasCollateral;              // Whether loan has collateral
        uint256 latePaymentCount;        // Number of late payments
        uint256 circleId;                // Lending circle ID (0 if not from circle)
    }

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    // Lending Pool contract
    ILendingPool public lendingPool;

    // Credit Score contract
    ICreditScore public creditScore;

    // Collateral Manager contract
    ICollateralManager public collateralManager;

    // Loan counter
    uint256 public nextLoanId;

    // Mapping: loanId => Loan
    mapping(uint256 => Loan) public loans;

    // Mapping: borrower => loanIds[]
    mapping(address => uint256[]) private borrowerLoans;

    // Mapping: borrower => active loan count
    mapping(address => uint256) public activeLoanCount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed asset,
        uint256 amount,
        uint256 duration
    );
    event LoanApproved(uint256 indexed loanId, address indexed approver);
    event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event PaymentMade(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 installmentNumber
    );
    event LoanCompleted(uint256 indexed loanId, address indexed borrower);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower, uint256 amountOwed);
    event LoanCancelled(uint256 indexed loanId, address indexed borrower);
    event LatePaymentRecorded(uint256 indexed loanId, uint256 daysLate, uint256 penalty);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidLoanAmount();
    error InvalidDuration();
    error InsufficientCreditScore();
    error LoanNotFound();
    error LoanNotPending();
    error LoanNotActive();
    error InvalidPaymentAmount();
    error TooManyActiveLoans();
    error LoanAlreadyApproved();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the LoanManager contract
     * @param admin Address to be granted admin role
     * @param _lendingPool Address of LendingPool contract
     * @param _creditScore Address of CreditScore contract
     * @param _collateralManager Address of CollateralManager contract
     */
    function initialize(
        address admin,
        address _lendingPool,
        address _creditScore,
        address _collateralManager
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(APPROVER_ROLE, admin);

        lendingPool = ILendingPool(_lendingPool);
        creditScore = ICreditScore(_creditScore);
        collateralManager = ICollateralManager(_collateralManager);
        nextLoanId = 1;
    }

    /*//////////////////////////////////////////////////////////////
                          LOAN REQUEST FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Requests a new loan
     * @param asset Stablecoin address (cUSD, cEUR, cREAL)
     * @param amount Loan amount
     * @param duration Loan duration in seconds
     * @param frequency Payment frequency
     * @param circleId Lending circle ID (0 if not from circle)
     * @return loanId Unique loan identifier
     *
     * @dev Interest rate is calculated based on credit score:
     * - Score >= 800: 8% APY
     * - Score 700-799: 12% APY
     * - Score 600-699: 16% APY
     * - Score 500-599: 20% APY
     * - Score < 500: 25% APY
     */
    function requestLoan(
        address asset,
        uint256 amount,
        uint256 duration,
        PaymentFrequency frequency,
        uint256 circleId
    ) external nonReentrant whenNotPaused returns (uint256 loanId) {
        // Validate loan parameters
        if (amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
            revert InvalidLoanAmount();
        }
        if (duration < MIN_DURATION || duration > MAX_DURATION) {
            revert InvalidDuration();
        }

        // Check credit score
        uint256 userCreditScore = creditScore.getCreditScore(msg.sender);
        if (userCreditScore < MIN_CREDIT_SCORE) {
            revert InsufficientCreditScore();
        }

        // Limit active loans per user
        if (activeLoanCount[msg.sender] >= 3) {
            revert TooManyActiveLoans();
        }

        // Calculate interest rate based on credit score
        uint256 interestRate = _calculateInterestRate(userCreditScore);

        // Calculate installment details
        (uint256 totalInstallments, uint256 installmentAmount) =
            _calculateInstallments(amount, interestRate, duration, frequency);

        // Create loan
        loanId = nextLoanId++;
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            asset: asset,
            principalAmount: amount,
            interestRate: interestRate,
            duration: duration,
            frequency: frequency,
            installmentAmount: installmentAmount,
            totalInstallments: totalInstallments,
            paidInstallments: 0,
            totalRepaid: 0,
            interestPaid: 0,
            startTime: 0,
            nextPaymentDue: 0,
            status: LoanStatus.Pending,
            hasCollateral: false,
            latePaymentCount: 0,
            circleId: circleId
        });

        borrowerLoans[msg.sender].push(loanId);

        emit LoanRequested(loanId, msg.sender, asset, amount, duration);

        // Auto-approve if credit score is high enough
        if (userCreditScore >= AUTO_APPROVE_SCORE) {
            _approveLoan(loanId);
        }
    }

    /*//////////////////////////////////////////////////////////////
                         LOAN APPROVAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Approves a pending loan
     * @param loanId Loan identifier
     * @dev Can be called by approver role or automatically for high credit scores
     */
    function approveLoan(uint256 loanId)
        external
        onlyRole(APPROVER_ROLE)
        nonReentrant
    {
        _approveLoan(loanId);
    }

    /**
     * @notice Internal function to approve a loan
     * @param loanId Loan identifier
     */
    function _approveLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];

        if (loan.borrower == address(0)) revert LoanNotFound();
        if (loan.status != LoanStatus.Pending) revert LoanNotPending();

        loan.status = LoanStatus.Approved;

        emit LoanApproved(loanId, msg.sender);

        // Auto-disburse
        _disburseLoan(loanId);
    }

    /**
     * @notice Disburses an approved loan
     * @param loanId Loan identifier
     */
    function _disburseLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.Approved) revert LoanAlreadyApproved();

        // Lock collateral if present
        if (collateralManager.hasCollateral(loan.borrower, loanId)) {
            collateralManager.lockCollateral(loan.borrower, loanId);
            loan.hasCollateral = true;
        }

        // Update loan status
        loan.status = LoanStatus.Active;
        loan.startTime = block.timestamp;
        loan.nextPaymentDue = block.timestamp + _getPaymentInterval(loan.frequency);

        activeLoanCount[loan.borrower]++;

        // Disburse from lending pool
        lendingPool.disburseLoan(loan.asset, loan.borrower, loan.principalAmount, loanId);

        emit LoanDisbursed(loanId, loan.borrower, loan.principalAmount);
    }

    /*//////////////////////////////////////////////////////////////
                         REPAYMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Makes a loan payment
     * @param loanId Loan identifier
     * @param amount Payment amount
     *
     * @dev Accepts partial or full payments
     * Calculates late payment penalties if applicable
     */
    function makePayment(uint256 loanId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        Loan storage loan = loans[loanId];

        if (loan.borrower != msg.sender) revert LoanNotFound();
        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (amount == 0) revert InvalidPaymentAmount();

        // Check for late payment
        uint256 penalty = 0;
        if (block.timestamp > loan.nextPaymentDue + GRACE_PERIOD) {
            uint256 weeksLate = (block.timestamp - loan.nextPaymentDue) / SECONDS_PER_WEEK;
            penalty = (loan.installmentAmount * LATE_PAYMENT_PENALTY * weeksLate) / BASIS_POINTS;
            loan.latePaymentCount++;

            emit LatePaymentRecorded(loanId, weeksLate * 7, penalty);
        }

        // Calculate payment allocation
        uint256 totalDue = loan.installmentAmount + penalty;
        uint256 paymentAmount = amount > totalDue ? totalDue : amount;

        // Separate principal and interest
        uint256 remainingPrincipal = loan.principalAmount -
            (loan.principalAmount * loan.paidInstallments / loan.totalInstallments);
        uint256 interestPortion = _calculateInterestPortion(
            remainingPrincipal,
            loan.interestRate,
            _getPaymentInterval(loan.frequency)
        );
        uint256 principalPortion = paymentAmount - interestPortion - penalty;

        // Update loan state
        loan.totalRepaid += paymentAmount;
        loan.interestPaid += interestPortion + penalty;
        loan.paidInstallments++;
        loan.nextPaymentDue += _getPaymentInterval(loan.frequency);

        // Transfer payment from borrower
        IERC20(loan.asset).safeTransferFrom(msg.sender, address(this), paymentAmount);

        // Repay to lending pool
        IERC20(loan.asset).approve(address(lendingPool), paymentAmount);
        lendingPool.repayLoan(loan.asset, msg.sender, principalPortion, interestPortion + penalty);

        emit PaymentMade(loanId, msg.sender, paymentAmount, loan.paidInstallments);

        // Check if loan is completed
        if (loan.paidInstallments >= loan.totalInstallments) {
            _completeLoan(loanId);
        }

        // Update credit score positively
        _updateCreditScoreForPayment(msg.sender, true);
    }

    /**
     * @notice Completes a loan
     * @param loanId Loan identifier
     */
    function _completeLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];

        loan.status = LoanStatus.Completed;
        activeLoanCount[loan.borrower]--;

        // Release collateral if present
        if (loan.hasCollateral) {
            collateralManager.releaseCollateral(loan.borrower, loanId);
        }

        // Boost credit score for successful repayment
        uint256 currentScore = creditScore.getCreditScore(loan.borrower);
        uint256 newScore = currentScore + 20; // +20 points for completing a loan
        if (newScore > 1000) newScore = 1000;
        creditScore.updateCreditScore(loan.borrower, newScore);

        emit LoanCompleted(loanId, loan.borrower);
    }

    /*//////////////////////////////////////////////////////////////
                         DEFAULT HANDLING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Marks a loan as defaulted
     * @param loanId Loan identifier
     * @dev Can be called by anyone if loan is past DEFAULT_THRESHOLD
     */
    function declarDefault(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];

        if (loan.status != LoanStatus.Active) revert LoanNotActive();
        if (block.timestamp < loan.nextPaymentDue + DEFAULT_THRESHOLD) {
            revert("Loan not yet defaulted");
        }

        loan.status = LoanStatus.Defaulted;
        activeLoanCount[loan.borrower]--;

        uint256 amountOwed = (loan.principalAmount * (loan.totalInstallments - loan.paidInstallments))
                            / loan.totalInstallments;

        // Liquidate collateral if present
        if (loan.hasCollateral) {
            uint256 recovered = collateralManager.liquidateCollateral(loan.borrower, loanId);
            // TODO: Apply recovered amount to loan
        }

        // Severely penalize credit score
        uint256 currentScore = creditScore.getCreditScore(loan.borrower);
        uint256 penalty = 200; // -200 points for default
        uint256 newScore = currentScore > penalty ? currentScore - penalty : 0;
        creditScore.updateCreditScore(loan.borrower, newScore);

        emit LoanDefaulted(loanId, loan.borrower, amountOwed);
    }

    /*//////////////////////////////////////////////////////////////
                        CALCULATION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculates interest rate based on credit score
     * @param score Credit score (0-1000)
     * @return interestRate APY in basis points
     */
    function _calculateInterestRate(uint256 score) internal pure returns (uint256 interestRate) {
        if (score >= 800) return 800;       // 8%
        if (score >= 700) return 1200;      // 12%
        if (score >= 600) return 1600;      // 16%
        if (score >= 500) return 2000;      // 20%
        return 2500;                        // 25%
    }

    /**
     * @notice Calculates installment details using amortization formula
     * @param principal Loan principal
     * @param annualRate Annual interest rate in basis points
     * @param duration Loan duration in seconds
     * @param frequency Payment frequency
     * @return totalInstallments Number of installments
     * @return installmentAmount Amount per installment
     *
     * FORMULA: A = P * [r(1+r)^n] / [(1+r)^n - 1]
     * Where:
     * - A = installment amount
     * - P = principal
     * - r = interest rate per period
     * - n = number of periods
     */
    function _calculateInstallments(
        uint256 principal,
        uint256 annualRate,
        uint256 duration,
        PaymentFrequency frequency
    ) internal pure returns (uint256 totalInstallments, uint256 installmentAmount) {
        uint256 paymentInterval = _getPaymentInterval(frequency);
        totalInstallments = duration / paymentInterval;

        // Convert annual rate to per-period rate
        uint256 periodsPerYear = 365 days / paymentInterval;
        uint256 periodRate = annualRate / periodsPerYear;

        // Amortization formula (simplified for Solidity)
        // A = P * r * (1 + r)^n / ((1 + r)^n - 1)
        uint256 factor = _pow((BASIS_POINTS + periodRate), totalInstallments, BASIS_POINTS);
        installmentAmount = (principal * periodRate * factor) /
                           (BASIS_POINTS * (factor - BASIS_POINTS));
    }

    /**
     * @notice Calculates interest portion of a payment
     * @param principal Remaining principal
     * @param annualRate Annual interest rate
     * @param duration Period duration
     * @return Interest amount
     */
    function _calculateInterestPortion(
        uint256 principal,
        uint256 annualRate,
        uint256 duration
    ) internal pure returns (uint256) {
        return (principal * annualRate * duration) / (365 days * BASIS_POINTS);
    }

    /**
     * @notice Gets payment interval in seconds
     * @param frequency Payment frequency enum
     * @return Interval in seconds
     */
    function _getPaymentInterval(PaymentFrequency frequency) internal pure returns (uint256) {
        if (frequency == PaymentFrequency.Weekly) return 7 days;
        if (frequency == PaymentFrequency.BiWeekly) return 14 days;
        return 30 days; // Monthly
    }

    /**
     * @notice Power function for fixed-point arithmetic
     * @param base Base value
     * @param exponent Exponent
     * @param precision Precision (e.g., 10000 for basis points)
     * @return Result of base^exponent
     */
    function _pow(uint256 base, uint256 exponent, uint256 precision) internal pure returns (uint256) {
        if (exponent == 0) return precision;

        uint256 result = precision;
        for (uint256 i = 0; i < exponent; i++) {
            result = (result * base) / precision;
        }
        return result;
    }

    /**
     * @notice Updates credit score after payment
     * @param borrower Borrower address
     * @param onTime Whether payment was on time
     */
    function _updateCreditScoreForPayment(address borrower, bool onTime) internal {
        uint256 currentScore = creditScore.getCreditScore(borrower);
        uint256 adjustment = onTime ? 5 : 0; // +5 for on-time payment
        uint256 newScore = currentScore + adjustment;
        if (newScore > 1000) newScore = 1000;
        creditScore.updateCreditScore(borrower, newScore);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets loan details
     * @param loanId Loan identifier
     * @return Loan struct
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @notice Gets all loans for a borrower
     * @param borrower Borrower address
     * @return Array of loan IDs
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    /**
     * @notice Checks if payment is late
     * @param loanId Loan identifier
     * @return isLate Whether payment is late
     * @return daysLate Number of days late
     */
    function isPaymentLate(uint256 loanId) external view returns (bool isLate, uint256 daysLate) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.Active) return (false, 0);

        if (block.timestamp > loan.nextPaymentDue + GRACE_PERIOD) {
            isLate = true;
            daysLate = (block.timestamp - loan.nextPaymentDue) / 1 days;
        }
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pauses all loan operations
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses loan operations
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Cancels a pending loan
     * @param loanId Loan identifier
     */
    function cancelLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];

        if (loan.borrower != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert("Unauthorized");
        }
        if (loan.status != LoanStatus.Pending) revert LoanNotPending();

        loan.status = LoanStatus.Cancelled;

        emit LoanCancelled(loanId, loan.borrower);
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

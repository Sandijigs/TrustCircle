// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LendingPool
 * @notice Main lending pool contract for TrustCircle platform
 * @dev Manages deposits, withdrawals, liquidity, and dynamic interest rates
 *
 * INTEREST RATE MODEL:
 * - Base Rate: 5% APY
 * - Optimal Utilization: 80%
 * - If utilization < 80%: APY = 5% + (utilization/80%) * 10%
 * - If utilization >= 80%: APY = 15% + ((utilization-80%)/20%) * 40%
 *
 * SECURITY FEATURES:
 * - ReentrancyGuard: Prevents reentrancy attacks
 * - Pausable: Emergency pause functionality
 * - AccessControl: Role-based permissions
 * - UUPS Upgradeable: Allows contract upgrades
 */
contract LendingPool is
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
    bytes32 public constant LOAN_MANAGER_ROLE = keccak256("LOAN_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant BASE_RATE = 500; // 5% in basis points
    uint256 public constant OPTIMAL_UTILIZATION = 8000; // 80% in basis points
    uint256 public constant SLOPE1 = 1000; // 10% in basis points (0-80% utilization)
    uint256 public constant SLOPE2 = 4000; // 40% in basis points (80-100% utilization)
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant RESERVE_FACTOR = 1000; // 10% of pool kept as reserve
    uint256 public constant MIN_DEPOSIT = 1e18; // Minimum 1 token deposit

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    struct PoolData {
        IERC20 asset;                    // Stablecoin address (cUSD, cEUR, cREAL)
        uint256 totalDeposits;           // Total deposits in pool
        uint256 totalBorrowed;           // Total amount borrowed from pool
        uint256 totalReserves;           // Reserves accumulated from fees
        uint256 totalShares;             // Total LP shares issued
        uint256 lastUpdateTimestamp;     // Last interest update timestamp
        uint256 accumulatedInterest;     // Total interest accumulated
        bool isActive;                   // Pool active status
    }

    struct UserDeposit {
        uint256 shares;                  // LP token shares
        uint256 lastDepositTime;         // Last deposit timestamp
        uint256 totalDeposited;          // Lifetime deposits
        uint256 totalWithdrawn;          // Lifetime withdrawals
    }

    // Mapping: token address => PoolData
    mapping(address => PoolData) public pools;

    // Mapping: user => token => UserDeposit
    mapping(address => mapping(address => UserDeposit)) public userDeposits;

    // Array of supported tokens
    address[] public supportedTokens;

    // Mapping: token => is whitelisted
    mapping(address => bool) public isWhitelisted;

    // Interest accrual state per pool
    struct InterestState {
        uint256 borrowIndex;         // Cumulative borrow interest index
        uint256 lastAccrualBlock;    // Last block interest was accrued
    }
    mapping(address => InterestState) public interestState;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event PoolCreated(address indexed asset, string symbol);
    event Deposited(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 shares
    );
    event Withdrawn(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 shares
    );
    event LoanDisbursed(
        address indexed borrower,
        address indexed asset,
        uint256 amount,
        uint256 loanId
    );
    event LoanRepaid(
        address indexed borrower,
        address indexed asset,
        uint256 amount,
        uint256 interest
    );
    event InterestRateUpdated(
        address indexed asset,
        uint256 newRate,
        uint256 utilization
    );
    event ReservesWithdrawn(address indexed asset, uint256 amount);
    event TokenWhitelisted(address indexed asset, bool status);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error PoolNotActive();
    error PoolAlreadyExists();
    error InsufficientLiquidity();
    error InvalidAmount();
    error InvalidAsset();
    error MinimumDepositNotMet();
    error WithdrawalExceedsBalance();
    error UnauthorizedLoanManager();
    error TokenNotWhitelisted();

    /*//////////////////////////////////////////////////////////////
                              INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the LendingPool contract
     * @param admin Address to be granted admin role
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adds a token to the whitelist
     * @param asset Address of the token to whitelist
     * @dev Only callable by admin - restricts to approved Mento stablecoins
     */
    function whitelistToken(address asset, bool status) external onlyRole(ADMIN_ROLE) {
        if (asset == address(0)) revert InvalidAsset();
        isWhitelisted[asset] = status;
        emit TokenWhitelisted(asset, status);
    }

    /**
     * @notice Creates a new lending pool for a stablecoin
     * @param asset Address of the stablecoin (cUSD, cEUR, cREAL)
     * @dev Only callable by admin, token must be whitelisted
     */
    function createPool(address asset) external onlyRole(ADMIN_ROLE) {
        if (pools[asset].isActive) revert PoolAlreadyExists();
        if (asset == address(0)) revert InvalidAsset();
        if (!isWhitelisted[asset]) revert TokenNotWhitelisted();

        pools[asset] = PoolData({
            asset: IERC20(asset),
            totalDeposits: 0,
            totalBorrowed: 0,
            totalReserves: 0,
            totalShares: 0,
            lastUpdateTimestamp: block.timestamp,
            accumulatedInterest: 0,
            isActive: true
        });

        // Initialize interest state
        interestState[asset] = InterestState({
            borrowIndex: 1e18,  // Start with 1.0 scaled by 1e18
            lastAccrualBlock: block.number
        });

        supportedTokens.push(asset);

        emit PoolCreated(asset, _getTokenSymbol(asset));
    }

    /**
     * @notice Pauses all pool operations
     * @dev Only callable by pauser role
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses pool operations
     * @dev Only callable by pauser role
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Withdraws accumulated reserves
     * @param asset Address of the stablecoin
     * @param amount Amount to withdraw
     * @param recipient Address to receive reserves
     */
    function withdrawReserves(
        address asset,
        uint256 amount,
        address recipient
    ) external onlyRole(ADMIN_ROLE) {
        PoolData storage pool = pools[asset];
        if (!pool.isActive) revert PoolNotActive();
        if (amount > pool.totalReserves) revert InsufficientLiquidity();

        pool.totalReserves -= amount;
        pool.asset.safeTransfer(recipient, amount);

        emit ReservesWithdrawn(asset, amount);
    }

    /*//////////////////////////////////////////////////////////////
                          DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposits stablecoins into the lending pool
     * @param asset Address of the stablecoin
     * @param amount Amount to deposit
     * @return shares LP shares minted
     *
     * @dev Mints LP shares based on current pool ratio
     * Formula: shares = (amount * totalShares) / totalDeposits
     * For first deposit: shares = amount
     */
    function deposit(address asset, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        if (amount < MIN_DEPOSIT) revert MinimumDepositNotMet();

        PoolData storage pool = pools[asset];
        if (!pool.isActive) revert PoolNotActive();

        // Update interest before deposit
        _updatePoolInterest(asset);

        // Calculate shares to mint
        if (pool.totalShares == 0) {
            // First deposit: 1:1 ratio
            shares = amount;
        } else {
            // Subsequent deposits: proportional to pool
            shares = (amount * pool.totalShares) / _getPoolValue(asset);
        }

        // Update pool state
        pool.totalDeposits += amount;
        pool.totalShares += shares;

        // Update user deposit
        UserDeposit storage userDeposit = userDeposits[msg.sender][asset];
        userDeposit.shares += shares;
        userDeposit.lastDepositTime = block.timestamp;
        userDeposit.totalDeposited += amount;

        // Transfer tokens from user
        pool.asset.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, asset, amount, shares);
    }

    /*//////////////////////////////////////////////////////////////
                         WITHDRAWAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws stablecoins from the lending pool
     * @param asset Address of the stablecoin
     * @param shares Amount of LP shares to redeem
     * @return amount Amount of tokens withdrawn
     *
     * @dev Burns LP shares and returns proportional assets
     * Formula: amount = (shares * poolValue) / totalShares
     */
    function withdraw(address asset, uint256 shares)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 amount)
    {
        if (shares == 0) revert InvalidAmount();

        PoolData storage pool = pools[asset];
        if (!pool.isActive) revert PoolNotActive();

        UserDeposit storage userDeposit = userDeposits[msg.sender][asset];
        if (shares > userDeposit.shares) revert WithdrawalExceedsBalance();

        // Update interest before withdrawal
        _updatePoolInterest(asset);

        // Calculate amount to withdraw
        uint256 poolValue = _getPoolValue(asset);
        amount = (shares * poolValue) / pool.totalShares;

        // Check liquidity (must maintain reserve ratio)
        uint256 availableLiquidity = _getAvailableLiquidity(asset);
        if (amount > availableLiquidity) revert InsufficientLiquidity();

        // Update pool state
        pool.totalDeposits -= amount;
        pool.totalShares -= shares;

        // Update user deposit
        userDeposit.shares -= shares;
        userDeposit.totalWithdrawn += amount;

        // Transfer tokens to user
        pool.asset.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, asset, amount, shares);
    }

    /*//////////////////////////////////////////////////////////////
                        LOAN MANAGER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Disburses a loan from the pool
     * @param asset Address of the stablecoin
     * @param borrower Address of the borrower
     * @param amount Loan amount
     * @param loanId Unique loan identifier
     * @dev Only callable by LoanManager contract
     */
    function disburseLoan(
        address asset,
        address borrower,
        uint256 amount,
        uint256 loanId
    ) external onlyRole(LOAN_MANAGER_ROLE) nonReentrant whenNotPaused {
        PoolData storage pool = pools[asset];
        if (!pool.isActive) revert PoolNotActive();

        // Update interest before disbursement
        _updatePoolInterest(asset);

        // Check liquidity
        uint256 availableLiquidity = _getAvailableLiquidity(asset);
        if (amount > availableLiquidity) revert InsufficientLiquidity();

        // Update pool state
        pool.totalBorrowed += amount;

        // Transfer loan to borrower
        pool.asset.safeTransfer(borrower, amount);

        emit LoanDisbursed(borrower, asset, amount, loanId);
    }

    /**
     * @notice Processes loan repayment
     * @param asset Address of the stablecoin
     * @param borrower Address of the borrower
     * @param principal Principal amount repaid
     * @param interest Interest amount paid
     * @dev Only callable by LoanManager contract
     */
    function repayLoan(
        address asset,
        address borrower,
        uint256 principal,
        uint256 interest
    ) external onlyRole(LOAN_MANAGER_ROLE) nonReentrant {
        PoolData storage pool = pools[asset];
        if (!pool.isActive) revert PoolNotActive();

        // Update interest
        _updatePoolInterest(asset);

        // Update pool state
        pool.totalBorrowed -= principal;
        pool.accumulatedInterest += interest;

        // Allocate reserves (10% of interest)
        uint256 reserveAmount = (interest * RESERVE_FACTOR) / BASIS_POINTS;
        pool.totalReserves += reserveAmount;

        // Rest goes to depositors (increases pool value)
        uint256 depositorInterest = interest - reserveAmount;
        pool.totalDeposits += depositorInterest;

        emit LoanRepaid(borrower, asset, principal, interest);
    }

    /*//////////////////////////////////////////////////////////////
                         INTEREST RATE LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculates current borrow APY for a pool
     * @param asset Address of the stablecoin
     * @return borrowAPY Annual percentage yield in basis points
     *
     * FORMULA:
     * utilization = totalBorrowed / totalDeposits
     *
     * If utilization < 80%:
     *   APY = 5% + (utilization / 80%) * 10%
     *
     * If utilization >= 80%:
     *   APY = 15% + ((utilization - 80%) / 20%) * 40%
     *
     * This creates a kinked interest rate curve that incentivizes
     * liquidity provision when utilization is high
     */
    function calculateBorrowAPY(address asset)
        public
        view
        returns (uint256 borrowAPY)
    {
        PoolData storage pool = pools[asset];

        if (pool.totalDeposits == 0) {
            return BASE_RATE;
        }

        // Calculate utilization rate (in basis points)
        uint256 utilization = (pool.totalBorrowed * BASIS_POINTS) / pool.totalDeposits;

        if (utilization <= OPTIMAL_UTILIZATION) {
            // Below optimal: gradual increase
            // APY = BASE_RATE + (utilization / OPTIMAL_UTILIZATION) * SLOPE1
            borrowAPY = BASE_RATE +
                (utilization * SLOPE1) / OPTIMAL_UTILIZATION;
        } else {
            // Above optimal: steep increase
            // APY = BASE_RATE + SLOPE1 + ((utilization - OPTIMAL) / (MAX - OPTIMAL)) * SLOPE2
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            uint256 maxExcessUtilization = BASIS_POINTS - OPTIMAL_UTILIZATION;

            borrowAPY = BASE_RATE + SLOPE1 +
                (excessUtilization * SLOPE2) / maxExcessUtilization;
        }
    }

    /**
     * @notice Calculates current lender APY (what depositors earn)
     * @param asset Address of the stablecoin
     * @return lenderAPY Annual percentage yield in basis points
     *
     * Lender APY = Borrow APY * Utilization * (1 - Reserve Factor)
     */
    function calculateLenderAPY(address asset)
        public
        view
        returns (uint256 lenderAPY)
    {
        PoolData storage pool = pools[asset];

        if (pool.totalDeposits == 0) {
            return 0;
        }

        uint256 utilization = (pool.totalBorrowed * BASIS_POINTS) / pool.totalDeposits;
        uint256 borrowAPY = calculateBorrowAPY(asset);

        // Lender gets: borrowAPY * utilization * (1 - reserveFactor)
        lenderAPY = (borrowAPY * utilization * (BASIS_POINTS - RESERVE_FACTOR))
                    / (BASIS_POINTS * BASIS_POINTS);
    }

    /**
     * @notice Updates accumulated interest for a pool with improved precision
     * @param asset Address of the stablecoin
     * @dev Called before any pool state change. Uses block-based accrual for better accuracy
     */
    function _updatePoolInterest(address asset) internal {
        PoolData storage pool = pools[asset];
        InterestState storage state = interestState[asset];

        // Check if update needed
        if (block.number <= state.lastAccrualBlock) {
            return;
        }

        if (pool.totalBorrowed == 0) {
            pool.lastUpdateTimestamp = block.timestamp;
            state.lastAccrualBlock = block.number;
            return;
        }

        // Calculate blocks elapsed
        uint256 blocksDelta = block.number - state.lastAccrualBlock;

        // Calculate borrow rate per block (APY / blocks per year)
        // Assuming ~5 second blocks on Celo: 365 * 24 * 60 * 60 / 5 = 6,307,200 blocks/year
        uint256 BLOCKS_PER_YEAR = 6307200;
        uint256 borrowAPY = calculateBorrowAPY(asset);
        uint256 borrowRatePerBlock = (borrowAPY * 1e18) / (BLOCKS_PER_YEAR * BASIS_POINTS);

        // Update borrow index: index = index * (1 + rate * blocks)
        uint256 interestFactor = 1e18 + (borrowRatePerBlock * blocksDelta);
        uint256 newBorrowIndex = (state.borrowIndex * interestFactor) / 1e18;

        // Calculate interest accrued
        uint256 interestAccrued = (pool.totalBorrowed * (newBorrowIndex - state.borrowIndex)) / 1e18;

        // Update state
        state.borrowIndex = newBorrowIndex;
        state.lastAccrualBlock = block.number;
        pool.accumulatedInterest += interestAccrued;
        pool.lastUpdateTimestamp = block.timestamp;

        // Emit event
        uint256 utilization = (pool.totalBorrowed * BASIS_POINTS) / pool.totalDeposits;
        emit InterestRateUpdated(asset, borrowAPY, utilization);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets total value of a pool (deposits + accrued interest)
     * @param asset Address of the stablecoin
     * @return Total pool value
     */
    function _getPoolValue(address asset) internal view returns (uint256) {
        PoolData storage pool = pools[asset];
        return pool.totalDeposits + pool.accumulatedInterest;
    }

    /**
     * @notice Gets available liquidity (accounting for reserve ratio)
     * @param asset Address of the stablecoin
     * @return Available liquidity for borrowing/withdrawal
     */
    function _getAvailableLiquidity(address asset) internal view returns (uint256) {
        PoolData storage pool = pools[asset];
        uint256 totalLiquidity = pool.totalDeposits - pool.totalBorrowed;
        uint256 reserveRequired = (pool.totalDeposits * RESERVE_FACTOR) / BASIS_POINTS;

        if (totalLiquidity <= reserveRequired) {
            return 0;
        }

        return totalLiquidity - reserveRequired;
    }

    /**
     * @notice Gets pool utilization rate
     * @param asset Address of the stablecoin
     * @return Utilization in basis points
     */
    function getUtilizationRate(address asset) external view returns (uint256) {
        PoolData storage pool = pools[asset];
        if (pool.totalDeposits == 0) return 0;
        return (pool.totalBorrowed * BASIS_POINTS) / pool.totalDeposits;
    }

    /**
     * @notice Gets user's share value in a pool
     * @param user User address
     * @param asset Asset address
     * @return value Value of user's shares
     */
    function getUserShareValue(address user, address asset)
        external
        view
        returns (uint256 value)
    {
        PoolData storage pool = pools[asset];
        UserDeposit storage userDeposit = userDeposits[user][asset];

        if (pool.totalShares == 0) return 0;

        uint256 poolValue = _getPoolValue(asset);
        value = (userDeposit.shares * poolValue) / pool.totalShares;
    }

    /**
     * @notice Gets list of all supported tokens
     * @return Array of token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @notice Gets pool data for a specific asset
     * @param asset Asset address
     * @return Pool data struct
     */
    function getPoolData(address asset) external view returns (PoolData memory) {
        return pools[asset];
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Gets token symbol (helper function)
     * @param asset Token address
     * @return symbol Token symbol
     */
    function _getTokenSymbol(address asset) internal view returns (string memory symbol) {
        // Attempt to get symbol, fallback to "UNKNOWN"
        try IERC20Metadata(asset).symbol() returns (string memory s) {
            symbol = s;
        } catch {
            symbol = "UNKNOWN";
        }
    }

    /**
     * @notice Authorizes contract upgrades
     * @param newImplementation Address of new implementation
     * @dev Only callable by admin
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}
}

/**
 * @notice Minimal ERC20 metadata interface
 */
interface IERC20Metadata {
    function symbol() external view returns (string memory);
}

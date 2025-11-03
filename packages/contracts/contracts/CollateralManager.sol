// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CollateralManager
 * @notice Manages collateral deposits and liquidations for TrustCircle loans
 * @dev Supports both ERC20 tokens and ERC721 NFTs as collateral
 *
 * COLLATERAL TYPES:
 * - ERC20 tokens (e.g., CELO, other stablecoins)
 * - ERC721 NFTs (digital assets)
 *
 * COLLATERALIZATION RATIOS:
 * - Under-collateralized: 50% LTV
 * - Fully-collateralized: 100% LTV
 * - Over-collateralized: 150% LTV
 *
 * LIQUIDATION:
 * - Triggered when loan defaults
 * - Collateral sold to recover loan principal
 * - Remaining collateral returned to borrower
 */
contract CollateralManager is
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
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_COLLATERAL_RATIO = 5000; // 50% LTV
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% LTV
    uint256 public constant LIQUIDATION_BONUS = 500; // 5% bonus for liquidators

    /*//////////////////////////////////////////////////////////////
                                  ENUMS
    //////////////////////////////////////////////////////////////*/

    enum CollateralType {
        ERC20,
        ERC721
    }

    enum CollateralStatus {
        Pending,
        Locked,
        Released,
        Liquidated
    }

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Collateral {
        uint256 id;
        uint256 loanId;
        address borrower;
        CollateralType collateralType;
        address assetAddress;
        uint256 tokenIdOrAmount; // Token ID for NFT, amount for ERC20
        uint256 valuationUSD;    // Estimated value in USD (18 decimals)
        uint256 depositedAt;
        CollateralStatus status;
    }

    struct AssetPrice {
        uint256 priceUSD;        // Price in USD (18 decimals)
        uint256 lastUpdated;
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public nextCollateralId;

    // Mapping: collateralId => Collateral
    mapping(uint256 => Collateral) public collaterals;

    // Mapping: loanId => collateralId
    mapping(uint256 => uint256) public loanCollateral;

    // Mapping: borrower => collateralIds[]
    mapping(address => uint256[]) public borrowerCollaterals;

    // Mapping: asset => AssetPrice (for ERC20 collateral)
    mapping(address => AssetPrice) public assetPrices;

    // Mapping: NFT contract => tokenId => valuation
    mapping(address => mapping(uint256 => uint256)) public nftValuations;

    // Supported collateral assets
    mapping(address => bool) public supportedAssets;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CollateralDeposited(
        uint256 indexed collateralId,
        uint256 indexed loanId,
        address indexed borrower,
        CollateralType collateralType,
        address asset,
        uint256 amount
    );
    event CollateralLocked(uint256 indexed collateralId);
    event CollateralReleased(uint256 indexed collateralId, address indexed borrower);
    event CollateralLiquidated(
        uint256 indexed collateralId,
        uint256 indexed loanId,
        address indexed liquidator,
        uint256 recoveredAmount
    );
    event AssetPriceUpdated(address indexed asset, uint256 newPrice);
    event NFTValuationSet(address indexed nftContract, uint256 tokenId, uint256 valuation);
    event AssetAdded(address indexed asset, CollateralType collateralType);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidCollateralId();
    error CollateralAlreadyLocked();
    error CollateralNotLocked();
    error UnauthorizedLiquidation();
    error InsufficientCollateralValue();
    error UnsupportedAsset();
    error InvalidPrice();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the CollateralManager contract
     * @param admin Address to be granted admin role
     */
    function initialize(address admin) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(LIQUIDATOR_ROLE, admin);

        nextCollateralId = 1;
    }

    /*//////////////////////////////////////////////////////////////
                     COLLATERAL DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deposit ERC20 tokens as collateral
     * @param loanId Associated loan identifier
     * @param asset ERC20 token address
     * @param amount Amount of tokens
     * @return collateralId Unique collateral identifier
     */
    function depositERC20Collateral(
        uint256 loanId,
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (uint256 collateralId) {
        if (!supportedAssets[asset]) revert UnsupportedAsset();
        if (amount == 0) revert InsufficientCollateralValue();

        // Transfer collateral to this contract
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Calculate USD valuation
        uint256 valuationUSD = _calculateERC20Value(asset, amount);

        // Create collateral record
        collateralId = nextCollateralId++;

        collaterals[collateralId] = Collateral({
            id: collateralId,
            loanId: loanId,
            borrower: msg.sender,
            collateralType: CollateralType.ERC20,
            assetAddress: asset,
            tokenIdOrAmount: amount,
            valuationUSD: valuationUSD,
            depositedAt: block.timestamp,
            status: CollateralStatus.Pending
        });

        loanCollateral[loanId] = collateralId;
        borrowerCollaterals[msg.sender].push(collateralId);

        emit CollateralDeposited(
            collateralId,
            loanId,
            msg.sender,
            CollateralType.ERC20,
            asset,
            amount
        );
    }

    /**
     * @notice Deposit ERC721 NFT as collateral
     * @param loanId Associated loan identifier
     * @param nftContract NFT contract address
     * @param tokenId NFT token ID
     * @param valuation Proposed valuation in USD (must be set by oracle/admin)
     * @return collateralId Unique collateral identifier
     */
    function depositERC721Collateral(
        uint256 loanId,
        address nftContract,
        uint256 tokenId,
        uint256 valuation
    ) external nonReentrant whenNotPaused returns (uint256 collateralId) {
        if (!supportedAssets[nftContract]) revert UnsupportedAsset();

        // Verify NFT ownership
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not NFT owner"
        );

        // Use stored valuation or provided valuation
        uint256 valuationUSD = nftValuations[nftContract][tokenId];
        if (valuationUSD == 0) {
            valuationUSD = valuation;
            require(valuationUSD > 0, "Valuation required");
        }

        // Transfer NFT to this contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        // Create collateral record
        collateralId = nextCollateralId++;

        collaterals[collateralId] = Collateral({
            id: collateralId,
            loanId: loanId,
            borrower: msg.sender,
            collateralType: CollateralType.ERC721,
            assetAddress: nftContract,
            tokenIdOrAmount: tokenId,
            valuationUSD: valuationUSD,
            depositedAt: block.timestamp,
            status: CollateralStatus.Pending
        });

        loanCollateral[loanId] = collateralId;
        borrowerCollaterals[msg.sender].push(collateralId);

        emit CollateralDeposited(
            collateralId,
            loanId,
            msg.sender,
            CollateralType.ERC721,
            nftContract,
            tokenId
        );
    }

    /*//////////////////////////////////////////////////////////////
                     COLLATERAL MANAGEMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Locks collateral when loan is disbursed
     * @param borrower Borrower address
     * @param loanId Loan identifier
     * @dev Only callable by LoanManager
     */
    function lockCollateral(address borrower, uint256 loanId)
        external
        onlyRole(LOAN_MANAGER_ROLE)
    {
        uint256 collateralId = loanCollateral[loanId];
        if (collateralId == 0) return; // No collateral for this loan

        Collateral storage collateral = collaterals[collateralId];

        if (collateral.borrower != borrower) revert InvalidCollateralId();
        if (collateral.status != CollateralStatus.Pending) {
            revert CollateralAlreadyLocked();
        }

        collateral.status = CollateralStatus.Locked;

        emit CollateralLocked(collateralId);
    }

    /**
     * @notice Releases collateral when loan is repaid
     * @param borrower Borrower address
     * @param loanId Loan identifier
     * @dev Only callable by LoanManager
     */
    function releaseCollateral(address borrower, uint256 loanId)
        external
        onlyRole(LOAN_MANAGER_ROLE)
        nonReentrant
    {
        uint256 collateralId = loanCollateral[loanId];
        if (collateralId == 0) return; // No collateral for this loan

        Collateral storage collateral = collaterals[collateralId];

        if (collateral.borrower != borrower) revert InvalidCollateralId();
        if (collateral.status != CollateralStatus.Locked) {
            revert CollateralNotLocked();
        }

        collateral.status = CollateralStatus.Released;

        // Return collateral to borrower
        if (collateral.collateralType == CollateralType.ERC20) {
            IERC20(collateral.assetAddress).safeTransfer(
                borrower,
                collateral.tokenIdOrAmount
            );
        } else {
            IERC721(collateral.assetAddress).transferFrom(
                address(this),
                borrower,
                collateral.tokenIdOrAmount
            );
        }

        emit CollateralReleased(collateralId, borrower);
    }

    /**
     * @notice Liquidates collateral on loan default
     * @param borrower Borrower address
     * @param loanId Loan identifier
     * @return recoveredAmount Amount recovered from liquidation
     * @dev Only callable by LoanManager or Liquidator role
     */
    function liquidateCollateral(address borrower, uint256 loanId)
        external
        onlyRole(LOAN_MANAGER_ROLE)
        nonReentrant
        returns (uint256 recoveredAmount)
    {
        uint256 collateralId = loanCollateral[loanId];
        if (collateralId == 0) return 0; // No collateral to liquidate

        Collateral storage collateral = collaterals[collateralId];

        if (collateral.borrower != borrower) revert InvalidCollateralId();
        if (collateral.status != CollateralStatus.Locked) {
            revert UnauthorizedLiquidation();
        }

        collateral.status = CollateralStatus.Liquidated;

        // Calculate recovery amount (with liquidation bonus)
        recoveredAmount = (collateral.valuationUSD * (BASIS_POINTS + LIQUIDATION_BONUS))
                         / BASIS_POINTS;

        // Transfer collateral to liquidator/protocol
        // In a real system, this would trigger an auction or DEX swap
        // For now, we transfer to admin for manual handling
        if (collateral.collateralType == CollateralType.ERC20) {
            IERC20(collateral.assetAddress).safeTransfer(
                msg.sender,
                collateral.tokenIdOrAmount
            );
        } else {
            IERC721(collateral.assetAddress).transferFrom(
                address(this),
                msg.sender,
                collateral.tokenIdOrAmount
            );
        }

        emit CollateralLiquidated(collateralId, loanId, msg.sender, recoveredAmount);
    }

    /*//////////////////////////////////////////////////////////////
                        VALUATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Calculates collateralization ratio
     * @param loanId Loan identifier
     * @param loanAmount Loan amount in USD
     * @return ratio Collateralization ratio in basis points
     */
    function getCollateralizationRatio(uint256 loanId, uint256 loanAmount)
        external
        view
        returns (uint256 ratio)
    {
        uint256 collateralId = loanCollateral[loanId];
        if (collateralId == 0) return 0;

        Collateral storage collateral = collaterals[collateralId];

        if (loanAmount == 0) return 0;

        // Ratio = (collateralValue / loanAmount) * 10000
        ratio = (collateral.valuationUSD * BASIS_POINTS) / loanAmount;
    }

    /**
     * @notice Checks if loan has sufficient collateral
     * @param borrower Borrower address
     * @param loanId Loan identifier
     * @return True if collateral exists
     */
    function hasCollateral(address borrower, uint256 loanId)
        external
        view
        returns (bool)
    {
        uint256 collateralId = loanCollateral[loanId];
        if (collateralId == 0) return false;

        Collateral storage collateral = collaterals[collateralId];
        return collateral.borrower == borrower &&
               collateral.status == CollateralStatus.Pending;
    }

    /**
     * @notice Calculates ERC20 token value in USD
     * @param asset Token address
     * @param amount Token amount
     * @return valueUSD Value in USD (18 decimals)
     */
    function _calculateERC20Value(address asset, uint256 amount)
        internal
        view
        returns (uint256 valueUSD)
    {
        AssetPrice storage price = assetPrices[asset];
        require(price.isActive, "Price not available");

        // valueUSD = (amount * priceUSD) / 1e18
        valueUSD = (amount * price.priceUSD) / 1e18;
    }

    /*//////////////////////////////////////////////////////////////
                      PRICE ORACLE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates asset price (oracle/admin function)
     * @param asset Asset address
     * @param priceUSD Price in USD (18 decimals)
     */
    function updateAssetPrice(address asset, uint256 priceUSD)
        external
        onlyRole(ADMIN_ROLE)
    {
        if (priceUSD == 0) revert InvalidPrice();

        assetPrices[asset] = AssetPrice({
            priceUSD: priceUSD,
            lastUpdated: block.timestamp,
            isActive: true
        });

        emit AssetPriceUpdated(asset, priceUSD);
    }

    /**
     * @notice Sets NFT valuation
     * @param nftContract NFT contract address
     * @param tokenId Token ID
     * @param valuationUSD Valuation in USD (18 decimals)
     */
    function setNFTValuation(
        address nftContract,
        uint256 tokenId,
        uint256 valuationUSD
    ) external onlyRole(ADMIN_ROLE) {
        nftValuations[nftContract][tokenId] = valuationUSD;

        emit NFTValuationSet(nftContract, tokenId, valuationUSD);
    }

    /**
     * @notice Adds supported collateral asset
     * @param asset Asset address
     * @param collateralType Type of collateral (ERC20 or ERC721)
     */
    function addSupportedAsset(address asset, CollateralType collateralType)
        external
        onlyRole(ADMIN_ROLE)
    {
        supportedAssets[asset] = true;

        emit AssetAdded(asset, collateralType);
    }

    /**
     * @notice Removes supported asset
     * @param asset Asset address
     */
    function removeSupportedAsset(address asset) external onlyRole(ADMIN_ROLE) {
        supportedAssets[asset] = false;
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getCollateral(uint256 collateralId)
        external
        view
        returns (Collateral memory)
    {
        return collaterals[collateralId];
    }

    function getBorrowerCollaterals(address borrower)
        external
        view
        returns (uint256[] memory)
    {
        return borrowerCollaterals[borrower];
    }

    function getLoanCollateralId(uint256 loanId) external view returns (uint256) {
        return loanCollateral[loanId];
    }

    function getAssetPrice(address asset) external view returns (AssetPrice memory) {
        return assetPrices[asset];
    }

    function getNFTValuation(address nftContract, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return nftValuations[nftContract][tokenId];
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}
}

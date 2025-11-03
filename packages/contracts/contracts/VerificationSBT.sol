// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title VerificationSBT
 * @notice Soul Bound Token (SBT) for identity verification in TrustCircle
 * @dev Non-transferable NFT representing user's verification status
 *
 * VERIFICATION LEVELS:
 * 0 - None: No verification
 * 1 - Basic: Email/phone verified
 * 2 - Verified: KYC completed (ID documents)
 * 3 - Trusted: Enhanced verification (video call, proof of address)
 *
 * SOUL BOUND:
 * - Tokens cannot be transferred (except by admin for recovery)
 * - One token per address
 * - Cannot be sold or traded
 * - Represents user's identity
 *
 * VERIFICATION PROVIDERS:
 * - World ID (Worldcoin)
 * - Holonym
 * - Gitcoin Passport
 * - Custom KYC provider
 */
contract VerificationSBT is
    Initializable,
    ERC721Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant LEVEL_NONE = 0;
    uint256 public constant LEVEL_BASIC = 1;
    uint256 public constant LEVEL_VERIFIED = 2;
    uint256 public constant LEVEL_TRUSTED = 3;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Verification {
        uint256 tokenId;
        address user;
        uint256 level;              // Verification level (0-3)
        uint256 verifiedAt;         // Verification timestamp
        uint256 expiresAt;          // Expiration timestamp (0 = never)
        string provider;            // Verification provider
        string verificationHash;    // Hash of verification data (privacy)
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public nextTokenId;

    // Mapping: tokenId => Verification
    mapping(uint256 => Verification) public verifications;

    // Mapping: user => tokenId (one token per user)
    mapping(address => uint256) public userToToken;

    // Mapping: user => isVerified
    mapping(address => bool) public isVerified;

    // Mapping: provider => isApproved
    mapping(string => bool) public approvedProviders;

    // Base URI for token metadata
    string private _baseTokenURI;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event VerificationMinted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 level,
        string provider
    );
    event VerificationLevelUpdated(
        uint256 indexed tokenId,
        uint256 oldLevel,
        uint256 newLevel
    );
    event VerificationRevoked(uint256 indexed tokenId, address indexed user);
    event ProviderApproved(string provider);
    event ProviderRemoved(string provider);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error AlreadyVerified();
    error NotVerified();
    error InvalidLevel();
    error TokenNotTransferable();
    error UnauthorizedProvider();
    error VerificationExpired();

    /*//////////////////////////////////////////////////////////////
                           INITIALIZATION
    //////////////////////////////////////////////////////////////*/

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the VerificationSBT contract
     * @param admin Address to be granted admin role
     */
    function initialize(address admin) public initializer {
        __ERC721_init("TrustCircle Verification", "TCVER");
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        nextTokenId = 1;

        // Approve default providers
        approvedProviders["WorldID"] = true;
        approvedProviders["Holonym"] = true;
        approvedProviders["GitcoinPassport"] = true;
        approvedProviders["Manual"] = true;
    }

    /*//////////////////////////////////////////////////////////////
                        MINTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mints a verification SBT
     * @param user User address to verify
     * @param level Verification level (1-3)
     * @param provider Verification provider name
     * @param verificationHash Hash of verification data
     * @param expiresAt Expiration timestamp (0 for never)
     * @return tokenId Token identifier
     * @dev Only callable by verifier role
     */
    function mint(
        address user,
        uint256 level,
        string calldata provider,
        string calldata verificationHash,
        uint256 expiresAt
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused returns (uint256 tokenId) {
        if (isVerified[user]) revert AlreadyVerified();
        if (level < LEVEL_BASIC || level > LEVEL_TRUSTED) revert InvalidLevel();
        if (!approvedProviders[provider]) revert UnauthorizedProvider();

        tokenId = nextTokenId++;

        // Mint SBT
        _safeMint(user, tokenId);

        // Store verification data
        verifications[tokenId] = Verification({
            tokenId: tokenId,
            user: user,
            level: level,
            verifiedAt: block.timestamp,
            expiresAt: expiresAt,
            provider: provider,
            verificationHash: verificationHash,
            isActive: true
        });

        userToToken[user] = tokenId;
        isVerified[user] = true;

        emit VerificationMinted(tokenId, user, level, provider);
    }

    /**
     * @notice Updates verification level
     * @param user User address
     * @param newLevel New verification level
     * @dev Allows upgrading or downgrading verification level
     */
    function updateLevel(address user, uint256 newLevel)
        external
        onlyRole(VERIFIER_ROLE)
    {
        if (!isVerified[user]) revert NotVerified();
        if (newLevel < LEVEL_BASIC || newLevel > LEVEL_TRUSTED) revert InvalidLevel();

        uint256 tokenId = userToToken[user];
        Verification storage verification = verifications[tokenId];

        uint256 oldLevel = verification.level;
        verification.level = newLevel;

        emit VerificationLevelUpdated(tokenId, oldLevel, newLevel);
    }

    /**
     * @notice Revokes verification
     * @param user User address
     * @dev Burns the SBT and removes verification status
     */
    function revoke(address user) external onlyRole(VERIFIER_ROLE) {
        if (!isVerified[user]) revert NotVerified();

        uint256 tokenId = userToToken[user];

        // Mark as inactive
        verifications[tokenId].isActive = false;
        isVerified[user] = false;

        // Burn token
        _burn(tokenId);

        emit VerificationRevoked(tokenId, user);
    }

    /*//////////////////////////////////////////////////////////////
                          QUERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if user is verified
     * @param user User address
     * @return True if verified and not expired
     */
    function isUserVerified(address user) external view returns (bool) {
        if (!isVerified[user]) return false;

        uint256 tokenId = userToToken[user];
        Verification storage verification = verifications[tokenId];

        // Check if expired
        if (verification.expiresAt > 0 && block.timestamp > verification.expiresAt) {
            return false;
        }

        return verification.isActive;
    }

    /**
     * @notice Gets user's verification level
     * @param user User address
     * @return level Verification level (0-3)
     */
    function getVerificationLevel(address user) external view returns (uint256 level) {
        if (!isVerified[user]) return LEVEL_NONE;

        uint256 tokenId = userToToken[user];
        Verification storage verification = verifications[tokenId];

        // Check if expired
        if (verification.expiresAt > 0 && block.timestamp > verification.expiresAt) {
            return LEVEL_NONE;
        }

        return verification.isActive ? verification.level : LEVEL_NONE;
    }

    /**
     * @notice Gets full verification data
     * @param user User address
     * @return Verification struct
     */
    function getVerification(address user)
        external
        view
        returns (Verification memory)
    {
        if (!isVerified[user]) revert NotVerified();
        uint256 tokenId = userToToken[user];
        return verifications[tokenId];
    }

    /**
     * @notice Gets verification by token ID
     * @param tokenId Token identifier
     * @return Verification struct
     */
    function getVerificationByTokenId(uint256 tokenId)
        external
        view
        returns (Verification memory)
    {
        return verifications[tokenId];
    }

    /**
     * @notice Checks if verification has expired
     * @param user User address
     * @return True if expired
     */
    function isExpired(address user) external view returns (bool) {
        if (!isVerified[user]) return false;

        uint256 tokenId = userToToken[user];
        Verification storage verification = verifications[tokenId];

        if (verification.expiresAt == 0) return false;

        return block.timestamp > verification.expiresAt;
    }

    /*//////////////////////////////////////////////////////////////
                       SOUL BOUND OVERRIDES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Overrides transferFrom to make token non-transferable
     * @dev Soul Bound Tokens cannot be transferred
     */
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert TokenNotTransferable();
    }

    /**
     * @notice Overrides safeTransferFrom to make token non-transferable
     * @dev Soul Bound Tokens cannot be transferred
     */
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert TokenNotTransferable();
    }

    /**
     * @notice Admin-only recovery transfer (for account recovery)
     * @param from Current owner
     * @param to New owner
     * @param tokenId Token to transfer
     * @dev Only admin can transfer (for account recovery scenarios)
     */
    function adminTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external onlyRole(ADMIN_ROLE) {
        require(ownerOf(tokenId) == from, "Invalid owner");
        require(!isVerified[to], "Recipient already verified");

        // Update mappings
        isVerified[from] = false;
        isVerified[to] = true;
        userToToken[to] = tokenId;
        delete userToToken[from];

        // Update verification data
        verifications[tokenId].user = to;

        // Transfer token
        _transfer(from, to, tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                        PROVIDER MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Approves a verification provider
     * @param provider Provider name
     */
    function approveProvider(string calldata provider)
        external
        onlyRole(ADMIN_ROLE)
    {
        approvedProviders[provider] = true;
        emit ProviderApproved(provider);
    }

    /**
     * @notice Removes a verification provider
     * @param provider Provider name
     */
    function removeProvider(string calldata provider)
        external
        onlyRole(ADMIN_ROLE)
    {
        approvedProviders[provider] = false;
        emit ProviderRemoved(provider);
    }

    /**
     * @notice Checks if provider is approved
     * @param provider Provider name
     * @return True if approved
     */
    function isProviderApproved(string calldata provider)
        external
        view
        returns (bool)
    {
        return approvedProviders[provider];
    }

    /*//////////////////////////////////////////////////////////////
                          METADATA FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets base URI for token metadata
     * @param baseURI Base URI string
     */
    function setBaseURI(string calldata baseURI) external onlyRole(ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }

    /**
     * @notice Returns base URI
     * @return Base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Returns token URI with verification level in metadata
     * @param tokenId Token identifier
     * @return Token URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        Verification storage verification = verifications[tokenId];

        // Return URI with level: baseURI/level/tokenId
        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        baseURI,
                        _toString(verification.level),
                        "/",
                        _toString(tokenId)
                    )
                )
                : "";
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pauses token minting
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses token minting
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Batch mint for verified users (migration)
     * @param users Array of user addresses
     * @param levels Array of verification levels
     * @param provider Provider name
     */
    function batchMint(
        address[] calldata users,
        uint256[] calldata levels,
        string calldata provider
    ) external onlyRole(ADMIN_ROLE) {
        require(users.length == levels.length, "Length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            if (!isVerified[users[i]] && levels[i] >= LEVEL_BASIC && levels[i] <= LEVEL_TRUSTED) {
                uint256 tokenId = nextTokenId++;

                _safeMint(users[i], tokenId);

                verifications[tokenId] = Verification({
                    tokenId: tokenId,
                    user: users[i],
                    level: levels[i],
                    verifiedAt: block.timestamp,
                    expiresAt: 0,
                    provider: provider,
                    verificationHash: "",
                    isActive: true
                });

                userToToken[users[i]] = tokenId;
                isVerified[users[i]] = true;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Converts uint to string
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
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}

    /**
     * @notice Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

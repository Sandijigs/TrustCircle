// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LPToken
 * @notice ERC20 token representing shares in a TrustCircle lending pool
 * @dev Minted when users deposit, burned when they withdraw
 *
 * IMPORTANT: This is a share token, not a rebasing token
 * - Balance stays constant
 * - Value per share increases as interest accrues
 * - Users redeem shares for underlying + interest
 *
 * Example:
 * 1. User deposits 1000 cUSD, gets 1000 LP tokens (1:1)
 * 2. Pool earns 100 cUSD interest
 * 3. User's 1000 LP tokens now redeemable for 1100 cUSD
 */
contract LPToken is ERC20, Ownable {
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the lending pool (only it can mint/burn)
    address public pool;

    /// @notice Address of the underlying asset (cUSD, cEUR, cREAL)
    address public underlying;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error OnlyPool();
    error PoolAlreadySet();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new LP token
     * @param name Token name (e.g., "TrustCircle cUSD Pool")
     * @param symbol Token symbol (e.g., "tcUSD")
     * @param underlyingAsset Address of underlying stablecoin
     */
    constructor(
        string memory name,
        string memory symbol,
        address underlyingAsset
    ) ERC20(name, symbol) Ownable(msg.sender) {
        underlying = underlyingAsset;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets the lending pool address
     * @param poolAddress Address of the lending pool
     * @dev Can only be set once by owner, then ownership renounced
     */
    function setPool(address poolAddress) external onlyOwner {
        if (pool != address(0)) revert PoolAlreadySet();
        pool = poolAddress;
    }

    /*//////////////////////////////////////////////////////////////
                          POOL-ONLY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mints LP tokens
     * @param to Address to receive tokens
     * @param amount Amount to mint
     * @dev Only callable by lending pool
     */
    function mint(address to, uint256 amount) external {
        if (msg.sender != pool) revert OnlyPool();
        _mint(to, amount);
    }

    /**
     * @notice Burns LP tokens
     * @param from Address to burn from
     * @param amount Amount to burn
     * @dev Only callable by lending pool
     */
    function burn(address from, uint256 amount) external {
        if (msg.sender != pool) revert OnlyPool();
        _burn(from, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ERC2981Upgradeable} from "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title PiAnimals721Base
/// @notice Shared base for PI ANIMALSDog and PI ANIMALSCat collections.
/// - ERC721 + Enumerable + URIStorage + 2981 royalties
/// - AccessControl: DEFAULT_ADMIN, MINTER, PAUSER
/// - Pausable + UUPS upgradeable
/// - Supply cap on Gen-0 enforced server-side via `mint` calldata; contract enforces a `maxSupply` ceiling.
abstract contract PiAnimals721Base is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public maxSupply;

    error SupplyCapReached();
    error ZeroAddress();

    function __PiAnimals721Base_init(
        string memory name_,
        string memory symbol_,
        address admin,
        address royaltyReceiver,
        uint96 royaltyFeeBps,
        uint256 maxSupply_
    ) internal onlyInitializing {
        if (admin == address(0) || royaltyReceiver == address(0)) revert ZeroAddress();

        __ERC721_init(name_, symbol_);
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC2981_init();
        __AccessControl_init();
        __Pausable_init();
        // UUPSUpgradeable has no init function in OpenZeppelin v5 (state-less).

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        _setDefaultRoyalty(royaltyReceiver, royaltyFeeBps);
        maxSupply = maxSupply_;
    }

    /// @notice Mint a new pet. Restricted to backend signer (MINTER_ROLE).
    function mint(address to, uint256 tokenId, string calldata tokenURI_) external whenNotPaused onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (totalSupply() >= maxSupply) revert SupplyCapReached();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setMaxSupply(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMax >= totalSupply(), "below current supply");
        maxSupply = newMax;
    }

    function setRoyalty(address receiver, uint96 feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeBps);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ----- multiple-inheritance overrides -----

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721URIStorageUpgradeable,
            ERC2981Upgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {Referrals} from "./Referrals.sol";

/**
 * @title Marketplace
 * @notice List an ERC-721 at a fixed price, buy it, or take it back off sale.
 *
 * @dev Two rules do most of the safety work here.
 *
 *      **The escrow is an approval, not a transfer.** A seller keeps their token
 *      while it is listed — the market only holds permission to move it. A market
 *      that takes custody has to be trusted not to lose it; this one cannot lose
 *      what it never held, and a seller who changes their mind can simply revoke
 *      the approval.
 *
 *      **Nobody is paid inside a sale.** Proceeds are credited and withdrawn
 *      later. Pushing ETH to the seller mid-purchase would hand a hostile seller
 *      contract the ability to re-enter, or to revert and take every buyer down
 *      with it. Pull payments make both impossible.
 */
contract Marketplace {
    struct Listing {
        address seller;
        uint256 price;
    }

    /// @notice collection → tokenId → listing. A price of zero means "not listed".
    mapping(address collection => mapping(uint256 tokenId => Listing)) public listings;

    /// @notice What each address can withdraw: sale proceeds, and the market's fees.
    mapping(address account => uint256 amount) public proceeds;

    address public owner;

    /// @notice Immutable, for the same reason as the fee: a registry the owner
    ///         could swap out is one nobody can rely on for a stream of earnings.
    Referrals public immutable referrals;

    /// @notice 2.5%, in basis points. Fixed at deployment: a market that can raise
    ///         its own cut after you list is a market you cannot price against.
    uint256 public constant FEE_BPS = 250;

    /// @notice The referrer's share **of the fee**, not of the sale: 10% of 2.5%.
    ///         It comes out of the market's cut, so the seller is paid the same
    ///         either way.
    uint256 public constant REFERRAL_BPS = 1_000;

    uint256 private constant BPS = 10_000;

    event Listed(
        address indexed seller,
        address indexed collection,
        uint256 indexed tokenId,
        uint256 price
    );
    event Sold(
        address indexed buyer,
        address indexed collection,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 fee
    );
    event Cancelled(address indexed seller, address indexed collection, uint256 indexed tokenId);
    event Withdrawn(address indexed to, uint256 amount);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotApproved();
    error NotListed();
    error AlreadyListed();
    error ZeroPrice();
    error WrongPrice(uint256 expected, uint256 sent);
    error OwnSale();
    error NothingToWithdraw();
    error TransferFailed();
    error ZeroAddress();

    constructor(address feeRecipient, address referralsRegistry) {
        if (feeRecipient == address(0) || referralsRegistry == address(0)) revert ZeroAddress();

        owner = feeRecipient;
        referrals = Referrals(referralsRegistry);
    }

    // -------------------------------------------------------------------- selling

    /**
     * @notice Put a token up for sale.
     * @dev The approval is checked here rather than assumed at purchase: finding
     *      out that a listing was never spendable *after* sending ETH is not a
     *      discovery a buyer should be asked to make.
     */
    function list(address collection, uint256 tokenId, uint256 price) external {
        if (price == 0) revert ZeroPrice();
        if (listings[collection][tokenId].price != 0) revert AlreadyListed();

        IERC721 nft = IERC721(collection);

        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();

        if (
            nft.getApproved(tokenId) != address(this) &&
            !nft.isApprovedForAll(msg.sender, address(this))
        ) revert NotApproved();

        listings[collection][tokenId] = Listing({seller: msg.sender, price: price});

        emit Listed(msg.sender, collection, tokenId, price);
    }

    function cancel(address collection, uint256 tokenId) external {
        Listing memory listing = listings[collection][tokenId];

        if (listing.price == 0) revert NotListed();
        if (listing.seller != msg.sender) revert NotOwner();

        delete listings[collection][tokenId];

        emit Cancelled(msg.sender, collection, tokenId);
    }

    // --------------------------------------------------------------------- buying

    /**
     * @notice Buy a listed token. Exact price only.
     * @dev The listing is deleted *before* the token moves. ERC-721 transfers can
     *      call back into the receiver, and a buyer contract that re-entered would
     *      otherwise find the listing still standing and buy it twice with one
     *      payment. Clearing state first is what makes that impossible.
     */
    function buy(address collection, uint256 tokenId, address referrer) external payable {
        Listing memory listing = listings[collection][tokenId];

        if (listing.price == 0) revert NotListed();
        if (listing.seller == msg.sender) revert OwnSale();
        if (msg.value != listing.price) revert WrongPrice(listing.price, msg.value);

        delete listings[collection][tokenId];

        referrals.record(msg.sender, referrer);

        uint256 fee = (msg.value * FEE_BPS) / BPS;
        uint256 referralCut = _payReferrer(fee);

        unchecked {
            // The seller is paid the same whether or not a referrer exists: the
            // reward comes out of the market's fee, never out of the sale.
            proceeds[listing.seller] += msg.value - fee;
            proceeds[owner] += fee - referralCut;
        }

        // transferFrom, not safeTransferFrom: the buyer chose to be here, and the
        // receiver hook is a callback we have no reason to invite into a sale.
        IERC721(collection).transferFrom(listing.seller, msg.sender, tokenId);

        emit Sold(msg.sender, collection, tokenId, listing.seller, msg.value, fee);
    }

    // ----------------------------------------------------------------- withdrawal

    function withdraw() external {
        uint256 amount = proceeds[msg.sender];

        if (amount == 0) revert NothingToWithdraw();

        // Zeroed before the call, or a re-entering seller could drain the balance
        // of everyone else's proceeds.
        proceeds[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function _payReferrer(uint256 fee) private returns (uint256 cut) {
        if (referrals.referrerOf(msg.sender) == address(0)) {
            return 0;
        }

        cut = (fee * REFERRAL_BPS) / BPS;

        referrals.credit{value: cut}(msg.sender);
    }

    /**
     * @notice Hand the fee stream to someone else.
     * @dev Fees already credited stay where they were credited — moving another
     *      address's balance would be theft, however well intentioned.
     */
    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    // ------------------------------------------------------------------- reading

    function listingOf(
        address collection,
        uint256 tokenId
    ) external view returns (address seller, uint256 price) {
        Listing memory listing = listings[collection][tokenId];
        return (listing.seller, listing.price);
    }

    /// @notice What a sale at this price would actually pay out.
    function quote(uint256 price) external pure returns (uint256 fee, uint256 toSeller) {
        fee = (price * FEE_BPS) / BPS;
        toSeller = price - fee;
    }
}

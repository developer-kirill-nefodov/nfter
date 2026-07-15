// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import {Referrals} from "./Referrals.sol";

contract Marketplace {
    struct Listing {
        address seller;
        uint256 price;
    }

    mapping(address collection => mapping(uint256 tokenId => Listing)) public listings;

    mapping(address account => uint256 amount) public proceeds;

    address public owner;

    Referrals public immutable referrals;

    uint256 public constant FEE_BPS = 250;

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

    function list(address collection, uint256 tokenId, uint256 price) external {
        if (price == 0) revert ZeroPrice();

        IERC721 nft = IERC721(collection);

        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();

        // Reject only a *live* listing this same owner already placed. A listing left behind by a
        // previous owner — who transferred the token (or let a buy revert at transferFrom) without
        // cancelling — must not brick the token: without this, the new owner can neither list
        // (AlreadyListed) nor cancel (NotOwner, they are not the recorded seller), and the token is
        // stuck forever. Establishing current ownership above lets us safely overwrite the stale one.
        Listing memory existing = listings[collection][tokenId];
        if (existing.price != 0 && existing.seller == msg.sender) revert AlreadyListed();

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

    function buy(address collection, uint256 tokenId, address referrer) external payable {
        Listing memory listing = listings[collection][tokenId];

        if (listing.price == 0) revert NotListed();
        if (listing.seller == msg.sender) revert OwnSale();
        if (msg.value != listing.price) revert WrongPrice(listing.price, msg.value);

        delete listings[collection][tokenId];

        // Only record when a referrer is actually supplied. `record` is onlyCaller; calling it on
        // every sale would let a revoked caller authorization brick all buys, referrer or not.
        if (referrer != address(0)) {
            referrals.record(msg.sender, referrer);
        }

        uint256 fee = (msg.value * FEE_BPS) / BPS;
        uint256 referralCut = _payReferrer(fee);

        unchecked {
            proceeds[listing.seller] += msg.value - fee;
            proceeds[owner] += fee - referralCut;
        }

        IERC721(collection).transferFrom(listing.seller, msg.sender, tokenId);

        emit Sold(msg.sender, collection, tokenId, listing.seller, msg.value, fee);
    }

    function withdraw() external {
        uint256 amount = proceeds[msg.sender];

        if (amount == 0) revert NothingToWithdraw();

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

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function listingOf(
        address collection,
        uint256 tokenId
    ) external view returns (address seller, uint256 price) {
        Listing memory listing = listings[collection][tokenId];
        return (listing.seller, listing.price);
    }

    function quote(uint256 price) external pure returns (uint256 fee, uint256 toSeller) {
        fee = (price * FEE_BPS) / BPS;
        toSeller = price - fee;
    }
}

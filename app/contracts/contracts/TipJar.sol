// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title TipJar
 * @notice Send ETH with a note attached. The owner withdraws whatever collects.
 *
 * @dev A plain wallet-to-wallet transfer would work too — but it leaves nothing
 *      an application can read. Routing tips through a contract means every one
 *      of them emits an event, so the feed of recent tips is a `queryFilter`
 *      away: no block explorer API key, no third-party indexer, no scraping.
 *
 *      Funds accumulate and are pulled out by the owner rather than being pushed
 *      onward on receipt. Forwarding inside `tip()` would hand a hostile
 *      recipient contract the ability to revert — and take every tipper down
 *      with it.
 */
contract TipJar {
    address public owner;

    uint256 public totalTips;
    uint256 public tipCount;

    event Tipped(address indexed from, uint256 amount, string message, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    error EmptyTip();
    error MessageTooLong();
    error NotOwner();
    error NothingToWithdraw();
    error TransferFailed();
    error ZeroAddress();

    uint256 public constant MAX_MESSAGE_LENGTH = 140;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnerChanged(address(0), initialOwner);
    }

    /**
     * @notice Tip the owner, optionally with a message.
     * @param message A note, up to 140 characters. Stored only in the event log,
     *                which is an order of magnitude cheaper than storage and is
     *                all a reader ever needs.
     */
    function tip(string calldata message) external payable {
        if (msg.value == 0) revert EmptyTip();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) revert MessageTooLong();

        unchecked {
            totalTips += msg.value;
            ++tipCount;
        }

        emit Tipped(msg.sender, msg.value, message, block.timestamp);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;

        if (amount == 0) revert NothingToWithdraw();

        // call, not transfer: the 2300-gas stipend has broken withdrawals for
        // every owner that happens to be a smart-contract wallet.
        (bool sent, ) = payable(owner).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit Withdrawn(owner, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    /// @dev A bare `send` with no message still counts as a tip.
    receive() external payable {
        if (msg.value == 0) revert EmptyTip();

        unchecked {
            totalTips += msg.value;
            ++tipCount;
        }

        emit Tipped(msg.sender, msg.value, "", block.timestamp);
    }
}

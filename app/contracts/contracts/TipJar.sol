// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

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

        (bool sent, ) = payable(owner).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit Withdrawn(owner, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {
        if (msg.value == 0) revert EmptyTip();

        unchecked {
            totalTips += msg.value;
            ++tipCount;
        }

        emit Tipped(msg.sender, msg.value, "", block.timestamp);
    }
}

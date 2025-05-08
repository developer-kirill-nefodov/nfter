// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract Referrals {
    mapping(address user => address referrer) public referrerOf;

    mapping(address referrer => uint256 amount) public earned;

    mapping(address referrer => uint256 amount) public lifetime;

    mapping(address referrer => uint256 count) public invited;

    mapping(address caller => bool allowed) public callers;

    address public owner;

    event Referred(address indexed user, address indexed referrer);
    event Credited(address indexed referrer, address indexed user, uint256 amount);
    event Withdrawn(address indexed referrer, uint256 amount);
    event CallerSet(address indexed caller, bool allowed);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotCaller();
    error NothingToWithdraw();
    error TransferFailed();
    error ZeroAddress();

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyCaller() {
        if (!callers[msg.sender]) revert NotCaller();
        _;
    }

    function setCaller(address caller, bool allowed) external onlyOwner {
        if (caller == address(0)) revert ZeroAddress();

        callers[caller] = allowed;
        emit CallerSet(caller, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function record(address user, address referrer) external onlyCaller {
        if (referrerOf[user] != address(0)) return;
        if (referrer == address(0) || referrer == user) return;

        referrerOf[user] = referrer;

        unchecked {
            ++invited[referrer];
        }

        emit Referred(user, referrer);
    }

    function credit(address user) external payable onlyCaller {
        address referrer = referrerOf[user];

        if (referrer == address(0)) revert ZeroAddress();

        unchecked {
            earned[referrer] += msg.value;
            lifetime[referrer] += msg.value;
        }

        emit Credited(referrer, user, msg.value);
    }

    function withdraw() external {
        uint256 amount = earned[msg.sender];

        if (amount == 0) revert NothingToWithdraw();

        earned[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function statsOf(
        address referrer
    ) external view returns (uint256 pending, uint256 total, uint256 people) {
        return (earned[referrer], lifetime[referrer], invited[referrer]);
    }
}

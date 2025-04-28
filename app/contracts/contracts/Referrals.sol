// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Referrals
 * @notice Who invited whom, and what they have earned for it.
 *
 * @dev The registry lives in its own contract for one reason: a referral is worth
 *      nothing if it only exists in a database. A number in Postgres saying "you
 *      earned 10%" is a claim; ETH credited here is a fact anyone can verify and
 *      the owner cannot quietly revise.
 *
 *      A referrer is written **once and never again**. Rewriting it later would
 *      let whoever moved last steal a stream of earnings from whoever moved
 *      first, which is exactly the kind of thing a mapping like this exists to
 *      prevent.
 */
contract Referrals {
    /// @notice Who invited this address. Zero means nobody, and it is final.
    mapping(address user => address referrer) public referrerOf;

    /// @notice What a referrer has earned and not yet withdrawn.
    mapping(address referrer => uint256 amount) public earned;

    /// @notice Lifetime earnings, kept for the leaderboard even after a withdrawal.
    mapping(address referrer => uint256 amount) public lifetime;

    /// @notice How many people an address has brought in.
    mapping(address referrer => uint256 count) public invited;

    /// @notice Contracts allowed to record referrals and credit rewards.
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

    // -------------------------------------------------------------------- admin

    /// @notice Authorise a contract (the mint, the market) to write here.
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

    // ---------------------------------------------------------------- recording

    /**
     * @notice Remember who invited `user`, if nobody has yet.
     * @dev Deliberately silent rather than reverting on a bad referrer. This runs
     *      inside a mint or a purchase, and a stale invite link is not a reason to
     *      take somebody's transaction down with it — the sale simply proceeds
     *      with no referrer.
     */
    function record(address user, address referrer) external onlyCaller {
        if (referrerOf[user] != address(0)) return; // already claimed, forever
        if (referrer == address(0) || referrer == user) return; // nobody, or themselves

        referrerOf[user] = referrer;

        unchecked {
            ++invited[referrer];
        }

        emit Referred(user, referrer);
    }

    /**
     * @notice Credit the referrer of `user` with the ETH sent along.
     * @dev The caller sends the cut; this contract holds it until the referrer
     *      comes for it. Pushing it onward here would put a stranger's fallback
     *      function inside somebody else's purchase.
     */
    function credit(address user) external payable onlyCaller {
        address referrer = referrerOf[user];

        // The caller is expected to check first; refusing the ETH is safer than
        // silently keeping money nobody is owed.
        if (referrer == address(0)) revert ZeroAddress();

        unchecked {
            earned[referrer] += msg.value;
            lifetime[referrer] += msg.value;
        }

        emit Credited(referrer, user, msg.value);
    }

    // -------------------------------------------------------------- withdrawing

    function withdraw() external {
        uint256 amount = earned[msg.sender];

        if (amount == 0) revert NothingToWithdraw();

        // Zeroed before the transfer: a re-entering referrer finds nothing left.
        earned[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    // ------------------------------------------------------------------ reading

    function statsOf(
        address referrer
    ) external view returns (uint256 pending, uint256 total, uint256 people) {
        return (earned[referrer], lifetime[referrer], invited[referrer]);
    }
}

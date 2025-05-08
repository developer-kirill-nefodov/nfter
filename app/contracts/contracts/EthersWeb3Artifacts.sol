// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {Referrals} from "./Referrals.sol";

contract EthersWeb3Artifacts is ERC721Enumerable {
    using Strings for uint256;

    enum Tier {
        Common,
        Rare,
        Epic,
        Legendary
    }

    struct Artifact {
        uint256 seed;
        Tier tier;
        address minter;
    }

    mapping(uint256 tokenId => Artifact) public artifactOf;
    mapping(Tier tier => uint256 minted) public mintedOf;

    address public owner;

    Referrals public immutable referrals;

    uint256 public constant REFERRAL_BPS = 1_000;
    uint256 private constant BPS = 10_000;

    uint256 private _nextTokenId = 1;

    uint256[4] public PRICES = [0.001 ether, 0.003 ether, 0.01 ether, 0.03 ether];
    uint256[4] public SUPPLY_CAPS = [1000, 250, 50, 10];

    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event Minted(
        address indexed minter,
        uint256 indexed tokenId,
        uint8 tier,
        uint256 price,
        uint256 seed
    );
    event Withdrawn(address indexed to, uint256 amount);

    error WrongPrice(uint256 expected, uint256 sent);
    error SoldOut(uint8 tier);
    error NotOwner();
    error NothingToWithdraw();
    error TransferFailed();
    error NonexistentToken();
    error ZeroAddress();

    constructor(
        address initialOwner,
        address referralsRegistry
    ) ERC721("EthersWeb3 Artifact", "EW3A") {
        if (initialOwner == address(0) || referralsRegistry == address(0)) revert ZeroAddress();

        owner = initialOwner;
        referrals = Referrals(referralsRegistry);
    }

    function priceOf(Tier tier) public view returns (uint256) {
        return PRICES[uint8(tier)];
    }

    function remaining(Tier tier) public view returns (uint256) {
        return SUPPLY_CAPS[uint8(tier)] - mintedOf[tier];
    }

    function mint(Tier tier, address referrer) external payable returns (uint256 tokenId) {
        uint256 price = priceOf(tier);

        if (msg.value != price) revert WrongPrice(price, msg.value);
        if (remaining(tier) == 0) revert SoldOut(uint8(tier));

        referrals.record(msg.sender, referrer);

        _payReferrer(price);

        unchecked {
            ++mintedOf[tier];
        }

        tokenId = _nextTokenId++;

        uint256 seed = uint256(
            keccak256(abi.encodePacked(msg.sender, tokenId, block.timestamp, blockhash(block.number - 1)))
        );

        artifactOf[tokenId] = Artifact({seed: seed, tier: tier, minter: msg.sender});

        _safeMint(msg.sender, tokenId);

        emit Minted(msg.sender, tokenId, uint8(tier), price, seed);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function _payReferrer(uint256 price) private {
        if (referrals.referrerOf(msg.sender) == address(0)) {
            return;
        }

        uint256 cut = (price * REFERRAL_BPS) / BPS;

        referrals.credit{value: cut}(msg.sender);
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function withdraw() external {
        if (msg.sender != owner) revert NotOwner();

        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();

        (bool sent, ) = payable(owner).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit Withdrawn(owner, amount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();

        Artifact memory artifact = artifactOf[tokenId];

        string memory json = string.concat(
            '{"name":"EthersWeb3 Artifact #',
            tokenId.toString(),
            '","description":"A fully on-chain generative artifact. The artwork is drawn by the contract, not stored on a server.",',
            '"attributes":[{"trait_type":"Tier","value":"',
            tierName(artifact.tier),
            '"},{"trait_type":"Hue","value":',
            (artifact.seed % 360).toString(),
            '},{"trait_type":"Rings","value":',
            (3 + uint256(uint8(artifact.tier)) * 2).toString(),
            '}],"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(_svg(artifact))),
            '"}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function tierName(Tier tier) public pure returns (string memory) {
        if (tier == Tier.Legendary) return "Legendary";
        if (tier == Tier.Epic) return "Epic";
        if (tier == Tier.Rare) return "Rare";
        return "Common";
    }

    uint256 private constant SIZE = 360;
    uint256 private constant CENTER = 180;

    function _svg(Artifact memory artifact) private pure returns (string memory) {
        uint256 hue = artifact.seed % 360;
        uint256 rings = 3 + uint256(uint8(artifact.tier)) * 2;

        string memory body = "";

        for (uint256 ring = 0; ring < rings; ++ring) {
            uint256 bits = (artifact.seed >> (ring * 8)) % 256;
            uint256 radius = 30 + ring * (140 / rings);
            uint256 nodes = 3 + (bits % (4 + uint256(uint8(artifact.tier))));

            body = string.concat(body, _ring(hue, ring, radius, nodes, bits, artifact.tier));
        }

        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="360" height="360">',
                '<defs><radialGradient id="g"><stop offset="0%" stop-color="hsl(',
                hue.toString(),
                ',60%,18%)"/><stop offset="100%" stop-color="hsl(',
                ((hue + 200) % 360).toString(),
                ',60%,5%)"/></radialGradient></defs>',
                '<rect width="360" height="360" fill="url(#g)"/>',
                body,
                "</svg>"
            );
    }

    function _ring(
        uint256 hue,
        uint256 index,
        uint256 radius,
        uint256 nodes,
        uint256 bits,
        Tier tier
    ) private pure returns (string memory) {
        string memory colour = string.concat(
            "hsl(",
            ((hue + index * 25) % 360).toString(),
            ",",
            (60 + (bits % 4) * 8).toString(),
            "%,",
            (50 + (bits % 3) * 10).toString(),
            "%)"
        );

        string memory dots = "";

        for (uint256 node = 0; node < nodes; ++node) {
            uint256 angleStep = 360 / nodes;
            uint256 size = 4 + (bits % 5);

            dots = string.concat(
                dots,
                '<circle cx="',
                (CENTER + radius).toString(),
                '" cy="',
                CENTER.toString(),
                '" r="',
                size.toString(),
                '" fill="',
                colour,
                '" transform="rotate(',
                (node * angleStep).toString(),
                " ",
                CENTER.toString(),
                " ",
                CENTER.toString(),
                ')"/>'
            );
        }

        string memory spin = tier == Tier.Legendary
            ? string.concat(
                '<animateTransform attributeName="transform" type="rotate" from="0 180 180" to="',
                index % 2 == 0 ? "360" : "-360",
                ' 180 180" dur="',
                (12 + index * 4).toString(),
                's" repeatCount="indefinite"/>'
            )
            : "";

        return
            string.concat(
                '<g><circle cx="180" cy="180" r="',
                radius.toString(),
                '" fill="none" stroke="',
                colour,
                '" stroke-opacity="0.25"/>',
                dots,
                spin,
                "</g>"
            );
    }
}

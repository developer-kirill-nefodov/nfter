// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title EthersWeb3Pass
 * @notice A free, one-per-wallet membership pass whose artwork is generated
 *         inside the contract and returned straight from `tokenURI`.
 *
 * @dev There is no IPFS here, and no metadata server. The image is a data: URI
 *      built on demand from a seed derived at mint time, so the art cannot rot,
 *      cannot be rugged, and needs nothing but an RPC node to render. That also
 *      means the collection is complete the moment it is deployed.
 *
 *      The seed is fixed at mint and stored, rather than derived from the
 *      current owner: a pass that repainted itself every time it was traded
 *      would not be much of a keepsake.
 */
contract EthersWeb3Pass is ERC721Enumerable {
    using Strings for uint256;

    /// @notice The address that minted a given token, and the seed of its art.
    mapping(uint256 tokenId => uint256 seed) public seedOf;
    mapping(uint256 tokenId => address minter) public minterOf;

    /// @notice One pass per wallet, ever.
    mapping(address wallet => bool hasClaimed) public claimed;

    uint256 private _nextTokenId = 1;

    event Claimed(address indexed minter, uint256 indexed tokenId, uint256 seed);

    error AlreadyClaimed();
    error NonexistentToken();

    constructor() ERC721("EthersWeb3 Pass", "EW3P") {}

    /**
     * @notice Mint your pass. Free, and only once per address.
     * @dev The seed mixes the minter with the token id and the block, so two
     *      wallets never land on the same artwork and a single wallet cannot
     *      grind for a rarer one — it gets exactly one draw.
     */
    function claim() external returns (uint256 tokenId) {
        if (claimed[msg.sender]) revert AlreadyClaimed();

        claimed[msg.sender] = true;

        tokenId = _nextTokenId++;

        uint256 seed = uint256(
            keccak256(abi.encodePacked(msg.sender, tokenId, blockhash(block.number - 1)))
        );

        seedOf[tokenId] = seed;
        minterOf[tokenId] = msg.sender;

        _safeMint(msg.sender, tokenId);

        emit Claimed(msg.sender, tokenId, seed);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ---------------------------------------------------------------- metadata

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentToken();

        uint256 seed = seedOf[tokenId];

        string memory json = string.concat(
            '{"name":"EthersWeb3 Pass #',
            tokenId.toString(),
            '","description":"A fully on-chain generative pass. The artwork lives in the contract, not on a server.",',
            '"attributes":[',
            _attributes(seed),
            '],"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(_svg(seed))),
            '"}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    // ------------------------------------------------------------------- traits

    /**
     * @dev Rarity is the number of leading zero nibbles in the seed — the same
     *      "how many zeros does the hash start with" idea proof-of-work uses. It
     *      costs nothing to compute and cannot be gamed, because the wallet gets
     *      exactly one seed.
     */
    function rarityOf(uint256 seed) public pure returns (string memory) {
        uint256 zeros = 0;

        for (uint256 i = 0; i < 64; ++i) {
            if ((seed >> (252 - i * 4)) & 0xf != 0) break;
            ++zeros;
        }

        if (zeros >= 3) return "Legendary";
        if (zeros == 2) return "Epic";
        if (zeros == 1) return "Rare";
        return "Common";
    }

    function _attributes(uint256 seed) private pure returns (string memory) {
        return
            string.concat(
                '{"trait_type":"Rarity","value":"',
                rarityOf(seed),
                '"},{"trait_type":"Hue","value":',
                (seed % 360).toString(),
                '},{"trait_type":"Shapes","value":',
                (4 + ((seed >> 8) % 5)).toString(),
                "}"
            );
    }

    // -------------------------------------------------------------------- art

    uint256 private constant GRID = 6;
    uint256 private constant CELL = 60;
    uint256 private constant SIZE = GRID * CELL; // 360 x 360

    /**
     * @dev The grid is drawn left-half-only and mirrored, which is what makes an
     *      identicon read as a face rather than as noise. Every decision — hue,
     *      which cells are filled, which shape sits in them — is a slice of the
     *      seed, so the same address always produces the same image and no two
     *      addresses produce the same one.
     */
    function _svg(uint256 seed) private pure returns (string memory) {
        uint256 hue = seed % 360;

        string memory shapes = "";

        for (uint256 row = 0; row < GRID; ++row) {
            for (uint256 col = 0; col < GRID / 2; ++col) {
                uint256 bits = (seed >> ((row * (GRID / 2) + col) * 6)) % 64;

                if (bits % 4 == 0) continue; // leave a quarter of the cells empty

                string memory fill = _color(hue, bits);

                shapes = string.concat(
                    shapes,
                    _cell(col * CELL, row * CELL, bits, fill),
                    // the mirrored twin
                    _cell((GRID - 1 - col) * CELL, row * CELL, bits, fill)
                );
            }
        }

        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ',
                SIZE.toString(),
                " ",
                SIZE.toString(),
                '" width="360" height="360">',
                '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
                '<stop offset="0%" stop-color="hsl(',
                hue.toString(),
                ',45%,12%)"/><stop offset="100%" stop-color="hsl(',
                ((hue + 40) % 360).toString(),
                ',55%,6%)"/></linearGradient></defs>',
                '<rect width="100%" height="100%" fill="url(#bg)"/>',
                shapes,
                "</svg>"
            );
    }

    function _cell(
        uint256 x,
        uint256 y,
        uint256 bits,
        string memory fill
    ) private pure returns (string memory) {
        uint256 shape = bits % 3;
        uint256 pad = 6;

        if (shape == 0) {
            return
                string.concat(
                    '<circle cx="',
                    (x + CELL / 2).toString(),
                    '" cy="',
                    (y + CELL / 2).toString(),
                    '" r="',
                    (CELL / 2 - pad).toString(),
                    '" fill="',
                    fill,
                    '"/>'
                );
        }

        if (shape == 1) {
            return
                string.concat(
                    '<rect x="',
                    (x + pad).toString(),
                    '" y="',
                    (y + pad).toString(),
                    '" width="',
                    (CELL - pad * 2).toString(),
                    '" height="',
                    (CELL - pad * 2).toString(),
                    '" rx="8" fill="',
                    fill,
                    '"/>'
                );
        }

        // A quarter-disc: four of them meeting at a corner read as a flower.
        return
            string.concat(
                '<path d="M',
                (x + pad).toString(),
                " ",
                (y + CELL - pad).toString(),
                " A",
                (CELL - pad * 2).toString(),
                " ",
                (CELL - pad * 2).toString(),
                " 0 0 1 ",
                (x + CELL - pad).toString(),
                " ",
                (y + pad).toString(),
                ' L',
                (x + pad).toString(),
                " ",
                (y + pad).toString(),
                ' Z" fill="',
                fill,
                '"/>'
            );
    }

    function _color(uint256 hue, uint256 bits) private pure returns (string memory) {
        // Three related hues plus one complementary accent: enough variety to
        // stay interesting, close enough together to never look accidental.
        uint256[4] memory offsets = [uint256(0), 30, 330, 180];
        uint256 pick = (bits >> 2) % 4;

        uint256 h = (hue + offsets[pick]) % 360;
        uint256 lightness = pick == 3 ? 70 : 55 + ((bits >> 4) % 3) * 8;

        return
            string.concat(
                "hsl(",
                h.toString(),
                ",",
                (65 + ((bits >> 3) % 3) * 10).toString(),
                "%,",
                lightness.toString(),
                "%)"
            );
    }
}

/**
 * The slice of ERC-721 (+ the Enumerable extension) this app actually reads.
 * A human-readable fragment list is all ethers v6 needs to encode these calls.
 */
export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

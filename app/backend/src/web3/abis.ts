/**
 * Contract fragments live here, apart from the services that use them.
 *
 * The indexer needs every contract's event signatures, and each service needs
 * the indexer to read those events back — so a service that also owned its ABI
 * closed a circle, and whichever module lost the race saw `undefined` where the
 * fragments should have been. Constants have no dependencies; a file of them
 * cannot take part in a cycle.
 */
export const TIP_JAR_ABI = [
  'function tip(string message) payable',
  'function owner() view returns (address)',
  'function balance() view returns (uint256)',
  'function totalTips() view returns (uint256)',
  'function tipCount() view returns (uint256)',
  'event Tipped(address indexed from, uint256 amount, string message, uint256 timestamp)',
];

export const MARKETPLACE_ABI = [
  'function list(address collection, uint256 tokenId, uint256 price)',
  'function cancel(address collection, uint256 tokenId)',
  'function buy(address collection, uint256 tokenId) payable',
  'function withdraw()',
  'function proceeds(address) view returns (uint256)',
  'function listingOf(address collection, uint256 tokenId) view returns (address seller, uint256 price)',
  'function quote(uint256 price) view returns (uint256 fee, uint256 toSeller)',
  'event Listed(address indexed seller, address indexed collection, uint256 indexed tokenId, uint256 price)',
  'event Sold(address indexed buyer, address indexed collection, uint256 indexed tokenId, address seller, uint256 price, uint256 fee)',
  'event Cancelled(address indexed seller, address indexed collection, uint256 indexed tokenId)',
];

export const PASS_EVENTS_ABI = [
  'event Claimed(address indexed minter, uint256 indexed tokenId, uint256 seed)',
];

export const ARTIFACT_EVENTS_ABI = [
  'event Minted(address indexed minter, uint256 indexed tokenId, uint8 tier, uint256 price, uint256 seed)',
];

export const REFERRALS_ABI = [
  'function referrerOf(address) view returns (address)',
  'function earned(address) view returns (uint256)',
  'function lifetime(address) view returns (uint256)',
  'function invited(address) view returns (uint256)',
  'function statsOf(address) view returns (uint256 pending, uint256 total, uint256 people)',
  'function withdraw()',
  'event Referred(address indexed user, address indexed referrer)',
  'event Credited(address indexed referrer, address indexed user, uint256 amount)',
];

export const OWNABLE_ABI = ['function owner() view returns (address)'];

# Ethers Web3

Sign in with an Ethereum wallet, browse the ERC-721 tokens it holds.

A full-stack TypeScript app: **Sign-In with Ethereum (EIP-4361)** on top of a conventional
JWT session layer, an ERC-721 reader with Redis caching, and a React SPA that only loads
`ethers` once the user actually reaches for their wallet.

```
React 19 · Vite 6 · Redux Toolkit · redux-saga · styled-components · ethers v6
Express 5 · Sequelize · PostgreSQL · Redis · BullMQ · Argon2 · Joi · Pino
```

---

## What it does

**Its own contracts.** `EthersWeb3Pass` is a free, one-per-wallet ERC-721 whose artwork is
generated *inside the contract* — a symmetric identicon derived from `keccak256(your address)`,
returned from `tokenURI` as a `data:` URI. No IPFS, no metadata server, nothing that can rot.
`EthersWeb3Artifacts` sells the same idea in four tiers, with a hard supply cap enforced on chain.
`TipJar` takes tips with a note attached. `Marketplace` lists, sells and cancels — taking 2.5% and
never taking custody: it holds an approval to move your token, not the token itself, and pays
nobody during a sale. Proceeds are credited and withdrawn, which is what makes a hostile seller
unable to re-enter or to revert a stranger's purchase.

**Every page shows its own plumbing.** The head block, the gas price, how far behind the indexer
is, each contract's address and cursor, how much of every tier is left, and exactly how a mint or
a sale splits between seller, treasury and referrer — all read from `/api/stats/chain`, all
recomputable by anyone with an RPC URL. A screen that claims to be on chain should be able to
prove it without being asked.

**Invite someone, earn a share of the fee.** `Referrals` is a registry: the first time an invited
account buys on chain, it records who invited them — once, permanently, and never for themselves.
From then on every mint and every sale by that account credits the inviter 10% of *our* commission.
The buyer's price does not move by a wei; the reward comes out of the project's revenue, not out
of their pocket. Balances are pulled, not pushed, so an inviter who cannot receive ETH cannot
brick anyone else's purchase.

**Two roles, and only one of them is a claim.** A regular account invites and collects. The founder
also sees the treasury. That role is *not* a column in the users table — a flag in Postgres is a
claim anybody with database access can make. The founder is whoever the contracts say owns them:
the server reads `owner()` from the chain and compares. To forge the role you would have to forge
ownership, and the chain will not let you.

**An account, and the wallet it owns.** Sessions come from email and password: a short-lived
access token in memory plus an httpOnly refresh cookie, allow-listed in Redis. A wallet is
something an account *has* — it is linked to a signed-in user, never a way to become one. Every
wallet route on the server, the nonce included, refuses an anonymous caller.

**Sign-In with Ethereum.** Linking proves ownership of the address with EIP-4361: the server
issues a single-use nonce, the wallet signs it, the server verifies the signature and burns the
nonce. The signature stays cryptographically valid forever, so single-use nonces are the only
thing standing between a captured message and a replay — the test suite asserts exactly that.

Disconnecting works in both directions: the address is dropped from the account *and* the site's
permission is revoked inside the wallet, so MetaMask stops handing the address back. Signing out
does the same automatically.

**Transactions, not just reads.** Claiming a pass and sending a tip both run the full lifecycle:
the gas is estimated *before* the wallet opens (so the user can still walk away), then signing,
then broadcast with the hash on screen, then confirmation — with a rejected prompt, an
out-of-gas, and a revert each explained in a sentence rather than as `execution reverted`.

**Your collection.** The API reads `balanceOf` → `tokenOfOwnerByIndex` → `tokenURI` from the
contract, resolves `ipfs://` metadata onto a gateway, and caches the whole collection per owner
in Redis, because a public RPC endpoint will rate-limit a re-rendering gallery in seconds.

**Sessions that actually end.** Logout revokes the session in Redis. Refresh rotates it, so a
captured refresh token can be spent exactly once. Changing a password signs out every device.

---

## Run it

Requires Docker and `make`.

```shell
git clone git@github.com:developer-kirill-nefodov/ethers-web3.git
cd ethers-web3

make init                 # writes the .env files, generates JWT secrets
make build-img up migrate seed

# Then deploy the contracts (needs a throwaway key with Sepolia ETH):
#   1. put DEPLOYER_PRIVATE_KEY in app/contracts/.env
#   2. fund it from a faucet — sepolia-faucet.pk910.de
make deploy-contracts     # prints the addresses to paste into the .env files

open http://localhost:3000
```

| | |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:3001/api |
| Mail (password resets) | http://localhost:8025 |

The seeded demo account is `user@ethers-web3.dev` / `DevPassword123`. For the wallet flow you
need MetaMask on **Sepolia** — no API keys, no funded account, no deployment of your own.

```shell
make check    # lint + typecheck + tests, both packages
make down
```

---

## How it fits together

```
app/contracts
  contracts/         EthersWeb3Pass · EthersWeb3Artifacts · TipJar · Marketplace
  test/              54 Hardhat tests — mint rules, SVG validity, supply caps,
                     tip accounting, escrow-by-approval, pull payments
  scripts/           deploy · preview (renders a sheet of passes to look at)

app/backend
  src/web3/          SIWE verification, ERC-721 reads, tip indexer, the RPC provider
  src/helpers/token/ JWT + the Redis session allow-list
  src/controllers/   thin: read the body, call a service, answer
  src/middlewares/   guards · rate limits · Joi validation · error handler
  src/workers/       BullMQ email queue (password resets)
  src/migrations/    schema + seeds

app/frontend
  src/web3/          wallet connect, SIWE message building (both lazily imported)
  src/store/         RTK slices + sagas (auth · wallet · nft)
  src/api/           axios client: in-memory token, refresh-and-retry interceptor
  src/screens/       home · sign in · sign up · forgot · reset · 404
```

### A few decisions worth explaining

**The access token never touches `localStorage`.** Anything an injected script can read, it can
exfiltrate. It lives in a module-scoped variable; the refresh token is an httpOnly cookie scoped
to `/api/auth`, and the client's 401 interceptor spends it to recover the session across reloads.

**`ethers` is loaded lazily.** It is ~890 kB — a third of everything the app ships — and it is
worth nothing to a visitor who never opens a wallet. It is behind a dynamic `import()` triggered
by the Connect button, so the initial download does not include it.

**Argon2id, not PBKDF2.** With a per-user random salt and OWASP's 2024 parameters. Hashes are
transparently upgraded on login when the cost parameters are raised.

**Every environment variable is validated at boot.** A missing or malformed value stops the
process with a readable error, rather than surfacing as a `NaN` token lifetime at 3am.

---

## Deployed on Sepolia

| Contract | Address |
|---|---|
| EthersWeb3Pass | [`0x5Fd8D760…F1504`](https://sepolia.etherscan.io/address/0x5Fd8D760e8E013798D894F606E7f273c354F1504) |
| EthersWeb3Artifacts | [`0x14F1373d…01B0f`](https://sepolia.etherscan.io/address/0x14F1373dff11e915d8AcAAB505D6b3F427901B0f) |
| TipJar | [`0xC51D2D96…C6567`](https://sepolia.etherscan.io/address/0xC51D2D96bCbB4E70b0F7a5a4Fc06B234931C6567) |
| Marketplace | [`0x9DCc60Cf…b8994`](https://sepolia.etherscan.io/address/0x9DCc60CfDd8ad78F9557D2bB83e62afeA0Fb8994) |
| Referrals | [`0xCEa9ba1d…1Ba85`](https://sepolia.etherscan.io/address/0xCEa9ba1d0fd011C7F6D472572b4489483E41Ba85) |

The three contracts that hold money are owned by the treasury wallet — deliberately not the
wallet the author collects with, so that the founder's balance and the project's are never the
same number.

Addresses and the deployment block live in `app/contracts/deployments/sepolia.json` — the indexer
starts there rather than at genesis, because a public node will not read logs any further back.

---

## Tests

```shell
make test     # backend · frontend · contracts
```

171 tests: 79 on the contracts, 48 on the API, 44 in the browser. They cover what would actually
hurt if it broke — that a logged-out token is refused, that a refresh token cannot be spent twice,
that a SIWE signature cannot be replayed or reused across domains, that a wrong password and an
unknown email are answered identically, that a referrer is credited out of the fee and never out
of the buyer's price, that a stale invite cannot revert someone else's purchase, and that a
network failure does not white-screen the app.

---

## History

The first version of this project (May–June 2023) was an auth and i18n skeleton. It had `ethers`
in `package.json` and a Connect button wired to nothing — no wallet code on either side. The
work in this repository from December 2024 onward is what makes the name honest: real SIWE
authentication, real contract reads, and a rewrite of the session layer that was quietly broken
underneath it.

## License

MIT

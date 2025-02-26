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

**Two ways in, one session.** A user can sign in with an email and password, or by signing
a message with their wallet. Both paths end at the same place: a short-lived access token in
memory plus an httpOnly refresh cookie, with the session allow-listed in Redis.

**Sign-In with Ethereum.** The server issues a single-use nonce; the wallet signs an EIP-4361
message containing it; the server verifies the signature, burns the nonce, and mints a session.
The signature stays cryptographically valid forever, so single-use nonces are the only thing
standing between a captured message and a replay — the test suite asserts exactly that.

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
# set NFT_CONTRACT_ADDRESS in app/backend/.env to any ERC-721 on Sepolia
make build-img up migrate seed

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
app/backend
  src/web3/          SIWE verification, ERC-721 reads, the RPC provider
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

## Tests

```shell
make test     # 51 tests
```

The suite covers what would actually hurt if it broke: that a logged-out token is refused, that
a refresh token cannot be spent twice, that a SIWE signature cannot be replayed or reused across
domains, that a wrong password and an unknown email are answered identically, and that a network
failure does not white-screen the app.

---

## History

The first version of this project (May–June 2023) was an auth and i18n skeleton. It had `ethers`
in `package.json` and a Connect button wired to nothing — no wallet code on either side. The
work in this repository from December 2024 onward is what makes the name honest: real SIWE
authentication, real contract reads, and a rewrite of the session layer that was quietly broken
underneath it.

## License

MIT

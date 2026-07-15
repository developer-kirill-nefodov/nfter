# Nfter

![License](https://img.shields.io/badge/license-MIT-blue)
![Tests](https://img.shields.io/badge/tests-171%20passing-brightgreen)
![Network](https://img.shields.io/badge/network-Sepolia-627EEA?logo=ethereum&logoColor=white)

Nfter is a full-stack TypeScript Web3 application on the Sepolia Ethereum testnet.

Create an account, link an Ethereum wallet through **Sign-In with Ethereum (EIP-4361)**, mint
generative ERC-721 NFTs, send tips, trade through an approval-based marketplace, and verify key
product state directly from the blockchain.

The idea isn't "just another NFT app." Nfter is built around **verifiable on-chain state**:
contract addresses, gas data, indexer lag, tier supply, fee splits, referral rewards, and founder
ownership are surfaced in the UI and can be recomputed from Sepolia by anyone with an RPC URL.

## Core features

- Account auth with Argon2id, Redis-backed refresh sessions, token rotation, and global logout
- SIWE / EIP-4361 wallet linking with one-time nonce verification and replay protection
- Generative ERC-721 NFTs with in-contract metadata (no IPFS, nothing to rot)
- Capped artifact tiers with on-chain supply limits
- TipJar contract with message events
- Approval-based marketplace with pull payments and a 2.5% project fee
- Referral registry where rewards are paid from the project fee, not from the buyer
- On-chain transparency panel: contract state, gas, indexer lag, supply, and payment splits
- Founder role derived from on-chain `owner()`, not a database flag
- 171 tests across smart contracts, API, and browser behavior

## Stack

**Frontend**  
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)
![styled-components](https://img.shields.io/badge/styled--components-6-DB7093?logo=styledcomponents&logoColor=white)
![ethers.js](https://img.shields.io/badge/ethers.js-6-2535A0?logo=ethereum&logoColor=white)

**Backend**  
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)

**Contracts &amp; infra**  
![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity&logoColor=white)
![Sepolia](https://img.shields.io/badge/Sepolia-Ethereum-627EEA?logo=ethereum&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI-2088FF?logo=githubactions&logoColor=white)

## Run it

Requires Docker and `make`.

```shell
git clone git@github.com:developer-kirill-nefodov/nfter.git
cd nfter

make init                 # writes the .env files, generates JWT secrets
make build-img up migrate seed

open http://localhost:3000
```

Sign in with the seeded account `user@nfter.dev` / `DevPassword123`, then link **MetaMask on
Sepolia** to try the on-chain flows — no API keys, no funded account, no deployment of your own.
Optionally deploy your own contracts with `make deploy-contracts` (needs a throwaway key funded
from a Sepolia faucet). App runs on `:3000`, API on `:3001/api`, mail viewer on `:8025`.

## Deployed on Sepolia

| Contract | Address |
|---|---|
| EthersWeb3Pass | [`0x5Fd8D760…F1504`](https://sepolia.etherscan.io/address/0x5Fd8D760e8E013798D894F606E7f273c354F1504) |
| EthersWeb3Artifacts | [`0x14F1373d…01B0f`](https://sepolia.etherscan.io/address/0x14F1373dff11e915d8AcAAB505D6b3F427901B0f) |
| TipJar | [`0xC51D2D96…C6567`](https://sepolia.etherscan.io/address/0xC51D2D96bCbB4E70b0F7a5a4Fc06B234931C6567) |
| Marketplace | [`0x9DCc60Cf…b8994`](https://sepolia.etherscan.io/address/0x9DCc60CfDd8ad78F9557D2bB83e62afeA0Fb8994) |
| Referrals | [`0xCEa9ba1d…1Ba85`](https://sepolia.etherscan.io/address/0xCEa9ba1d0fd011C7F6D472572b4489483E41Ba85) |

Addresses and the deployment block live in `app/contracts/deployments/sepolia.json`.

## Tests

```shell
make test     # contracts · API · browser
```

171 tests covering what would actually hurt if it broke: a refresh token can't be spent twice, a
SIWE signature can't be replayed or reused across domains, a wrong password and an unknown email
are answered identically, and a referrer is credited out of the fee, never out of the buyer's price.

## License

MIT — see [LICENSE](LICENSE).

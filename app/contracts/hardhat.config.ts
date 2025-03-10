import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import type {HardhatUserConfig} from 'hardhat/config';

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? '';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {enabled: true, runs: 200},
      // tokenURI builds the whole SVG in memory; via-IR keeps that within the
      // stack limit and produces markedly cheaper code for string concatenation.
      viaIR: true,
    },
  },
  networks: {
    hardhat: {chainId: 31337},
    localhost: {url: 'http://127.0.0.1:8545', chainId: 31337},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {sepolia: process.env.ETHERSCAN_API_KEY ?? ''},
  },
  gasReporter: {enabled: process.env.REPORT_GAS === 'true'},
};

export default config;

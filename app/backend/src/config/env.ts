import 'dotenv/config';
import Joi from 'joi';
import ms from 'ms';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  FRONTEND_URL: Joi.string().uri().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  RPC_URL: Joi.string().uri().required(),
  CHAIN_ID: Joi.number().required(),
  NFT_CONTRACT_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  TIP_JAR_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  ARTIFACTS_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  MARKETPLACE_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  REFERRALS_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  // The block the contracts were deployed in. Public RPC nodes cap how far back
  // a log query may reach, so the tip indexer starts here rather than at genesis.
  CONTRACTS_FROM_BLOCK: Joi.number().min(0).default(0),
  IPFS_GATEWAY: Joi.string().uri().default('https://ipfs.io/ipfs/'),

  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().default('no-reply@ethers-web3.dev'),

  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
}).unknown(true);

interface IRawEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  FRONTEND_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
  RPC_URL: string;
  CHAIN_ID: number;
  NFT_CONTRACT_ADDRESS: string;
  TIP_JAR_ADDRESS: string;
  ARTIFACTS_ADDRESS: string;
  MARKETPLACE_ADDRESS: string;
  REFERRALS_ADDRESS: string;
  CONTRACTS_FROM_BLOCK: number;
  IPFS_GATEWAY: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  MAIL_FROM: string;
  LOG_LEVEL: string;
}

const result = schema.validate(process.env, {abortEarly: false});
const error = result.error;

if (error) {
  const details = error.details.map((detail) => `  - ${detail.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

// Joi hands back `any`; this is the one place the shape is asserted, and the
// schema above is what makes the assertion true.
const config = result.value as IRawEnv;

const seconds = (duration: string): number => Math.floor(ms(duration as ms.StringValue) / 1000);

if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
}

export const env = {
  nodeEnv: config.NODE_ENV,
  isProduction: config.NODE_ENV === 'production',
  port: config.PORT,
  frontendUrl: config.FRONTEND_URL,

  db: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    name: config.DB_NAME,
    username: config.DB_USERNAME,
    password: config.DB_PASSWORD,
  },

  redis: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
  },

  jwt: {
    accessSecret: config.JWT_ACCESS_SECRET,
    refreshSecret: config.JWT_REFRESH_SECRET,
    accessTtl: config.JWT_ACCESS_TTL,
    refreshTtl: config.JWT_REFRESH_TTL,
    accessTtlSec: seconds(config.JWT_ACCESS_TTL),
    refreshTtlSec: seconds(config.JWT_REFRESH_TTL),
  },

  web3: {
    rpcUrl: config.RPC_URL,
    chainId: config.CHAIN_ID,
    nftContract: config.NFT_CONTRACT_ADDRESS,
    tipJar: config.TIP_JAR_ADDRESS,
    artifacts: config.ARTIFACTS_ADDRESS,
    marketplace: config.MARKETPLACE_ADDRESS,
    referrals: config.REFERRALS_ADDRESS,
    fromBlock: config.CONTRACTS_FROM_BLOCK,
    ipfsGateway: config.IPFS_GATEWAY,
  },

  mail: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    password: config.SMTP_PASSWORD,
    from: config.MAIL_FROM,
  },

  logLevel: config.LOG_LEVEL,
};

import {writeFileSync} from 'fs';
import {ethers, network} from 'hardhat';

// One-shot deployment of the whole system, correctly wired: Referrals is deployed first (owned by
// the deployer so it can authorize callers), then the token/market contracts, then the marketplace
// and artifacts are registered as referral callers, and finally ownership of everything is handed to
// the treasury. Running this end to end is what `npm run deploy:sepolia` expects.
async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error('No deployer account. Set DEPLOYER_PRIVATE_KEY in app/contracts/.env');
  }

  // The wallet that should end up owning the contracts and receiving fees. Defaults to the deployer
  // for local runs; set TREASURY_ADDRESS for a real deployment.
  const treasuryRaw = process.env.TREASURY_ADDRESS || deployer.address;

  if (!ethers.isAddress(treasuryRaw)) {
    throw new Error('TREASURY_ADDRESS is not a valid address');
  }

  const treasury = ethers.getAddress(treasuryRaw);
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`network:  ${network.name}`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`treasury: ${treasury}`);
  console.log(`balance:  ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error(
      'Deployer has no ETH. On Sepolia, top it up from a faucet (sepolia-faucet.pk910.de).',
    );
  }

  const referrals = await (await ethers.getContractFactory('Referrals')).deploy(deployer.address);
  await referrals.waitForDeployment();
  const referralsAddress = await referrals.getAddress();
  const block = (await referrals.deploymentTransaction()?.wait())?.blockNumber ?? 0;

  const pass = await (await ethers.getContractFactory('EthersWeb3Pass')).deploy();
  await pass.waitForDeployment();
  const passAddress = await pass.getAddress();

  const jar = await (await ethers.getContractFactory('TipJar')).deploy(treasury);
  await jar.waitForDeployment();
  const jarAddress = await jar.getAddress();

  const artifacts = await (
    await ethers.getContractFactory('EthersWeb3Artifacts')
  ).deploy(treasury, referralsAddress);
  await artifacts.waitForDeployment();
  const artifactsAddress = await artifacts.getAddress();

  const market = await (
    await ethers.getContractFactory('Marketplace')
  ).deploy(treasury, referralsAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();

  // Authorize the two contracts that write to the registry, then hand the registry to the treasury.
  // Order matters: setCaller needs the deployer to still own Referrals.
  await (await referrals.setCaller(artifactsAddress, true)).wait();
  await (await referrals.setCaller(marketAddress, true)).wait();
  await (await referrals.transferOwnership(treasury)).wait();

  console.log(`Referrals:   ${referralsAddress}  (owner ${treasury})`);
  console.log(`EthersWeb3Pass: ${passAddress}`);
  console.log(`TipJar:      ${jarAddress}  (owner ${treasury})`);
  console.log(`Artifacts:   ${artifactsAddress}  (owner ${treasury})`);
  console.log(`Marketplace: ${marketAddress}  (owner ${treasury})`);
  console.log(`deployed at block ${block}\n`);

  const deployment = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    block,
    pass: passAddress,
    tipJar: jarAddress,
    artifacts: artifactsAddress,
    marketplace: marketAddress,
    referrals: referralsAddress,
    treasury,
    tipJarOwner: treasury,
    artifactsOwner: treasury,
    marketplaceOwner: treasury,
  };

  writeFileSync(`deployments/${network.name}.json`, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log('Put these in app/backend/.env:');
  console.log(`  NFT_CONTRACT_ADDRESS=${passAddress}`);
  console.log(`  TIP_JAR_ADDRESS=${jarAddress}`);
  console.log(`  ARTIFACTS_ADDRESS=${artifactsAddress}`);
  console.log(`  MARKETPLACE_ADDRESS=${marketAddress}`);
  console.log(`  REFERRALS_ADDRESS=${referralsAddress}`);
  console.log(`  CONTRACTS_FROM_BLOCK=${block}`);
  console.log('\nand the matching VITE_* values in app/frontend/.env.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

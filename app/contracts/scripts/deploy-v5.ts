import {readFileSync, writeFileSync} from 'fs';
import {ethers, network} from 'hardhat';

/**
 * Deploys the referral registry and re-points the money contracts at it, with the
 * treasury — not the founder's own wallet — as their owner.
 *
 * The registry is deployed owned by the deployer, wired up, and only then handed
 * over: `setCaller` is owner-only, so transferring first would lock us out of the
 * very configuration the contracts need to work. Ownership moves last, once there
 * is nothing left to configure.
 *
 * The pass is left alone. It holds no money and has no owner, so redeploying it
 * would only invalidate the passes people already hold.
 */
async function main() {
  const treasury = process.env.TREASURY_ADDRESS;

  if (!treasury || !ethers.isAddress(treasury)) {
    throw new Error('Set TREASURY_ADDRESS to the wallet that should own the contracts');
  }

  const file = `deployments/${network.name}.json`;
  const deployment = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error('No deployer account. Set DEPLOYER_PRIVATE_KEY in app/contracts/.env');
  }

  console.log(`network:  ${network.name}`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`treasury: ${ethers.getAddress(treasury)}`);
  console.log(`balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const referrals = await (await ethers.getContractFactory('Referrals')).deploy(deployer.address);
  await referrals.waitForDeployment();
  const referralsAddress = await referrals.getAddress();
  const block = (await referrals.deploymentTransaction()?.wait())?.blockNumber ?? 0;

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

  // Only these two may credit a referrer. Anything else calling `credit()` would
  // be paying rewards out of thin air.
  await (await referrals.setCaller(artifactsAddress, true)).wait();
  await (await referrals.setCaller(marketAddress, true)).wait();
  await (await referrals.transferOwnership(treasury)).wait();

  console.log(`Referrals:   ${referralsAddress}  (owner ${treasury})`);
  console.log(`TipJar:      ${jarAddress}`);
  console.log(`Artifacts:   ${artifactsAddress}`);
  console.log(`Marketplace: ${marketAddress}`);
  console.log(`deployed at block ${block}\n`);

  Object.assign(deployment, {
    block,
    referrals: referralsAddress,
    tipJar: jarAddress,
    artifacts: artifactsAddress,
    marketplace: marketAddress,
    treasury: ethers.getAddress(treasury),
    tipJarOwner: ethers.getAddress(treasury),
    artifactsOwner: ethers.getAddress(treasury),
    marketplaceOwner: ethers.getAddress(treasury),
  });

  writeFileSync(file, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`  REFERRALS_ADDRESS=${referralsAddress}`);
  console.log(`  TIP_JAR_ADDRESS=${jarAddress}`);
  console.log(`  ARTIFACTS_ADDRESS=${artifactsAddress}`);
  console.log(`  MARKETPLACE_ADDRESS=${marketAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import {writeFileSync} from 'fs';
import {ethers, network} from 'hardhat';

/**
 * Deploys both contracts and writes down the block they landed in.
 *
 * That block number matters: the backend reads the tip feed with `queryFilter`,
 * and public RPC nodes cap how far back a log query may reach. Starting from the
 * deployment block instead of from genesis is the difference between a feed that
 * loads and one that times out.
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error('No deployer account. Set DEPLOYER_PRIVATE_KEY in app/contracts/.env');
  }

  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`network:  ${network.name}`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`balance:  ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error(
      'Deployer has no ETH. On Sepolia, top it up from a faucet (sepolia-faucet.pk910.de).',
    );
  }

  const tipJarOwner = process.env.TIP_JAR_OWNER || deployer.address;

  const pass = await (await ethers.getContractFactory('EthersWeb3Pass')).deploy();
  await pass.waitForDeployment();

  const jar = await (await ethers.getContractFactory('TipJar')).deploy(tipJarOwner);
  await jar.waitForDeployment();

  const passAddress = await pass.getAddress();
  const jarAddress = await jar.getAddress();
  const block = (await pass.deploymentTransaction()?.wait())?.blockNumber ?? 0;

  console.log(`EthersWeb3Pass: ${passAddress}`);
  console.log(`TipJar:         ${jarAddress}  (owner ${tipJarOwner})`);
  console.log(`deployed at block ${block}\n`);

  const deployment = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    block,
    pass: passAddress,
    tipJar: jarAddress,
    tipJarOwner,
  };

  writeFileSync(`deployments/${network.name}.json`, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log('Put these in app/backend/.env:');
  console.log(`  NFT_CONTRACT_ADDRESS=${passAddress}`);
  console.log(`  TIP_JAR_ADDRESS=${jarAddress}`);
  console.log(`  CONTRACTS_FROM_BLOCK=${block}`);
  console.log('\nand in app/frontend/.env:');
  console.log(`  VITE_NFT_CONTRACT_ADDRESS=${passAddress}`);
  console.log(`  VITE_TIP_JAR_ADDRESS=${jarAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

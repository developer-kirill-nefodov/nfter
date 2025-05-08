import {readFileSync, writeFileSync} from 'fs';
import {ethers, network} from 'hardhat';

async function main() {
  const file = `deployments/${network.name}.json`;
  const deployment = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

  const [deployer] = await ethers.getSigners();
  const owner = process.env.TIP_JAR_OWNER || deployer!.address;

  const artifacts = await (await ethers.getContractFactory('EthersWeb3Artifacts')).deploy(owner);
  await artifacts.waitForDeployment();

  const address = await artifacts.getAddress();

  deployment.artifacts = address;
  writeFileSync(file, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`EthersWeb3Artifacts: ${address}  (owner ${owner})`);
  console.log(`\n  ARTIFACTS_ADDRESS=${address}\n  VITE_ARTIFACTS_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

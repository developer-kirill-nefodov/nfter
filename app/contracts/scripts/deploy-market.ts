import {readFileSync, writeFileSync} from 'fs';
import {ethers, network} from 'hardhat';

/** Adds the marketplace to an existing deployment, leaving the rest untouched. */
async function main() {
  const file = `deployments/${network.name}.json`;
  const deployment = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

  const [deployer] = await ethers.getSigners();
  const feeRecipient = process.env.TIP_JAR_OWNER || deployer!.address;

  const market = await (await ethers.getContractFactory('Marketplace')).deploy(feeRecipient);
  await market.waitForDeployment();

  const address = await market.getAddress();

  deployment.marketplace = address;
  writeFileSync(file, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`Marketplace: ${address}  (fees to ${feeRecipient})`);
  console.log(`\n  MARKETPLACE_ADDRESS=${address}\n  VITE_MARKETPLACE_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

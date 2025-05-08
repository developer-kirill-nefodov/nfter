import {writeFileSync} from 'fs';
import {ethers} from 'hardhat';

async function main() {
  const pass = await (await ethers.getContractFactory('EthersWeb3Pass')).deploy();
  const signers = await ethers.getSigners();

  const cards: string[] = [];

  for (const signer of signers.slice(0, 12)) {
    await pass.connect(signer).claim();
    const tokenId = await pass.tokenOfOwnerByIndex(signer.address, 0);

    const uri = await pass.tokenURI(tokenId);
    const metadata = JSON.parse(Buffer.from(uri.split(',')[1]!, 'base64').toString());
    const rarity = metadata.attributes.find((a: {trait_type: string}) => a.trait_type === 'Rarity');

    cards.push(
      `<figure><img src="${metadata.image}" width="200" height="200"/>` +
        `<figcaption>${metadata.name} · ${rarity.value}<br><code>${signer.address.slice(0, 10)}…</code></figcaption></figure>`,
    );
  }

  writeFileSync(
    'preview.html',
    `<body style="background:#0f1117;color:#e8eaf0;font-family:system-ui;display:flex;flex-wrap:wrap;gap:24px;padding:24px">${cards.join('')}</body>`,
  );

  console.log(`Wrote preview.html — ${cards.length} passes`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

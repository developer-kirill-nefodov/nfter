import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const decodeDataUri = (uri: string) => {
  const [header, payload] = uri.split(',');

  expect(header).to.equal('data:application/json;base64');

  return JSON.parse(Buffer.from(payload!, 'base64').toString('utf8')) as {
    name: string;
    description: string;
    image: string;
    attributes: {trait_type: string; value: string | number}[];
  };
};

const decodeSvg = (image: string) => {
  const [header, payload] = image.split(',');

  expect(header).to.equal('data:image/svg+xml;base64');

  return Buffer.from(payload!, 'base64').toString('utf8');
};

describe('EthersWeb3Pass', () => {
  const deploy = async () => {
    const [owner, alice, bob] = await ethers.getSigners();
    const pass = await (await ethers.getContractFactory('EthersWeb3Pass')).deploy();

    return {pass, owner, alice, bob};
  };

  describe('claiming', () => {
    it('mints a pass to the caller', async () => {
      const {pass, alice} = await loadFixture(deploy);

      await expect(pass.connect(alice).claim())
        .to.emit(pass, 'Claimed')
        .withArgs(alice.address, 1n, (seed: bigint) => seed > 0n);

      expect(await pass.ownerOf(1)).to.equal(alice.address);
      expect(await pass.balanceOf(alice.address)).to.equal(1n);
      expect(await pass.totalMinted()).to.equal(1n);
    });

    it('refuses a second pass to the same wallet', async () => {
      const {pass, alice} = await loadFixture(deploy);

      await pass.connect(alice).claim();

      await expect(pass.connect(alice).claim()).to.be.revertedWithCustomError(
        pass,
        'AlreadyClaimed',
      );
    });

    it('still refuses after the pass has been given away', async () => {
      const {pass, alice, bob} = await loadFixture(deploy);

      await pass.connect(alice).claim();
      await pass.connect(alice).transferFrom(alice.address, bob.address, 1);

      await expect(pass.connect(alice).claim()).to.be.revertedWithCustomError(
        pass,
        'AlreadyClaimed',
      );
    });

    it('gives different wallets different art', async () => {
      const {pass, alice, bob} = await loadFixture(deploy);

      await pass.connect(alice).claim();
      await pass.connect(bob).claim();

      expect(await pass.seedOf(1)).to.not.equal(await pass.seedOf(2));
      expect(await pass.tokenURI(1)).to.not.equal(await pass.tokenURI(2));
    });

    it('remembers who minted it, even after a transfer', async () => {
      const {pass, alice, bob} = await loadFixture(deploy);

      await pass.connect(alice).claim();
      const before = await pass.tokenURI(1);

      await pass.connect(alice).transferFrom(alice.address, bob.address, 1);

      expect(await pass.minterOf(1)).to.equal(alice.address);
      expect(await pass.tokenURI(1)).to.equal(before);
    });
  });

  describe('on-chain metadata', () => {
    it('returns a self-contained JSON data URI — no IPFS, no server', async () => {
      const {pass, alice} = await loadFixture(deploy);
      await pass.connect(alice).claim();

      const metadata = decodeDataUri(await pass.tokenURI(1));

      expect(metadata.name).to.equal('EthersWeb3 Pass #1');
      expect(metadata.image).to.match(/^data:image\/svg\+xml;base64,/);
      expect(metadata.attributes.map((a) => a.trait_type)).to.have.members([
        'Rarity',
        'Hue',
        'Shapes',
      ]);
    });

    it('embeds an SVG that a browser can actually render', async () => {
      const {pass, alice} = await loadFixture(deploy);
      await pass.connect(alice).claim();

      const svg = decodeSvg(decodeDataUri(await pass.tokenURI(1)).image);

      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).to.equal(true);
      expect(svg.endsWith('</svg>')).to.equal(true);

      const opened = (svg.match(/<(svg|rect|circle|path|defs|linearGradient|stop)\b/g) ?? []).length;
      expect(opened).to.be.greaterThan(5);
      expect(svg).to.include('hsl(');
    });

    it('draws a symmetric image', async () => {
      const {pass, alice} = await loadFixture(deploy);
      await pass.connect(alice).claim();

      const svg = decodeSvg(decodeDataUri(await pass.tokenURI(1)).image);
      const shapes = svg.match(/<(circle|rect|path)\b/g) ?? [];

      expect((shapes.length - 1) % 2).to.equal(0);
    });

    it('reverts for a token nobody has minted', async () => {
      const {pass} = await loadFixture(deploy);

      await expect(pass.tokenURI(99)).to.be.revertedWithCustomError(pass, 'NonexistentToken');
    });
  });

  describe('rarity', () => {
    it('grades a seed by its leading zero nibbles', async () => {
      const {pass} = await loadFixture(deploy);

      const withLeadingZeros = (zeros: number) => 1n << BigInt(252 - zeros * 4);

      expect(await pass.rarityOf(withLeadingZeros(0))).to.equal('Common');
      expect(await pass.rarityOf(withLeadingZeros(1))).to.equal('Rare');
      expect(await pass.rarityOf(withLeadingZeros(2))).to.equal('Epic');
      expect(await pass.rarityOf(withLeadingZeros(3))).to.equal('Legendary');
    });
  });

  describe('enumeration', () => {
    it('supports the ERC721Enumerable interface the gallery relies on', async () => {
      const {pass, alice} = await loadFixture(deploy);

      expect(await pass.supportsInterface('0x780e9d63')).to.equal(true);

      await pass.connect(alice).claim();
      expect(await pass.tokenOfOwnerByIndex(alice.address, 0)).to.equal(1n);
    });
  });
});

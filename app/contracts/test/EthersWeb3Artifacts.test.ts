import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const COMMON = 0;
const RARE = 1;
const EPIC = 2;
const LEGENDARY = 3;

const PRICE = {
  [COMMON]: ethers.parseEther('0.001'),
  [RARE]: ethers.parseEther('0.003'),
  [EPIC]: ethers.parseEther('0.01'),
  [LEGENDARY]: ethers.parseEther('0.03'),
};

const decode = (uri: string) =>
  JSON.parse(Buffer.from(uri.split(',')[1]!, 'base64').toString()) as {
    name: string;
    image: string;
    attributes: {trait_type: string; value: string | number}[];
  };

const svgOf = (image: string) => Buffer.from(image.split(',')[1]!, 'base64').toString();

describe('EthersWeb3Artifacts', () => {
  const deploy = async () => {
    const [owner, alice, bob, carol] = await ethers.getSigners();

    const referrals = await (await ethers.getContractFactory('Referrals')).deploy(owner.address);
    const artifacts = await (
      await ethers.getContractFactory('EthersWeb3Artifacts')
    ).deploy(owner.address, await referrals.getAddress());

    await referrals.setCaller(await artifacts.getAddress(), true);

    return {artifacts, referrals, owner, alice, bob, carol};
  };

  const NOBODY = ethers.ZeroAddress;

  describe('buying', () => {
    it('sells the tier the buyer asked for', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await expect(artifacts.connect(alice).mint(EPIC, NOBODY, {value: PRICE[EPIC]}))
        .to.emit(artifacts, 'Minted')
        .withArgs(alice.address, 1n, EPIC, PRICE[EPIC], (seed: bigint) => seed > 0n);

      const metadata = decode(await artifacts.tokenURI(1));
      const tier = metadata.attributes.find((a) => a.trait_type === 'Tier');

      expect(tier?.value).to.equal('Epic');
    });

    it('lets one wallet buy as many as it likes', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(COMMON, NOBODY, {value: PRICE[COMMON]});
      await artifacts.connect(alice).mint(RARE, NOBODY, {value: PRICE[RARE]});
      await artifacts.connect(alice).mint(COMMON, NOBODY, {value: PRICE[COMMON]});

      expect(await artifacts.balanceOf(alice.address)).to.equal(3n);
      expect(await artifacts.totalMinted()).to.equal(3n);
    });

    it('demands the exact price', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await expect(
        artifacts.connect(alice).mint(RARE, NOBODY, {value: PRICE[COMMON]}),
      ).to.be.revertedWithCustomError(artifacts, 'WrongPrice');

      await expect(
        artifacts.connect(alice).mint(RARE, NOBODY, {value: PRICE[EPIC]}),
      ).to.be.revertedWithCustomError(artifacts, 'WrongPrice');
    });

    it('keeps the money', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await expect(
        artifacts.connect(alice).mint(LEGENDARY, NOBODY, {value: PRICE[LEGENDARY]}),
      ).to.changeEtherBalances([alice, artifacts], [-PRICE[LEGENDARY], PRICE[LEGENDARY]]);
    });

    it('gives every artifact its own art', async () => {
      const {artifacts, alice, bob} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(COMMON, NOBODY, {value: PRICE[COMMON]});
      await artifacts.connect(bob).mint(COMMON, NOBODY, {value: PRICE[COMMON]});

      expect(await artifacts.tokenURI(1)).to.not.equal(await artifacts.tokenURI(2));
    });
  });

  describe('scarcity', () => {
    it('caps each tier, and says so before the sale', async () => {
      const {artifacts} = await loadFixture(deploy);

      expect(await artifacts.remaining(LEGENDARY)).to.equal(10n);
      expect(await artifacts.remaining(COMMON)).to.equal(1000n);
    });

    it('counts down as they sell', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(EPIC, NOBODY, {value: PRICE[EPIC]});

      expect(await artifacts.remaining(EPIC)).to.equal(49n);
      expect(await artifacts.mintedOf(EPIC)).to.equal(1n);
    });

    it('refuses to oversell a tier', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      for (let i = 0; i < 10; i += 1) {
        await artifacts.connect(alice).mint(LEGENDARY, NOBODY, {value: PRICE[LEGENDARY]});
      }

      expect(await artifacts.remaining(LEGENDARY)).to.equal(0n);

      await expect(
        artifacts.connect(alice).mint(LEGENDARY, NOBODY, {value: PRICE[LEGENDARY]}),
      ).to.be.revertedWithCustomError(artifacts, 'SoldOut');

      await expect(artifacts.connect(alice).mint(EPIC, NOBODY, {value: PRICE[EPIC]})).to.not.be.reverted;
    });
  });

  describe('the art', () => {
    it('draws more for a higher tier, so the tier is visible', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(COMMON, NOBODY, {value: PRICE[COMMON]});
      await artifacts.connect(alice).mint(LEGENDARY, NOBODY, {value: PRICE[LEGENDARY]});

      const common = svgOf(decode(await artifacts.tokenURI(1)).image);
      const legendary = svgOf(decode(await artifacts.tokenURI(2)).image);

      const rings = (svg: string) => (svg.match(/<g>/g) ?? []).length;

      expect(rings(legendary)).to.be.greaterThan(rings(common));
    });

    it('animates only the legendary ones', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(EPIC, NOBODY, {value: PRICE[EPIC]});
      await artifacts.connect(alice).mint(LEGENDARY, NOBODY, {value: PRICE[LEGENDARY]});

      expect(svgOf(decode(await artifacts.tokenURI(1)).image)).to.not.include('animateTransform');
      expect(svgOf(decode(await artifacts.tokenURI(2)).image)).to.include('animateTransform');
    });

    it('is a self-contained SVG, with no server in the loop', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(RARE, NOBODY, {value: PRICE[RARE]});

      const svg = svgOf(decode(await artifacts.tokenURI(1)).image);

      expect(svg.startsWith('<svg')).to.equal(true);
      expect(svg.endsWith('</svg>')).to.equal(true);

      const urls = (svg.match(/https?:\/\/[^"']+/g) ?? []).filter(
        (url) => url !== 'http://www.w3.org/2000/svg',
      );

      expect(urls).to.deep.equal([]);
    });

    it('reverts for a token nobody bought', async () => {
      const {artifacts} = await loadFixture(deploy);

      await expect(artifacts.tokenURI(1)).to.be.revertedWithCustomError(
        artifacts,
        'NonexistentToken',
      );
    });
  });

  describe('ownership', () => {
    it('can be handed to its real owner', async () => {
      const {artifacts, owner, alice} = await loadFixture(deploy);

      await expect(artifacts.transferOwnership(alice.address))
        .to.emit(artifacts, 'OwnerChanged')
        .withArgs(owner.address, alice.address);

      expect(await artifacts.owner()).to.equal(alice.address);
    });

    it('pays the new owner, not the old one', async () => {
      const {artifacts, alice, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(EPIC, NOBODY, {value: PRICE[EPIC]});
      await artifacts.transferOwnership(alice.address);

      await expect(artifacts.connect(alice).withdraw()).to.changeEtherBalance(alice, PRICE[EPIC]);
    });

    it('lets nobody else hand it away', async () => {
      const {artifacts, alice, bob} = await loadFixture(deploy);

      await expect(
        artifacts.connect(alice).transferOwnership(bob.address),
      ).to.be.revertedWithCustomError(artifacts, 'NotOwner');
    });

    it('refuses to hand it to nobody', async () => {
      const {artifacts} = await loadFixture(deploy);

      await expect(
        artifacts.transferOwnership(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(artifacts, 'ZeroAddress');
    });
  });

  describe('proceeds', () => {
    it('pays out to the owner', async () => {
      const {artifacts, owner, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(EPIC, NOBODY, {value: PRICE[EPIC]});

      await expect(artifacts.withdraw()).to.changeEtherBalances(
        [owner, artifacts],
        [PRICE[EPIC], -PRICE[EPIC]],
      );
    });

    it('lets nobody else near the money', async () => {
      const {artifacts, alice} = await loadFixture(deploy);

      await artifacts.connect(alice).mint(EPIC, NOBODY, {value: PRICE[EPIC]});

      await expect(artifacts.connect(alice).withdraw()).to.be.revertedWithCustomError(
        artifacts,
        'NotOwner',
      );
    });
  });
});

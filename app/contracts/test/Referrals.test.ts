import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const COMMON = 0;
const MINT_PRICE = ethers.parseEther('0.001');
const MINT_CUT = MINT_PRICE / 10n; // 10% of the price, paid by the treasury

const LIST_PRICE = ethers.parseEther('0.5');
const FEE = (LIST_PRICE * 250n) / 10_000n; // 2.5%
const FEE_CUT = FEE / 10n; // 10% of the fee, not of the sale

const NOBODY = ethers.ZeroAddress;

describe('Referrals', () => {
  const deploy = async () => {
    const [treasury, alice, bob, carol] = await ethers.getSigners();

    const referrals = await (await ethers.getContractFactory('Referrals')).deploy(treasury.address);

    const artifacts = await (
      await ethers.getContractFactory('EthersWeb3Artifacts')
    ).deploy(treasury.address, await referrals.getAddress());

    const market = await (
      await ethers.getContractFactory('Marketplace')
    ).deploy(treasury.address, await referrals.getAddress());

    await referrals.setCaller(await artifacts.getAddress(), true);
    await referrals.setCaller(await market.getAddress(), true);

    return {
      referrals,
      artifacts,
      market,
      treasury,
      alice,
      bob,
      carol,
      collection: await artifacts.getAddress(),
    };
  };

  describe('recording an invite', () => {
    it('remembers who invited whom, on the buyer’s first purchase', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      // No extra transaction, no extra gas: the invite rides along with the mint
      // the buyer was going to make anyway.
      await expect(artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE}))
        .to.emit(referrals, 'Referred')
        .withArgs(bob.address, alice.address);

      expect(await referrals.referrerOf(bob.address)).to.equal(alice.address);
      expect(await referrals.invited(alice.address)).to.equal(1n);
    });

    it('writes the referrer once and never again', async () => {
      const {referrals, artifacts, alice, bob, carol} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE});
      await artifacts.connect(bob).mint(COMMON, carol.address, {value: MINT_PRICE});

      // Otherwise whoever moved last could steal a stream of earnings from
      // whoever actually did the inviting.
      expect(await referrals.referrerOf(bob.address)).to.equal(alice.address);
      expect(await referrals.invited(carol.address)).to.equal(0n);
    });

    it('ignores self-referral', async () => {
      const {referrals, artifacts, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, bob.address, {value: MINT_PRICE});

      expect(await referrals.referrerOf(bob.address)).to.equal(NOBODY);
    });

    it('lets a purchase through even when the invite is nonsense', async () => {
      const {artifacts, bob} = await loadFixture(deploy);

      // A stale invite link is not a reason to take somebody's transaction down
      // with it — the sale simply proceeds with no referrer.
      await expect(artifacts.connect(bob).mint(COMMON, NOBODY, {value: MINT_PRICE})).to.not.be
        .reverted;
    });

    it('lets nobody but an authorised contract write to it', async () => {
      const {referrals, alice, bob} = await loadFixture(deploy);

      await expect(
        referrals.connect(alice).record(bob.address, alice.address),
      ).to.be.revertedWithCustomError(referrals, 'NotCaller');

      await expect(
        referrals.connect(alice).credit(bob.address, {value: 1n}),
      ).to.be.revertedWithCustomError(referrals, 'NotCaller');
    });
  });

  describe('earning from a mint', () => {
    it('pays the referrer 10% — out of the treasury’s share, not the buyer’s pocket', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      // The buyer pays exactly the listed price either way.
      await expect(
        artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE}),
      ).to.changeEtherBalance(bob, -MINT_PRICE);

      expect(await referrals.earned(alice.address)).to.equal(MINT_CUT);
      expect(await ethers.provider.getBalance(await artifacts.getAddress())).to.equal(
        MINT_PRICE - MINT_CUT,
      );
    });

    it('keeps paying on every later purchase, not just the first', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE});
      await artifacts.connect(bob).mint(COMMON, NOBODY, {value: MINT_PRICE});

      // The referrer is remembered, so the second mint pays them too.
      expect(await referrals.earned(alice.address)).to.equal(MINT_CUT * 2n);
    });

    it('gives the treasury everything when nobody invited the buyer', async () => {
      const {artifacts, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, NOBODY, {value: MINT_PRICE});

      expect(await ethers.provider.getBalance(await artifacts.getAddress())).to.equal(MINT_PRICE);
    });
  });

  describe('earning from a sale', () => {
    const listed = async () => {
      const context = await loadFixture(deploy);
      const {artifacts, market, alice, collection} = context;

      await artifacts.connect(alice).mint(COMMON, NOBODY, {value: MINT_PRICE});
      await artifacts.connect(alice).setApprovalForAll(await market.getAddress(), true);
      await market.connect(alice).list(collection, 1, LIST_PRICE);

      return context;
    };

    it('takes the referrer’s cut out of the market fee, never out of the seller', async () => {
      const {referrals, market, treasury, alice, bob, carol, collection} = await listed();

      await market.connect(bob).buy(collection, 1, carol.address, {value: LIST_PRICE});

      // The seller is paid the same whether or not a referrer exists.
      expect(await market.proceeds(alice.address)).to.equal(LIST_PRICE - FEE);
      expect(await referrals.earned(carol.address)).to.equal(FEE_CUT);
      expect(await market.proceeds(treasury.address)).to.equal(FEE - FEE_CUT);
    });

    it('adds up: seller + treasury + referrer = the price', async () => {
      const {referrals, market, treasury, alice, bob, carol, collection} = await listed();

      await market.connect(bob).buy(collection, 1, carol.address, {value: LIST_PRICE});

      const total =
        (await market.proceeds(alice.address)) +
        (await market.proceeds(treasury.address)) +
        (await referrals.earned(carol.address));

      expect(total).to.equal(LIST_PRICE);
    });

    it('gives the treasury the whole fee when the buyer came in on their own', async () => {
      const {market, treasury, bob, collection} = await listed();

      await market.connect(bob).buy(collection, 1, NOBODY, {value: LIST_PRICE});

      expect(await market.proceeds(treasury.address)).to.equal(FEE);
    });
  });

  describe('withdrawing', () => {
    it('pays the referrer what they have earned', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE});

      await expect(referrals.connect(alice).withdraw()).to.changeEtherBalances(
        [alice, referrals],
        [MINT_CUT, -MINT_CUT],
      );

      expect(await referrals.earned(alice.address)).to.equal(0n);
    });

    it('keeps the lifetime total, so the leaderboard survives a withdrawal', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE});
      await referrals.connect(alice).withdraw();

      const [pending, total, people] = await referrals.statsOf(alice.address);

      expect(pending).to.equal(0n);
      expect(total).to.equal(MINT_CUT);
      expect(people).to.equal(1n);
    });

    it('refuses to pay twice', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      await artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE});
      await referrals.connect(alice).withdraw();

      await expect(referrals.connect(alice).withdraw()).to.be.revertedWithCustomError(
        referrals,
        'NothingToWithdraw',
      );
    });

    it('refuses to pay someone who has invited nobody', async () => {
      const {referrals, carol} = await loadFixture(deploy);

      await expect(referrals.connect(carol).withdraw()).to.be.revertedWithCustomError(
        referrals,
        'NothingToWithdraw',
      );
    });
  });

  describe('the registry itself', () => {
    it('is owned by the treasury, and can be handed over', async () => {
      const {referrals, treasury, alice} = await loadFixture(deploy);

      await expect(referrals.transferOwnership(alice.address))
        .to.emit(referrals, 'OwnerChanged')
        .withArgs(treasury.address, alice.address);
    });

    it('cannot be pointed at a different registry after deployment', async () => {
      const {artifacts, market, referrals} = await loadFixture(deploy);

      // Immutable: a registry the owner could swap out is one nobody can rely on
      // for a stream of earnings.
      expect(await artifacts.referrals()).to.equal(await referrals.getAddress());
      expect(await market.referrals()).to.equal(await referrals.getAddress());
    });

    it('lets the owner revoke a caller', async () => {
      const {referrals, artifacts, alice, bob} = await loadFixture(deploy);

      await referrals.setCaller(await artifacts.getAddress(), false);

      await expect(
        artifacts.connect(bob).mint(COMMON, alice.address, {value: MINT_PRICE}),
      ).to.be.revertedWithCustomError(referrals, 'NotCaller');
    });
  });
});

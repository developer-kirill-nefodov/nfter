import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const PRICE = ethers.parseEther('0.5');
const FEE = (PRICE * 250n) / 10_000n;
const TO_SELLER = PRICE - FEE;

const ARTIFACT_PRICE = ethers.parseEther('0.001');

describe('Marketplace', () => {
  const deploy = async () => {
    const [owner, alice, bob, carol] = await ethers.getSigners();

    const referrals = await (await ethers.getContractFactory('Referrals')).deploy(owner.address);
    const market = await (await ethers.getContractFactory('Marketplace')).deploy(
      owner.address,
      await referrals.getAddress(),
    );
    const artifacts = await (
      await ethers.getContractFactory('EthersWeb3Artifacts')
    ).deploy(owner.address, await referrals.getAddress());

    await referrals.setCaller(await market.getAddress(), true);
    await referrals.setCaller(await artifacts.getAddress(), true);

    await artifacts.connect(alice).mint(0, ethers.ZeroAddress, {value: ARTIFACT_PRICE});
    await artifacts.connect(alice).setApprovalForAll(await market.getAddress(), true);

    return {
      market,
      artifacts,
      referrals,
      owner,
      alice,
      bob,
      carol,
      collection: await artifacts.getAddress(),
    };
  };

  const NOBODY = ethers.ZeroAddress;

  describe('listing', () => {
    it('lists a token the seller owns', async () => {
      const {market, alice, collection} = await loadFixture(deploy);

      await expect(market.connect(alice).list(collection, 1, PRICE))
        .to.emit(market, 'Listed')
        .withArgs(alice.address, collection, 1n, PRICE);

      const [seller, price] = await market.listingOf(collection, 1);

      expect(seller).to.equal(alice.address);
      expect(price).to.equal(PRICE);
    });

    it('leaves the token with its owner — the market takes an approval, not custody', async () => {
      const {market, artifacts, alice, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      expect(await artifacts.ownerOf(1)).to.equal(alice.address);
    });

    it('refuses to list somebody else’s token', async () => {
      const {market, bob, collection} = await loadFixture(deploy);

      await expect(market.connect(bob).list(collection, 1, PRICE)).to.be.revertedWithCustomError(
        market,
        'NotOwner',
      );
    });

    it('refuses to list a token it has not been approved to move', async () => {
      const {market, artifacts, alice, collection} = await loadFixture(deploy);

      await artifacts.connect(alice).setApprovalForAll(await market.getAddress(), false);

      await expect(market.connect(alice).list(collection, 1, PRICE)).to.be.revertedWithCustomError(
        market,
        'NotApproved',
      );
    });

    it('refuses a price of nothing, and a double listing', async () => {
      const {market, alice, collection} = await loadFixture(deploy);

      await expect(market.connect(alice).list(collection, 1, 0)).to.be.revertedWithCustomError(
        market,
        'ZeroPrice',
      );

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(
        market.connect(alice).list(collection, 1, PRICE),
      ).to.be.revertedWithCustomError(market, 'AlreadyListed');
    });

    it('lets the new owner relist a token whose stale listing outlived a transfer', async () => {
      const {market, artifacts, alice, bob, collection} = await loadFixture(deploy);

      // Alice lists, then hands the token to Bob directly — the stale listing is never cancelled.
      await market.connect(alice).list(collection, 1, PRICE);
      await artifacts.connect(alice).transferFrom(alice.address, bob.address, 1);

      // Bob cannot cancel Alice's listing (he is not the recorded seller); without the fix he could
      // not list either, and the token would be stuck forever. The new owner must be able to relist.
      await artifacts.connect(bob).setApprovalForAll(await market.getAddress(), true);

      await expect(market.connect(bob).list(collection, 1, PRICE * 2n))
        .to.emit(market, 'Listed')
        .withArgs(bob.address, collection, 1n, PRICE * 2n);

      const [seller, price] = await market.listingOf(collection, 1);

      expect(seller).to.equal(bob.address);
      expect(price).to.equal(PRICE * 2n);
    });
  });

  describe('buying', () => {
    it('moves the token and credits the money', async () => {
      const {market, artifacts, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE}))
        .to.emit(market, 'Sold')
        .withArgs(bob.address, collection, 1n, alice.address, PRICE, FEE);

      expect(await artifacts.ownerOf(1)).to.equal(bob.address);
      expect(await market.proceeds(alice.address)).to.equal(TO_SELLER);
    });

    it('lets a no-referrer sale go through even if the referral caller is revoked', async () => {
      const {market, referrals, artifacts, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      // An operator revokes the marketplace's referral-registry authorization. A plain no-referrer
      // buy must not depend on that authorization and must still settle.
      await referrals.setCaller(await market.getAddress(), false);

      await expect(market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE})).to.emit(
        market,
        'Sold',
      );

      expect(await artifacts.ownerOf(1)).to.equal(bob.address);
    });

    it('takes 2.5% and gives the rest to the seller', async () => {
      const {market, owner, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE});

      const [fee, toSeller] = await market.quote(PRICE);

      expect(fee).to.equal(FEE);
      expect(toSeller).to.equal(TO_SELLER);
      expect(await market.proceeds(owner.address)).to.equal(FEE);
      expect(fee + toSeller).to.equal(PRICE);
    });

    it('pays nobody during the sale — the ETH waits in the contract', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(
        market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE}),
      ).to.changeEtherBalances([bob, alice, market], [-PRICE, 0, PRICE]);
    });

    it('clears the listing, so it cannot be bought twice', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE});

      const [, price] = await market.listingOf(collection, 1);
      expect(price).to.equal(0n);

      await expect(
        market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE}),
      ).to.be.revertedWithCustomError(market, 'NotListed');
    });

    it('demands the exact price', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(
        market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE - 1n}),
      ).to.be.revertedWithCustomError(market, 'WrongPrice');

      await expect(
        market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE + 1n}),
      ).to.be.revertedWithCustomError(market, 'WrongPrice');
    });

    it('will not let a seller buy from themselves', async () => {
      const {market, alice, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(
        market.connect(alice).buy(collection, 1, NOBODY, {value: PRICE}),
      ).to.be.revertedWithCustomError(market, 'OwnSale');
    });
  });

  describe('cancelling', () => {
    it('takes the listing down', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(market.connect(alice).cancel(collection, 1))
        .to.emit(market, 'Cancelled')
        .withArgs(alice.address, collection, 1n);

      await expect(
        market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE}),
      ).to.be.revertedWithCustomError(market, 'NotListed');
    });

    it('lets nobody but the seller cancel', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(market.connect(bob).cancel(collection, 1)).to.be.revertedWithCustomError(
        market,
        'NotOwner',
      );
    });
  });

  describe('ownership', () => {
    it('hands the fee stream over', async () => {
      const {market, owner, alice} = await loadFixture(deploy);

      await expect(market.transferOwnership(alice.address))
        .to.emit(market, 'OwnerChanged')
        .withArgs(owner.address, alice.address);

      expect(await market.owner()).to.equal(alice.address);
    });

    it('leaves fees already credited where they are', async () => {
      const {market, owner, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE});

      await market.transferOwnership(bob.address);

      expect(await market.proceeds(owner.address)).to.equal(FEE);
      expect(await market.proceeds(bob.address)).to.equal(0n);
    });

    it('lets nobody else hand it away', async () => {
      const {market, alice, bob} = await loadFixture(deploy);

      await expect(
        market.connect(alice).transferOwnership(bob.address),
      ).to.be.revertedWithCustomError(market, 'NotOwner');
    });
  });

  describe('withdrawing', () => {
    it('pays the seller what they are owed', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE});

      await expect(market.connect(alice).withdraw()).to.changeEtherBalances(
        [alice, market],
        [TO_SELLER, -TO_SELLER],
      );

      expect(await market.proceeds(alice.address)).to.equal(0n);
    });

    it('pays the market its fees', async () => {
      const {market, owner, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE});

      await expect(market.connect(owner).withdraw()).to.changeEtherBalance(owner, FEE);
    });

    it('refuses to pay out twice', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, NOBODY, {value: PRICE});
      await market.connect(alice).withdraw();

      await expect(market.connect(alice).withdraw()).to.be.revertedWithCustomError(
        market,
        'NothingToWithdraw',
      );
    });

    it('refuses to pay someone who has sold nothing', async () => {
      const {market, bob} = await loadFixture(deploy);

      await expect(market.connect(bob).withdraw()).to.be.revertedWithCustomError(
        market,
        'NothingToWithdraw',
      );
    });
  });
});

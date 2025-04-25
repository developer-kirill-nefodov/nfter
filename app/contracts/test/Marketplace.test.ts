import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const PRICE = ethers.parseEther('0.5');
const FEE = (PRICE * 250n) / 10_000n;
const TO_SELLER = PRICE - FEE;

const ARTIFACT_PRICE = ethers.parseEther('0.001');

describe('Marketplace', () => {
  const deploy = async () => {
    const [owner, alice, bob] = await ethers.getSigners();

    const market = await (await ethers.getContractFactory('Marketplace')).deploy(owner.address);
    const artifacts = await (
      await ethers.getContractFactory('EthersWeb3Artifacts')
    ).deploy(owner.address);

    // Alice buys an artifact, then approves the market to move it for her.
    await artifacts.connect(alice).mint(0, {value: ARTIFACT_PRICE});
    await artifacts.connect(alice).setApprovalForAll(await market.getAddress(), true);

    return {market, artifacts, owner, alice, bob, collection: await artifacts.getAddress()};
  };

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

      // A market that cannot lose your token is a market you do not have to trust.
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

      // Better to fail here than to let a buyer discover it after paying.
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
  });

  describe('buying', () => {
    it('moves the token and credits the money', async () => {
      const {market, artifacts, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(market.connect(bob).buy(collection, 1, {value: PRICE}))
        .to.emit(market, 'Sold')
        .withArgs(bob.address, collection, 1n, alice.address, PRICE, FEE);

      expect(await artifacts.ownerOf(1)).to.equal(bob.address);
      expect(await market.proceeds(alice.address)).to.equal(TO_SELLER);
    });

    it('takes 2.5% and gives the rest to the seller', async () => {
      const {market, owner, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, {value: PRICE});

      const [fee, toSeller] = await market.quote(PRICE);

      expect(fee).to.equal(FEE);
      expect(toSeller).to.equal(TO_SELLER);
      expect(await market.proceeds(owner.address)).to.equal(FEE);
      expect(fee + toSeller).to.equal(PRICE);
    });

    it('pays nobody during the sale — the ETH waits in the contract', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      // Pushing ETH to the seller mid-purchase is what lets a hostile seller
      // re-enter, or revert and take the buyer down with them.
      await expect(
        market.connect(bob).buy(collection, 1, {value: PRICE}),
      ).to.changeEtherBalances([bob, alice, market], [-PRICE, 0, PRICE]);
    });

    it('clears the listing, so it cannot be bought twice', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, {value: PRICE});

      const [, price] = await market.listingOf(collection, 1);
      expect(price).to.equal(0n);

      await expect(
        market.connect(bob).buy(collection, 1, {value: PRICE}),
      ).to.be.revertedWithCustomError(market, 'NotListed');
    });

    it('demands the exact price', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      await expect(
        market.connect(bob).buy(collection, 1, {value: PRICE - 1n}),
      ).to.be.revertedWithCustomError(market, 'WrongPrice');

      await expect(
        market.connect(bob).buy(collection, 1, {value: PRICE + 1n}),
      ).to.be.revertedWithCustomError(market, 'WrongPrice');
    });

    it('will not let a seller buy from themselves', async () => {
      const {market, alice, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);

      // Wash trading is not a feature.
      await expect(
        market.connect(alice).buy(collection, 1, {value: PRICE}),
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
        market.connect(bob).buy(collection, 1, {value: PRICE}),
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
      await market.connect(bob).buy(collection, 1, {value: PRICE});

      await market.transferOwnership(bob.address);

      // Moving somebody else's credited balance would be theft, however well
      // intentioned: the fee was earned while the old owner held the contract.
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
      await market.connect(bob).buy(collection, 1, {value: PRICE});

      await expect(market.connect(alice).withdraw()).to.changeEtherBalances(
        [alice, market],
        [TO_SELLER, -TO_SELLER],
      );

      expect(await market.proceeds(alice.address)).to.equal(0n);
    });

    it('pays the market its fees', async () => {
      const {market, owner, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, {value: PRICE});

      await expect(market.connect(owner).withdraw()).to.changeEtherBalance(owner, FEE);
    });

    it('refuses to pay out twice', async () => {
      const {market, alice, bob, collection} = await loadFixture(deploy);

      await market.connect(alice).list(collection, 1, PRICE);
      await market.connect(bob).buy(collection, 1, {value: PRICE});
      await market.connect(alice).withdraw();

      // The balance is zeroed before the transfer, so a re-entering seller finds
      // nothing left to claim.
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

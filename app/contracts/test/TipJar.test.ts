import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const ONE_TENTH = ethers.parseEther('0.1');

describe('TipJar', () => {
  const deploy = async () => {
    const [owner, alice, bob] = await ethers.getSigners();
    const jar = await (await ethers.getContractFactory('TipJar')).deploy(owner.address);

    return {jar, owner, alice, bob};
  };

  describe('tipping', () => {
    it('records the tip and announces it', async () => {
      const {jar, alice} = await loadFixture(deploy);

      await expect(jar.connect(alice).tip('good luck', {value: ONE_TENTH}))
        .to.emit(jar, 'Tipped')
        .withArgs(alice.address, ONE_TENTH, 'good luck', (t: bigint) => t > 0n);

      expect(await jar.balance()).to.equal(ONE_TENTH);
      expect(await jar.totalTips()).to.equal(ONE_TENTH);
      expect(await jar.tipCount()).to.equal(1n);
    });

    it('makes the feed readable with nothing but an RPC node', async () => {
      const {jar, alice, bob} = await loadFixture(deploy);

      await jar.connect(alice).tip('first', {value: ONE_TENTH});
      await jar.connect(bob).tip('second', {value: ONE_TENTH * 2n});

      const events = await jar.queryFilter(jar.filters.Tipped());

      expect(events.map((e) => e.args.message)).to.deep.equal(['first', 'second']);
      expect(events[1]!.args.amount).to.equal(ONE_TENTH * 2n);
    });

    it('rejects a tip of nothing', async () => {
      const {jar, alice} = await loadFixture(deploy);

      await expect(jar.connect(alice).tip('hi', {value: 0})).to.be.revertedWithCustomError(
        jar,
        'EmptyTip',
      );
    });

    it('rejects a message longer than the contract will store', async () => {
      const {jar, alice} = await loadFixture(deploy);

      await expect(
        jar.connect(alice).tip('x'.repeat(141), {value: ONE_TENTH}),
      ).to.be.revertedWithCustomError(jar, 'MessageTooLong');

      await expect(jar.connect(alice).tip('x'.repeat(140), {value: ONE_TENTH})).to.not.be.reverted;
    });

    it('counts a bare send as a tip with no message', async () => {
      const {jar, alice} = await loadFixture(deploy);

      await expect(alice.sendTransaction({to: await jar.getAddress(), value: ONE_TENTH}))
        .to.emit(jar, 'Tipped')
        .withArgs(alice.address, ONE_TENTH, '', (t: bigint) => t > 0n);
    });
  });

  describe('withdrawing', () => {
    it('pays the whole balance out to the owner', async () => {
      const {jar, owner, alice} = await loadFixture(deploy);

      await jar.connect(alice).tip('thanks', {value: ONE_TENTH});

      await expect(jar.withdraw()).to.changeEtherBalances([owner, jar], [ONE_TENTH, -ONE_TENTH]);
    });

    it('lets nobody but the owner touch the money', async () => {
      const {jar, alice} = await loadFixture(deploy);

      await jar.connect(alice).tip('thanks', {value: ONE_TENTH});

      await expect(jar.connect(alice).withdraw()).to.be.revertedWithCustomError(jar, 'NotOwner');
    });

    it('refuses to withdraw an empty jar', async () => {
      const {jar} = await loadFixture(deploy);

      await expect(jar.withdraw()).to.be.revertedWithCustomError(jar, 'NothingToWithdraw');
    });

    it('keeps the running totals after a withdrawal — they are lifetime figures', async () => {
      const {jar, alice} = await loadFixture(deploy);

      await jar.connect(alice).tip('thanks', {value: ONE_TENTH});
      await jar.withdraw();

      expect(await jar.balance()).to.equal(0n);
      expect(await jar.totalTips()).to.equal(ONE_TENTH);
    });
  });

  describe('ownership', () => {
    it('hands the jar over', async () => {
      const {jar, owner, alice} = await loadFixture(deploy);

      await expect(jar.transferOwnership(alice.address))
        .to.emit(jar, 'OwnerChanged')
        .withArgs(owner.address, alice.address);

      expect(await jar.owner()).to.equal(alice.address);
    });

    it('refuses to hand it to nobody', async () => {
      const {jar} = await loadFixture(deploy);

      await expect(jar.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        jar,
        'ZeroAddress',
      );
    });

    it('will not be constructed ownerless', async () => {
      const factory = await ethers.getContractFactory('TipJar');

      await expect(factory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        factory,
        'ZeroAddress',
      );
    });
  });
});

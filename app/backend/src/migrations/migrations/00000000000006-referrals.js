module.exports = {
  async up(queryInterface, Sequelize) {
    // A code, not a raw address: an invite link should be short enough to say out
    // loud, and it must exist before the invitee has a wallet at all.
    await queryInterface.addColumn('users', 'referral_code', {
      type: Sequelize.STRING(16),
      allowNull: true,
      unique: true,
    });

    // Who invited them. Kept even after the on-chain link is made, because the
    // chain only learns about it at the first purchase — and some users never buy.
    await queryInterface.addColumn('users', 'referred_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {model: 'users', key: 'id'},
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('users', ['referral_code'], {
      name: 'users_referral_code_idx',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_referral_code_idx');
    await queryInterface.removeColumn('users', 'referred_by');
    await queryInterface.removeColumn('users', 'referral_code');
  },
};

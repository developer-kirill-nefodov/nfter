module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'referral_code', {
      type: Sequelize.STRING(16),
      allowNull: true,
      unique: true,
    });

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

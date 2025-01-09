module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'wallet_address', {
      type: Sequelize.STRING(42),
      allowNull: true,
      unique: true,
    });

    // A wallet-first account has no email and no password, so both credentials
    // become optional; the row is identified by its id alone.
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addIndex('users', ['wallet_address'], {
      name: 'users_wallet_address_idx',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_wallet_address_idx');
    await queryInterface.removeColumn('users', 'wallet_address');

    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};

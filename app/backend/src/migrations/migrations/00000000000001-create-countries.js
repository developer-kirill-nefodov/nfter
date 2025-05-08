module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('countries', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      countries: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      iso2: {
        type: Sequelize.STRING(2),
        allowNull: false,
        unique: true,
      },
      iso3: {
        type: Sequelize.STRING(3),
        allowNull: false,
        unique: true,
      },
      lang: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('countries');
  },
};

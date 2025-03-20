module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chain_events', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      contract: {
        type: Sequelize.STRING(42),
        allowNull: false,
      },
      event: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      block_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tx_hash: {
        type: Sequelize.STRING(66),
        allowNull: false,
      },
      log_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      args: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      created_at: {type: Sequelize.DATE, allowNull: false},
      updated_at: {type: Sequelize.DATE, allowNull: false},
    });

    // (tx_hash, log_index) identifies a log uniquely on a chain. Making it unique
    // is what lets the indexer re-scan a range — after a restart, or across a
    // reorg — without ever double-counting a tip.
    await queryInterface.addIndex('chain_events', ['tx_hash', 'log_index'], {
      name: 'chain_events_log_uniq',
      unique: true,
    });

    await queryInterface.addIndex('chain_events', ['contract', 'event', 'block_number'], {
      name: 'chain_events_lookup_idx',
    });

    await queryInterface.createTable('indexer_state', {
      contract: {
        type: Sequelize.STRING(42),
        allowNull: false,
        primaryKey: true,
      },
      last_block: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {type: Sequelize.DATE, allowNull: false},
      updated_at: {type: Sequelize.DATE, allowNull: false},
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('indexer_state');
    await queryInterface.dropTable('chain_events');
  },
};

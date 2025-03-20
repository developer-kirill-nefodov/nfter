import {DataTypes} from 'sequelize';

import {db} from '../db';
import type {IChainEventModel, IIndexerStateModel} from '../interfaces/models/chain-event';

/**
 * Every log the indexer has seen, kept locally.
 *
 * Public RPC nodes will not serve historical `eth_getLogs` — they cap the range
 * at a few dozen blocks and want money for anything older. So the app follows the
 * head in small windows and keeps its own copy. Reading a tip feed then costs a
 * SELECT rather than an archive query, and the history survives whatever the RPC
 * provider decides to do next.
 */
export const ChainEventModel = db.define<IChainEventModel>(
  'chain_event',
  {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    contract: {type: DataTypes.STRING(42), allowNull: false},
    event: {type: DataTypes.STRING(64), allowNull: false},
    block_number: {type: DataTypes.INTEGER, allowNull: false},
    tx_hash: {type: DataTypes.STRING(66), allowNull: false},
    log_index: {type: DataTypes.INTEGER, allowNull: false},
    args: {type: DataTypes.JSONB, allowNull: false},
  },
  {
    tableName: 'chain_events',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{unique: true, fields: ['tx_hash', 'log_index']}],
  },
);

export const IndexerStateModel = db.define<IIndexerStateModel>(
  'indexer_state',
  {
    contract: {type: DataTypes.STRING(42), primaryKey: true},
    last_block: {type: DataTypes.INTEGER, allowNull: false},
  },
  {
    tableName: 'indexer_state',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

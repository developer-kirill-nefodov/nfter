import type {Model, Optional} from 'sequelize';

import type {ModelAttributes} from './';

export interface IChainEventData extends ModelAttributes {
  contract: string;
  event: string;
  block_number: number;
  tx_hash: string;
  log_index: number;
  args: Record<string, string>;
}

export interface IChainEventModel
  extends Model<IChainEventData, Optional<IChainEventData, 'id'>>,
    IChainEventData {}

export interface IIndexerStateData {
  contract: string;
  last_block: number;
}

export interface IIndexerStateModel
  extends Model<IIndexerStateData, IIndexerStateData>,
    IIndexerStateData {}

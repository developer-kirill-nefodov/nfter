import type {Model, Optional} from 'sequelize';

import type {ModelAttributes} from './';

export type INamePermissions = 'block_user' | 'delete_user' | 'assign_roles';

export type IRoleName = 'ADMIN' | 'USER' | 'MODERATOR';

export interface IRole {
  name: IRoleName;
  permissions: {
    [key in INamePermissions]?: boolean;
  };
}

/**
 * An account is reachable through either credential — email+password or a wallet
 * — so both sides are nullable and the row is identified by `id` alone. A
 * wallet-first user has no email until they choose to add one.
 */
export interface IUserModelData extends ModelAttributes {
  email: string | null;
  password: string | null;
  /** Lowercased checksum-validated address, or null until a wallet is linked. */
  wallet_address: string | null;
  role: IRole;
}

type IUserCreation = Optional<IUserModelData, 'id' | 'email' | 'password' | 'wallet_address'>;

export interface IUserModel extends Model<IUserModelData, IUserCreation>, IUserModelData {}

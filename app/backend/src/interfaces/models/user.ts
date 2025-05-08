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

export interface IUserModelData extends ModelAttributes {
  email: string | null;
  password: string | null;
  wallet_address: string | null;
  role: IRole;
  referral_code: string | null;
  referred_by: number | null;
}

type IUserCreation = Optional<
  IUserModelData,
  'id' | 'email' | 'password' | 'wallet_address' | 'referral_code' | 'referred_by'
>;

export interface IUserModel extends Model<IUserModelData, IUserCreation>, IUserModelData {}

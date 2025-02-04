export type IRoleName = 'VISITOR' | 'USER' | 'MODERATOR' | 'ADMIN';

export type INamePermissions = 'block_user' | 'delete_user' | 'assign_roles';

export interface IRole {
  name: IRoleName;
  permissions: Partial<Record<INamePermissions, boolean>>;
}

export interface IUser {
  id?: number;
  email: string | null;
  walletAddress: string | null;
  role: IRole;
}

export const VISITOR: IUser = {
  email: null,
  walletAddress: null,
  role: {name: 'VISITOR', permissions: {}},
};

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
  /**
   * Derived from the chain, never stored: the founder is whoever owns the
   * contracts. The server checks it; this is only what it reported.
   */
  isFounder?: boolean;
}

export const VISITOR: IUser = {
  email: null,
  walletAddress: null,
  role: {name: 'VISITOR', permissions: {}},
};

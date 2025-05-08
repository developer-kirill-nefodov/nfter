import argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export const hashPassword = (password: string): Promise<string> =>
  argon2.hash(password, ARGON2_OPTIONS);

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};

export const needsRehash = (hash: string): boolean => argon2.needsRehash(hash, ARGON2_OPTIONS);

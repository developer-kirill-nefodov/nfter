import {describe, expect, it} from 'vitest';

import {hashPassword, needsRehash, verifyPassword} from '../src/helpers/user';
import {loginValidator, registerValidator} from '../src/middlewares/validators/auth.validators';

describe('password hashing', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('CorrectHorse123');

    await expect(verifyPassword(hash, 'CorrectHorse123')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'CorrectHorse124')).resolves.toBe(false);
  });

  it('salts every hash, so identical passwords do not collide', async () => {
    const [first, second] = await Promise.all([
      hashPassword('CorrectHorse123'),
      hashPassword('CorrectHorse123'),
    ]);

    expect(first).not.toBe(second);
  });

  it('treats a malformed hash as a failed login rather than throwing', async () => {
    await expect(verifyPassword('not-a-hash', 'CorrectHorse123')).resolves.toBe(false);
  });

  it('does not ask to rehash a hash made with the current parameters', async () => {
    expect(needsRehash(await hashPassword('CorrectHorse123'))).toBe(false);
  });
});

describe('registration policy', () => {
  it.each([
    ['short1A', 'shorter than 12 characters'],
    ['alllowercase123', 'no uppercase letter'],
    ['ALLUPPERCASE123', 'no lowercase letter'],
    ['NoDigitsInHere', 'no digit'],
  ])('rejects %s (%s)', (password) => {
    const {error} = registerValidator.validate({email: 'a@b.dev', password});

    expect(error).toBeDefined();
  });

  it('accepts a password that meets the policy', () => {
    const {error} = registerValidator.validate({email: 'a@b.dev', password: 'DevPassword123'});

    expect(error).toBeUndefined();
  });

  it('does not apply the policy at login, where it would leak which accounts are legacy', () => {
    const {error} = loginValidator.validate({email: 'a@b.dev', password: 'root'});

    expect(error).toBeUndefined();
  });
});

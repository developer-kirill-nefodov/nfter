import request from 'supertest';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createRedisMock} from './redis-mock';

const redis = createRedisMock();
const emailJobs: unknown[] = [];

vi.mock('../src/db', () => ({redis, db: {define: () => ({})}}));
vi.mock('../src/workers/email.queue', () => ({
  addEmailJob: vi.fn(async (job: unknown) => void emailJobs.push(job)),
}));

interface IFakeUser {
  id: number;
  email: string | null;
  password: string | null;
  wallet_address: string | null;
  role: {name: string; permissions: Record<string, boolean>};
  update: (values: Partial<IFakeUser>) => Promise<IFakeUser>;
}

const users: IFakeUser[] = [];

const makeUser = (values: Partial<IFakeUser>): IFakeUser => {
  const user: IFakeUser = {
    id: users.length + 1,
    email: null,
    password: null,
    wallet_address: null,
    role: {name: 'USER', permissions: {}},
    ...values,
    update: async (patch) => Object.assign(user, patch),
  };

  users.push(user);
  return user;
};

const matches = (user: IFakeUser, where: Record<string, unknown>) =>
  Object.entries(where).every(([key, value]) => user[key as keyof IFakeUser] === value);

const UserModel = {
  scope: () => UserModel,
  findOne: vi.fn(async ({where}: {where: Record<string, unknown>}) =>
    users.find((user) => matches(user, where)),
  ),
  findByPk: vi.fn(async (id: number) => users.find((user) => user.id === id)),
  create: vi.fn(async (values: Partial<IFakeUser>) => makeUser(values)),
};

vi.mock('../src/models/user.model', () => ({default: UserModel}));

const {createApp} = await import('../src/app');
const {hashPassword} = await import('../src/helpers/user');

const app = createApp();

const PASSWORD = 'DevPassword123';

describe('auth routes', () => {
  beforeEach(async () => {
    users.length = 0;
    emailJobs.length = 0;
    redis.store.clear();

    makeUser({email: 'user@ethers-web3.dev', password: await hashPassword(PASSWORD)});
  });

  it('logs in and returns an access token plus an httpOnly refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/auth');
  });

  it('answers a wrong password and an unknown email identically', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: 'WrongPassword123'});

    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({email: 'nobody@ethers-web3.dev', password: PASSWORD});

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it('rejects a weak password at registration with per-field detail', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({email: 'new@ethers-web3.dev', password: 'root'});

    expect(res.status).toBe(422);
    expect(res.body.details[0].field).toBe('password');
  });

  it('reports who the caller is, and treats an anonymous caller as a visitor', async () => {
    const anonymous = await request(app).get('/api/auth/me');

    expect(anonymous.status).toBe(200);
    expect(anonymous.body.role.name).toBe('VISITOR');

    const {body} = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    const authorized = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`);

    expect(authorized.status).toBe(200);
    expect(authorized.body.email).toBe('user@ethers-web3.dev');
  });

  it('makes the access token unusable after logout', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    const token = login.body.token as string;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(after.body.role.name).toBe('VISITOR');
  });

  it('rotates the refresh token, so a captured one cannot be spent twice', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    const cookie = login.headers['set-cookie'];

    await request(app).post('/api/auth/refresh-token').set('Cookie', cookie).expect(200);
    await request(app).post('/api/auth/refresh-token').set('Cookie', cookie).expect(403);
  });

  it('says the same thing whether or not the email has an account', async () => {
    const known = await request(app)
      .post('/api/auth/forgot-password')
      .send({email: 'user@ethers-web3.dev'});

    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({email: 'nobody@ethers-web3.dev'});

    expect(known.body).toEqual(unknown.body);
    expect(emailJobs).toHaveLength(1);
  });

  it('refuses a wallet nonce to a caller who is not signed in', async () => {
    await request(app).get('/api/auth/nonce').expect(403);
    await request(app).post('/api/auth/wallet-link').send({}).expect(403);
    await request(app).post('/api/auth/wallet-unlink').expect(403);
  });

  it('serves a nonce to a signed-in caller', async () => {
    const {body} = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    const res = await request(app)
      .get('/api/auth/nonce')
      .set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.nonce).toEqual(expect.any(String));
  });

  it('unlinks a wallet and hands back a session that no longer claims one', async () => {
    users[0]!.wallet_address = '0xc78383353cd8f5315d3e147bb607a3bdc844ef22';

    const login = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    expect(login.body.user.walletAddress).toBe('0xc78383353cd8f5315d3e147bb607a3bdc844ef22');

    const res = await request(app)
      .post('/api/auth/wallet-unlink')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.walletAddress).toBeNull();
    expect(users[0]!.wallet_address).toBeNull();
  });

  it('refuses to unlink when there is nothing linked', async () => {
    const {body} = await request(app)
      .post('/api/auth/login')
      .send({email: 'user@ethers-web3.dev', password: PASSWORD});

    await request(app)
      .post('/api/auth/wallet-unlink')
      .set('Authorization', `Bearer ${body.token}`)
      .expect(400);
  });

  it('404s an unknown route as JSON instead of an HTML stack trace', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('does not exist');
  });
});

const argon2 = require('argon2');

// Development fixtures. The password satisfies the live password policy and is
// hashed with the same Argon2id parameters the app uses at runtime, so these
// accounts log in through exactly the code path a real user does.
const DEV_PASSWORD = 'DevPassword123';

const hash = (password) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

module.exports = {
  async up(queryInterface) {
    const password = await hash(DEV_PASSWORD);
    const timestamps = {created_at: new Date(), updated_at: new Date()};

    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@ethers-web3.dev',
        password,
        wallet_address: null,
        role: JSON.stringify({
          name: 'ADMIN',
          permissions: {block_user: true, delete_user: true, assign_roles: true},
        }),
        ...timestamps,
      },
      {
        email: 'user@ethers-web3.dev',
        password,
        wallet_address: null,
        role: JSON.stringify({name: 'USER', permissions: {}}),
        ...timestamps,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};

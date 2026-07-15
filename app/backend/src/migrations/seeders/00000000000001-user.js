const argon2 = require('argon2');

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
    // These are development fixtures with a hardcoded, public password — including a full ADMIN.
    // Refuse to seed them into a production database, where they would be a live backdoor.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Refusing to seed development users (including a hardcoded admin) in production. ' +
          'These fixtures are for local/dev only.',
      );
    }

    const password = await hash(DEV_PASSWORD);
    const timestamps = {created_at: new Date(), updated_at: new Date()};

    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@nfter.dev',
        password,
        wallet_address: null,
        role: JSON.stringify({
          name: 'ADMIN',
          permissions: {block_user: true, delete_user: true, assign_roles: true},
        }),
        ...timestamps,
      },
      {
        email: 'user@nfter.dev',
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

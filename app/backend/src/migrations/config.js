const env = process.env.NODE_ENV || 'development';

module.exports = {
  [env]: {
    dialect: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    migrationStorageTableName: 'SequelizeMeta',
  },
};

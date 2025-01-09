const data = require('../data/translations.json');

const COUNTRIES = [
  {countries: 'United States', iso2: 'US', iso3: 'USA', lang: 'English'},
  {countries: 'Germany', iso2: 'DE', iso3: 'DEU', lang: 'German'},
  {countries: 'China', iso2: 'CN', iso3: 'CHN', lang: 'Chinese'},
  {countries: 'Ukraine', iso2: 'UA', iso3: 'UKR', lang: 'Ukrainian'},
];

const timestamps = () => ({created_at: new Date(), updated_at: new Date()});

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'countries',
      COUNTRIES.map((country) => ({...country, ...timestamps()})),
    );

    await queryInterface.bulkInsert(
      'translations',
      COUNTRIES.map(({iso2}) => ({
        language: iso2,
        data: JSON.stringify(data[iso2]),
        ...timestamps(),
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('translations', null, {});
    await queryInterface.bulkDelete('countries', null, {});
  },
};

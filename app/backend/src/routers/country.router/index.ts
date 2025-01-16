import {getCountriesLangController} from '../../controllers/country';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const CountryRouter: IAnyRouter = {
  prefix: 'countries',
  routeData: [
    {
      method: 'get',
      path: 'lang',
      middleware: [apiLimiter],
      handler: getCountriesLangController,
    },
  ],
};

export default CountryRouter;

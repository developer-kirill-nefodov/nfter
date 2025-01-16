import {getByLanguageController} from '../../controllers/translation';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const TranslationRouter: IAnyRouter = {
  prefix: 'translations',
  routeData: [
    {
      method: 'get',
      path: ':lang',
      middleware: [apiLimiter],
      handler: getByLanguageController,
    },
  ],
};

export default TranslationRouter;

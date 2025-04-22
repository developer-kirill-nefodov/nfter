import {getMarketController} from '../../controllers/market';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const MarketRouter: IAnyRouter = {
  prefix: 'market',
  routeData: [
    {
      method: 'get',
      path: 'book',
      middleware: [apiLimiter],
      handler: getMarketController,
    },
  ],
};

export default MarketRouter;

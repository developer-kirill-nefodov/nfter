import {getCollectorsController, getStatsController} from '../../controllers/stats';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const StatsRouter: IAnyRouter = {
  prefix: 'stats',
  routeData: [
    {
      method: 'get',
      path: 'public',
      middleware: [apiLimiter],
      handler: getStatsController,
    },
    {
      method: 'get',
      path: 'collectors',
      middleware: [apiLimiter],
      handler: getCollectorsController,
    },
  ],
};

export default StatsRouter;

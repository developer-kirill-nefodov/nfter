import {
  getActivityController,
  getChainController,
  getCollectorsController,
  getStatsController,
} from '../../controllers/stats';
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
    {
      method: 'get',
      path: 'chain',
      middleware: [apiLimiter],
      handler: getChainController,
    },
    {
      method: 'get',
      path: 'activity',
      middleware: [apiLimiter],
      handler: getActivityController,
    },
  ],
};

export default StatsRouter;

import {getLeaderboardController, getTipsController} from '../../controllers/tip';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const TipRouter: IAnyRouter = {
  prefix: 'tips',
  routeData: [
    {
      method: 'get',
      path: 'feed',
      middleware: [apiLimiter],
      handler: getTipsController,
    },
    {
      method: 'get',
      path: 'leaderboard',
      middleware: [apiLimiter],
      handler: getLeaderboardController,
    },
  ],
};

export default TipRouter;

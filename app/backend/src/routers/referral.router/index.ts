import {
  getInvitersController,
  getMyReferralsController,
  getTreasuryController,
} from '../../controllers/referral';
import {authed, isAuthorized} from '../../middlewares/guard';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const ReferralRouter: IAnyRouter = {
  prefix: 'referrals',
  routeData: [
    {
      method: 'get',
      path: 'me',
      middleware: [apiLimiter, isAuthorized],
      handler: authed(getMyReferralsController),
    },
    {
      method: 'get',
      path: 'inviters',
      middleware: [apiLimiter],
      handler: getInvitersController,
    },
    {
      method: 'get',
      path: 'treasury',
      middleware: [apiLimiter, isAuthorized],
      handler: authed(getTreasuryController),
    },
  ],
};

export default ReferralRouter;

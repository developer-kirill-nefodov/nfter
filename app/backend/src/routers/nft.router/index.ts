import {getNftsController} from '../../controllers/nft';
import {authed, isAuthorized} from '../../middlewares/guard';
import {apiLimiter} from '../../middlewares/rate-limit';
import type {IAnyRouter} from '../index';

const NftRouter: IAnyRouter = {
  prefix: 'nft',
  routeData: [
    {
      method: 'get',
      path: 'my-collection',
      middleware: [apiLimiter, isAuthorized],
      handler: authed(getNftsController),
    },
  ],
};

export default NftRouter;

import type {IListing, ISale} from '../types/market';

export const BPS = 10_000;

export interface ISplit {
  seller: number;
  treasury: number;
  referrer: number;
}

export const splitOf = (mode: 'sale' | 'mint', feeBps: number, referralBps: number): ISplit => {
  const taken = mode === 'sale' ? (feeBps / BPS) * 100 : 100;
  const referrer = (taken * referralBps) / BPS;

  return {
    seller: 100 - taken,
    treasury: taken - referrer,
    referrer,
  };
};

export interface IBookStats {
  listed: number;
  floor: number | null;
  sold: number;
  volume: number;
  fees: number;
}

export const bookStats = (listings: IListing[], sales: ISale[]): IBookStats => ({
  listed: listings.length,
  floor: listings.reduce<number | null>((lowest, item) => {
    const price = Number(item.priceEth);

    return lowest === null || price < lowest ? price : lowest;
  }, null),
  sold: sales.length,
  volume: sales.reduce((total, sale) => total + Number(sale.priceEth), 0),
  fees: sales.reduce((total, sale) => total + Number(sale.feeEth), 0),
});

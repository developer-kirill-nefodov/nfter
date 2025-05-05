import {useEffect, useState} from 'react';

import {Cell, Grid} from './styles';

const SIZE = 7;
const HALF = Math.ceil(SIZE / 2);

/**
 * The same idea the contracts use, drawn in the browser.
 *
 * `EthersWeb3Pass` builds its artwork by walking the bits of a hash and mirroring
 * the result, so every address gets a symmetric badge nobody had to draw. This is
 * that algorithm with a random seed instead of an address — the visitor is looking
 * at the app's actual output, not at a stock illustration of one.
 */
const cellsFor = (seed: number): boolean[][] => {
  const rows: boolean[][] = [];

  for (let y = 0; y < SIZE; y += 1) {
    const left: boolean[] = [];

    for (let x = 0; x < HALF; x += 1) {
      // A cheap integer hash: enough to look unplanned, and stable for a seed.
      const bit = Math.imul(seed ^ (y * 31 + x * 7), 2654435761) >>> 24;

      left.push(bit % 5 > 1);
    }

    rows.push([...left, ...[...left].slice(0, SIZE - HALF).reverse()]);
  }

  return rows;
};

const Identicon = () => {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

  // A new badge every few seconds, the way a new wallet would get one. Slow enough
  // to read as scenery rather than as something demanding attention.
  useEffect(() => {
    const timer = setInterval(() => setSeed(Math.floor(Math.random() * 1e9)), 4200);

    return () => clearInterval(timer);
  }, []);

  const rows = cellsFor(seed);

  return (
    <Grid style={{gridTemplateColumns: `repeat(${SIZE}, 1fr)`}}>
      {rows.flatMap((row, y) =>
        row.map((filled, x) => (
          <Cell
            key={`${String(y)}-${String(x)}`}
            $on={filled}
            // Cells light up in a diagonal sweep instead of all at once, so the
            // change reads as drawing rather than as flickering.
            style={{transitionDelay: `${String((x + y) * 40)}ms`}}
          />
        )),
      )}
    </Grid>
  );
};

export default Identicon;

import {useEffect, useState} from 'react';

import {Cell, Grid} from './styles';

const SIZE = 7;
const HALF = Math.ceil(SIZE / 2);

const cellsFor = (seed: number): boolean[][] => {
  const rows: boolean[][] = [];

  for (let y = 0; y < SIZE; y += 1) {
    const left: boolean[] = [];

    for (let x = 0; x < HALF; x += 1) {
      const bit = Math.imul(seed ^ (y * 31 + x * 7), 2654435761) >>> 24;

      left.push(bit % 5 > 1);
    }

    rows.push([...left, ...[...left].slice(0, SIZE - HALF).reverse()]);
  }

  return rows;
};

const Identicon = () => {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

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
            style={{transitionDelay: `${String((x + y) * 40)}ms`}}
          />
        )),
      )}
    </Grid>
  );
};

export default Identicon;

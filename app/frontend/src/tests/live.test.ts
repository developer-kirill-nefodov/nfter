import {describe, expect, it} from 'vitest';

import {backoffFor} from '../api/live';

describe('backoffFor', () => {
  it('doubles the wait with every failed attempt', () => {
    expect(backoffFor(0)).toBe(1_000);
    expect(backoffFor(1)).toBe(2_000);
    expect(backoffFor(2)).toBe(4_000);
    expect(backoffFor(3)).toBe(8_000);
  });

  it('never waits longer than half a minute, however long the outage lasts', () => {
    expect(backoffFor(10)).toBe(30_000);
    expect(backoffFor(100)).toBe(30_000);
  });
});

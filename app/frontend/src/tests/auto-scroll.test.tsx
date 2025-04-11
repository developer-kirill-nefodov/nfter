import {render} from '@testing-library/react';
import {useRef} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useAutoScroll} from '../hooks/useAutoScroll';

const Rail = ({enabled = true, seamless = false}: {enabled?: boolean; seamless?: boolean}) => {
  const ref = useRef<HTMLDivElement>(null);

  useAutoScroll(ref, {speed: 100, enabled, seamless});

  return <div ref={ref} data-testid="rail" />;
};

/** jsdom lays nothing out, so the scrollable geometry has to be declared. */
const makeScrollable = (node: HTMLElement, {scrollWidth = 1000, clientWidth = 400} = {}) => {
  Object.defineProperty(node, 'scrollWidth', {value: scrollWidth, configurable: true});
  Object.defineProperty(node, 'clientWidth', {value: clientWidth, configurable: true});
};

const frames = (ms: number) => {
  // requestAnimationFrame is driven by the fake clock; performance.now advances
  // with it, which is what the hook measures elapsed time against.
  vi.advanceTimersByTime(ms);
};

describe('useAutoScroll', () => {
  beforeEach(() => {
    // performance.now() has to move with the clock: the hook measures elapsed
    // time against it, and a frozen clock means zero elapsed time forever.
    vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout', 'performance']});

    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback) =>
        setTimeout(() => callback(performance.now()), 16) as unknown as number,
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('drifts the rail along on its own', () => {
    const {getByTestId} = render(<Rail />);
    const rail = getByTestId('rail');

    makeScrollable(rail);

    frames(1000);

    // 100 px/s for a second, give or take a frame.
    expect(rail.scrollLeft).toBeGreaterThan(50);
  });

  it('stops the moment someone points at it', () => {
    const {getByTestId} = render(<Rail />);
    const rail = getByTestId('rail');

    makeScrollable(rail);

    frames(500);
    const before = rail.scrollLeft;

    rail.dispatchEvent(new Event('pointerenter'));
    frames(1000);

    // Reading it must not turn into chasing it.
    expect(rail.scrollLeft).toBe(before);
  });

  it('picks up again once they leave', () => {
    const {getByTestId} = render(<Rail />);
    const rail = getByTestId('rail');

    makeScrollable(rail);

    rail.dispatchEvent(new Event('pointerenter'));
    frames(500);
    const paused = rail.scrollLeft;

    rail.dispatchEvent(new Event('pointerleave'));
    frames(500);

    expect(rail.scrollLeft).toBeGreaterThan(paused);
  });

  it('wraps back to the start rather than stopping dead at the end', () => {
    const {getByTestId} = render(<Rail />);
    const rail = getByTestId('rail');

    makeScrollable(rail);
    rail.scrollLeft = 600; // the very end: scrollWidth - clientWidth

    frames(100);

    // It wrapped and carried on from the start, rather than parking at 600.
    expect(rail.scrollLeft).toBeLessThan(50);
  });

  it('wraps at the halfway mark when the rail is a doubled list', () => {
    const {getByTestId} = render(<Rail seamless />);
    const rail = getByTestId('rail');

    // 1000px of content = the real list twice over.
    makeScrollable(rail);
    rail.scrollLeft = 495;

    frames(100);

    // Half a rail back lands on the identical card, so the seam is invisible —
    // and the rail can scroll forever without ever running out.
    expect(rail.scrollLeft).toBeLessThan(20);
  });

  it('stays still when there is nothing to scroll', () => {
    const {getByTestId} = render(<Rail enabled={false} />);
    const rail = getByTestId('rail');

    makeScrollable(rail);

    frames(1000);

    expect(rail.scrollLeft).toBe(0);
  });
});

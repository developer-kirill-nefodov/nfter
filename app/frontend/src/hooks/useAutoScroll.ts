import {useEffect, type RefObject} from 'react';

interface IAutoScroll {
  /** Pixels per second. Slow enough to read, fast enough to notice. */
  speed?: number;
  enabled?: boolean;
  /**
   * The rail renders its items twice, so half of it is a copy. Wrapping at the
   * halfway mark lands on the identical card and the loop is invisible — and,
   * more importantly, the rail always overflows, so it can scroll at all even
   * when the real list is short enough to fit on screen.
   */
  seamless?: boolean;
}

/**
 * Drifts a horizontal rail along on its own, and gets out of the way the moment
 * a human touches it.
 *
 * A CSS marquee would have been fewer lines, but it moves the *content* rather
 * than the scroll position — which breaks native scrolling, snap points and drag
 * on touch. Nudging `scrollLeft` frame by frame leaves all of that intact: the
 * rail is still an ordinary scroll container that happens to move by itself.
 */
export const useAutoScroll = (
  ref: RefObject<HTMLElement | null>,
  {speed = 24, enabled = true, seamless = false}: IAutoScroll = {},
) => {
  useEffect(() => {
    const node = ref.current;

    if (!node || !enabled) {
      return;
    }

    // A page that moves on its own is a page some people cannot use.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let paused = false;
    let frame = 0;
    let last = performance.now();
    // Fractional pixels accumulate here; scrollLeft only takes whole ones.
    let carry = 0;

    const pause = () => {
      paused = true;
    };

    const resume = () => {
      paused = false;
      last = performance.now();
    };

    const step = (now: number) => {
      const elapsed = now - last;
      last = now;

      const scrollable = node.scrollWidth - node.clientWidth;

      if (!paused && scrollable > 0) {
        carry += (speed * elapsed) / 1000;

        const whole = Math.floor(carry);

        if (whole > 0) {
          carry -= whole;

          const next = node.scrollLeft + whole;
          const half = node.scrollWidth / 2;

          if (seamless && next >= half) {
            // The second half is a copy of the first, so stepping back by half a
            // rail lands on the same card. Nobody sees the seam.
            node.scrollLeft = next - half;
          } else if (!seamless && next >= scrollable - 1) {
            node.scrollLeft = 0;
          } else {
            node.scrollLeft = Math.min(next, scrollable);
          }
        }
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    // Reading, pointing, dragging or tabbing into it all mean "leave it alone".
    node.addEventListener('pointerenter', pause);
    node.addEventListener('pointerleave', resume);
    node.addEventListener('pointerdown', pause);
    node.addEventListener('focusin', pause);
    node.addEventListener('focusout', resume);
    node.addEventListener('wheel', pause, {passive: true});

    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('pointerenter', pause);
      node.removeEventListener('pointerleave', resume);
      node.removeEventListener('pointerdown', pause);
      node.removeEventListener('focusin', pause);
      node.removeEventListener('focusout', resume);
      node.removeEventListener('wheel', pause);
    };
  }, [ref, speed, enabled, seamless]);
};

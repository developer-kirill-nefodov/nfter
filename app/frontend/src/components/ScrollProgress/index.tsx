import {useEffect, useState} from 'react';

import {Bar, Track} from './styles';

const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;

      setProgress(scrollable <= 0 ? 0 : Math.min(1, doc.scrollTop / scrollable));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <Track aria-hidden="true">
      <Bar style={{transform: `scaleX(${String(progress)})`}} />
    </Track>
  );
};

export default ScrollProgress;

import {useCallback, useEffect, useState} from 'react';

interface ICoords {
  x: number;
  y: number;
}

const OFF: ICoords = {x: -1, y: -1};

export const useRipple = () => {
  const [coords, setCoords] = useState<ICoords>(OFF);
  const [isRippling, setIsRippling] = useState(false);

  const onRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setCoords({x: event.clientX - rect.left, y: event.clientY - rect.top});
  }, []);

  useEffect(() => {
    if (coords === OFF) {
      return;
    }

    setIsRippling(true);

    const timer = setTimeout(() => {
      setIsRippling(false);
      setCoords(OFF);
    }, 600);

    return () => clearTimeout(timer);
  }, [coords]);

  return {coords, isRippling, onRipple};
};

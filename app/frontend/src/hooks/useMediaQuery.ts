import {useEffect, useState} from 'react';

import {theme, type IBreakpointsName} from '../theme';

interface IUseMediaQuery {
  size: IBreakpointsName;
  type: 'min' | 'max';
}

export const useMediaQuery = ({type, size}: IUseMediaQuery): boolean => {
  const query = `(${type}-width: ${theme.breakpoints[size]}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const list = window.matchMedia(query);

    setMatches(list.matches);

    // Listening to the MediaQueryList rather than window resize: it fires once
    // when the answer actually changes, not on every frame of a drag.
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

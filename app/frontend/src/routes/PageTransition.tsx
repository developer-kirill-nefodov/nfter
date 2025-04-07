import type {ReactNode} from 'react';
import {useLocation} from 'react-router-dom';

import {Fade} from './styles';

/**
 * Keyed on the path, so React tears the old page down and mounts the new one —
 * which is what makes the animation run at all. Without the key the element is
 * reused and nothing ever animates.
 */
const PageTransition = ({children}: {children: ReactNode}) => {
  const {pathname} = useLocation();

  return <Fade key={pathname}>{children}</Fade>;
};

export default PageTransition;

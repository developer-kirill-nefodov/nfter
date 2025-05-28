import type {ReactNode} from 'react';

import {useLiveFeed} from '../../hooks/useLiveFeed';
import ScrollTop from '../ScrollTop';
import Toastify from '../Toastify';

import LayoutFooter from './LayoutFooter';
import LayoutHeader from './LayoutHeader';
import {Main, Shell} from './styles';

interface ILayout {
  children: ReactNode;
}

const Layout = ({children}: ILayout) => {
  useLiveFeed();

  return (
    <Shell>
      <LayoutHeader />
      <Main id="main">{children}</Main>
      <LayoutFooter />

      <ScrollTop />
      <Toastify />
    </Shell>
  );
};

export default Layout;

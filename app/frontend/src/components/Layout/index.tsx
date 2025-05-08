import type {ReactNode} from 'react';

import Toastify from '../Toastify';

import LayoutFooter from './LayoutFooter';
import LayoutHeader from './LayoutHeader';
import {Main, Shell} from './styles';

interface ILayout {
  children: ReactNode;
}

const Layout = ({children}: ILayout) => (
  <Shell>
    <LayoutHeader />
    <Main id="main">{children}</Main>
    <LayoutFooter />
    <Toastify />
  </Shell>
);

export default Layout;

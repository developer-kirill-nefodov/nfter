import {lazy, Suspense} from 'react';
import {Route, Routes} from 'react-router-dom';

import Spinner from '../components/Spinner';
import {Row} from '../styles';
import {NavigateUrls} from '../utils/navigate-urls';

import RequireRole, {type IRouteAccess} from './RequireRole';

// Route-level code splitting: a visitor on the login screen never downloads the
// gallery, and the gallery chunk is where ethers lives.
const LandingPage = lazy(() => import('../screens/Landing'));
const HomePage = lazy(() => import('../screens/Home'));
const TipPage = lazy(() => import('../screens/Tip'));
const LoginPage = lazy(() => import('../screens/Auth/Login'));
const RegisterPage = lazy(() => import('../screens/Auth/Register'));
const ForgotPasswordPage = lazy(() => import('../screens/Auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('../screens/Auth/ResetPassword'));
const NotFoundPage = lazy(() => import('../screens/NotFound'));

interface IAppRoute {
  path: string;
  element: React.ReactElement;
  access: IRouteAccess;
  redirect?: string;
}

export const appRoutes: IAppRoute[] = [
  // "/" is the landing page: readable by anyone, no wallet and no account. The
  // dashboard lives behind it, where a session actually means something.
  {path: NavigateUrls.home, element: <LandingPage />, access: 'public'},
  {
    path: NavigateUrls.dashboard,
    element: <HomePage />,
    access: 'authenticated',
    redirect: NavigateUrls.auth.login,
  },
  {path: NavigateUrls.tip, element: <TipPage />, access: 'public'},
  {
    path: NavigateUrls.auth.login,
    element: <LoginPage />,
    access: 'visitor',
    redirect: NavigateUrls.home,
  },
  {
    path: NavigateUrls.auth.register,
    element: <RegisterPage />,
    access: 'visitor',
    redirect: NavigateUrls.home,
  },
  {
    path: NavigateUrls.auth.forgotPassword,
    element: <ForgotPasswordPage />,
    access: 'visitor',
    redirect: NavigateUrls.home,
  },
  {
    path: NavigateUrls.auth.resetPassword,
    element: <ResetPasswordPage />,
    access: 'visitor',
    redirect: NavigateUrls.home,
  },
];

const Fallback = () => (
  <Row $justify="center" style={{padding: '80px 0'}}>
    <Spinner size={32} />
  </Row>
);

const AppRoutes = () => (
  <Suspense fallback={<Fallback />}>
    <Routes>
      {appRoutes.map(({path, element, access, redirect = NavigateUrls.home}) => (
        <Route
          key={path}
          path={path}
          element={
            <RequireRole access={access} redirect={redirect}>
              {element}
            </RequireRole>
          }
        />
      ))}

      {/* The catch-all the app never had: an unknown URL used to render nothing. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;

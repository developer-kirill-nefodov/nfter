import {lazy, Suspense} from 'react';
import {Route, Routes} from 'react-router-dom';

import {Skeleton, SkeletonCard, SkeletonGrid} from '../components/Skeleton';
import {NavigateUrls} from '../utils/navigate-urls';

import PageTransition from './PageTransition';
import RequireRole, {type IRouteAccess} from './RequireRole';
import {PageSkeleton} from './styles';

const LandingPage = lazy(() => import('../screens/Landing'));
const HomePage = lazy(() => import('../screens/Home'));
const RatingPage = lazy(() => import('../screens/Rating'));
const CollectPage = lazy(() => import('../screens/Collect'));
const MarketPage = lazy(() => import('../screens/Market'));
const InvitePage = lazy(() => import('../screens/Invite'));
const TreasuryPage = lazy(() => import('../screens/Treasury'));
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

const appRoutes: IAppRoute[] = [
  {path: NavigateUrls.home, element: <LandingPage />, access: 'public'},
  {
    path: NavigateUrls.dashboard,
    element: <HomePage />,
    access: 'authenticated',
    redirect: NavigateUrls.auth.login,
  },
  {path: NavigateUrls.rating, element: <RatingPage />, access: 'public'},
  {path: NavigateUrls.collect, element: <CollectPage />, access: 'public'},
  {path: NavigateUrls.market, element: <MarketPage />, access: 'public'},
  {
    path: NavigateUrls.invite,
    element: <InvitePage />,
    access: 'authenticated',
    redirect: NavigateUrls.auth.login,
  },
  {
    path: NavigateUrls.treasury,
    element: <TreasuryPage />,
    access: 'authenticated',
    redirect: NavigateUrls.auth.login,
  },
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
  <PageSkeleton>
    <Skeleton $height="36px" $width="220px" />
    <Skeleton $height="18px" $width="60%" />

    <SkeletonGrid>
      {Array.from({length: 4}, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </SkeletonGrid>
  </PageSkeleton>
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
              <PageTransition>{element}</PageTransition>
            </RequireRole>
          }
        />
      ))}

      <Route
        path="*"
        element={
          <PageTransition>
            <NotFoundPage />
          </PageTransition>
        }
      />
    </Routes>
  </Suspense>
);

export default AppRoutes;

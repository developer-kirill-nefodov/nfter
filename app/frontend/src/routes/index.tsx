import {lazy, Suspense} from 'react';
import {Route, Routes} from 'react-router-dom';

import {Skeleton, SkeletonCard, SkeletonGrid} from '../components/Skeleton';
import {NavigateUrls} from '../utils/navigate-urls';

import PageTransition from './PageTransition';
import RequireRole, {type IRouteAccess} from './RequireRole';
import {PageSkeleton} from './styles';

// Route-level code splitting: a visitor on the login screen never downloads the
// gallery, and the gallery chunk is where ethers lives.
const LandingPage = lazy(() => import('../screens/Landing'));
const HomePage = lazy(() => import('../screens/Home'));
const RatingPage = lazy(() => import('../screens/Rating'));
const CollectPage = lazy(() => import('../screens/Collect'));
const MarketPage = lazy(() => import('../screens/Market'));
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
  {path: NavigateUrls.rating, element: <RatingPage />, access: 'public'},
  {path: NavigateUrls.collect, element: <CollectPage />, access: 'public'},
  {path: NavigateUrls.market, element: <MarketPage />, access: 'public'},
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

/**
 * The shape of a page, before the page exists.
 *
 * A centred spinner collapses the layout to nothing and then throws the real
 * content in — which is exactly the jump you see when flipping between routes.
 * Holding the space costs one component and removes the jump entirely.
 */
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

      {/* The catch-all the app never had: an unknown URL used to render nothing. */}
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

import type {ReactElement} from 'react';
import {Navigate} from 'react-router-dom';

import {Skeleton, SkeletonCard, SkeletonGrid} from '../components/Skeleton';
import {useStoreSelector} from '../store/hooks';
import type {IRoleName} from '../types/user';

import {PageSkeleton} from './styles';

export type IRouteAccess = 'public' | 'visitor' | 'authenticated';

interface IRequireRole {
  access: IRouteAccess;
  redirect: string;
  children: ReactElement;
}

const RANK: Record<IRoleName, number> = {VISITOR: 0, USER: 1, MODERATOR: 2, ADMIN: 3};

/**
 * Access is a rank comparison, not string equality: the old gate tested
 * `route.role === user.role.name`, so a page marked USER locked out ADMIN.
 */
const RequireRole = ({access, redirect, children}: IRequireRole) => {
  const {user, loading} = useStoreSelector((state) => state.user);

  if (loading) {
    return (
      <PageSkeleton role="status" aria-busy="true" aria-label="Loading">
        <Skeleton $height="36px" $width="220px" />
        <Skeleton $height="18px" $width="55%" />
        <SkeletonGrid>
          {Array.from({length: 4}, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </SkeletonGrid>
      </PageSkeleton>
    );
  }

  const isVisitor = RANK[user.role.name] === RANK.VISITOR;

  if (access === 'authenticated' && isVisitor) {
    return <Navigate to={redirect} replace />;
  }

  if (access === 'visitor' && !isVisitor) {
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default RequireRole;

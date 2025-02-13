import type {ReactElement} from 'react';
import {Navigate} from 'react-router-dom';

import Spinner from '../components/Spinner';
import {useStoreSelector} from '../store/hooks';
import {Row} from '../styles';
import type {IRoleName} from '../types/user';

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
      <Row $justify="center" style={{padding: '80px 0'}}>
        <Spinner size={32} />
      </Row>
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

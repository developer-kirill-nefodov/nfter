import {render, screen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {ThemeProvider} from 'styled-components';
import {describe, expect, it} from 'vitest';

import RequireRole from '../routes/RequireRole';
import {createStore} from '../store';
import {theme} from '../theme';
import type {IRoleName} from '../types/user';

const renderGate = (
  access: 'public' | 'visitor' | 'authenticated',
  role: IRoleName,
  loading = false,
) => {
  const store = createStore({
    user: {
      user: {email: null, walletAddress: null, role: {name: role, permissions: {}}},
      loading,
    },
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/gated']}>
          <Routes>
            <Route
              path="/gated"
              element={
                <RequireRole access={access} redirect="/">
                  <p>secret</p>
                </RequireRole>
              }
            />
            <Route path="/" element={<p>home</p>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
};

describe('RequireRole', () => {
  it('holds the page layout while the session is still being resolved', () => {
    renderGate('authenticated', 'VISITOR', true);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('sends a visitor away from an authenticated route', () => {
    renderGate('authenticated', 'VISITOR');

    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('lets a signed-in user through', () => {
    renderGate('authenticated', 'USER');

    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('lets an admin through a route marked for users', () => {
    renderGate('authenticated', 'ADMIN');

    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('keeps a signed-in user off the sign-in page', () => {
    renderGate('visitor', 'USER');

    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('lets anyone see a public route', () => {
    renderGate('public', 'VISITOR');

    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {ThemeProvider} from 'styled-components';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {authApi} from '../api/auth';
import ForgotPasswordPage from '../screens/Auth/ForgotPassword';
import ResetPasswordPage from '../screens/Auth/ResetPassword';
import {createStore} from '../store';
import {theme} from '../theme';

vi.mock('../api/auth', () => ({
  authApi: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

const forgotPassword = vi.mocked(authApi.forgotPassword);
const resetPassword = vi.mocked(authApi.resetPassword);

const renderAt = (entry: string) => {
  const store = createStore();

  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/sign-in" element={<h1>Sign in</h1>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );

  return store;
};

describe('reset password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the user to the sign-in form once the password has changed', async () => {
    resetPassword.mockResolvedValue('Your password has been changed.');
    const user = userEvent.setup();

    renderAt('/reset-password?token=abc123');

    await user.type(screen.getByLabelText('New password'), 'BrandNewPass123');
    await user.type(screen.getByLabelText('Confirm password'), 'BrandNewPass123');
    await user.click(screen.getByRole('button', {name: /set a new password/i}));

    // The password is changed and every session was revoked server-side, so the
    // only thing left to do is sign in with it.
    expect(await screen.findByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
  });

  it('sends the typed password once, and only once', async () => {
    resetPassword.mockResolvedValue('ok');
    const user = userEvent.setup();

    renderAt('/reset-password?token=abc123');

    await user.type(screen.getByLabelText('New password'), 'BrandNewPass123');
    await user.type(screen.getByLabelText('Confirm password'), 'BrandNewPass123');
    await user.click(screen.getByRole('button', {name: /set a new password/i}));

    expect(resetPassword).toHaveBeenCalledExactlyOnceWith({
      token: 'abc123',
      password: 'BrandNewPass123',
    });
  });

  it('clears the typed passwords when the link turns out to be dead', async () => {
    resetPassword.mockRejectedValue(new Error('This reset link is invalid or has expired'));
    const user = userEvent.setup();

    renderAt('/reset-password?token=stale');

    await user.type(screen.getByLabelText('New password'), 'BrandNewPass123');
    await user.type(screen.getByLabelText('Confirm password'), 'BrandNewPass123');
    await user.click(screen.getByRole('button', {name: /set a new password/i}));

    // Still on the form — and it must not be left holding the passwords.
    expect(await screen.findByLabelText('New password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm password')).toHaveValue('');
  });

  it('bounces straight to forgot-password when the link has no token at all', () => {
    renderAt('/reset-password');

    expect(screen.getByRole('heading', {name: /forgot password/i})).toBeInTheDocument();
  });
});

describe('forgot password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('empties the field and counts the cooldown down on the button', async () => {
    forgotPassword.mockResolvedValue({message: 'On its way.', retryAfter: 30});
    const user = userEvent.setup();

    renderAt('/forgot-password');

    await user.type(screen.getByLabelText('Email'), 'kirill@example.dev');
    await user.click(screen.getByRole('button', {name: /send reset link/i}));

    expect(await screen.findByRole('button', {name: /resend in 30s/i})).toBeDisabled();
    expect(screen.getByLabelText('Email')).toHaveValue('');
  });

  it('gives the button back when the request fails, rather than locking the user out', async () => {
    forgotPassword.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();

    const store = renderAt('/forgot-password');

    await user.type(screen.getByLabelText('Email'), 'kirill@example.dev');
    await user.click(screen.getByRole('button', {name: /send reset link/i}));

    expect(await screen.findByRole('button', {name: /send reset link/i})).toBeEnabled();
    expect(store.getState().auth.resetCooldown).toBe(0);
  });
});

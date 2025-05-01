export const NavigateUrls = {
  home: '/',
  dashboard: '/dashboard',
  collect: '/collect',
  market: '/market',
  invite: '/invite',
  treasury: '/treasury',
  rating: '/rating',
  auth: {
    // The originals shipped as "/sing-in" and "/sing-up" — a typo in a
    // user-facing URL.
    login: '/sign-in',
    register: '/sign-up',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
} as const;

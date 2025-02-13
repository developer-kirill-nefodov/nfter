export const NavigateUrls = {
  home: '/',
  auth: {
    // The originals shipped as "/sing-in" and "/sing-up" — a typo in a
    // user-facing URL.
    login: '/sign-in',
    register: '/sign-up',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
} as const;

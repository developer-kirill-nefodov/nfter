import '@testing-library/jest-dom/vitest';

// Screens render translated copy, so the tests have to assert against the real
// strings rather than raw keys — the bundled English dictionary is enough.
import '../i18n';

// jsdom has no matchMedia, and useMediaQuery calls it during the first render.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

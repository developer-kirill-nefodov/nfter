import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import {ThemeProvider} from 'styled-components';

import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import {store} from './store';
import {AppGlobalStyles} from './styles';
import {theme} from './theme';
import './i18n';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <AppGlobalStyles />
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { HelmetProvider } from 'react-helmet-async';
import './styles/index.css';
import { AuthProvider } from './app/context/AuthContext';

if (window.location.search.startsWith('?/')) {
  const restoredPath = window.location.search.slice(1).replace(/~and~/g, '&');
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname.replace(/\/$/, '')}${restoredPath}${window.location.hash}`
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

async function preloadCurrentRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/') return import('./app/pages/HomePage');
  if (path === '/ru') return import('./app/pages/RussianHomePage');
  if (path === '/tours') return import('./app/pages/ToursPage');
  if (path === '/ru/tours') return import('./app/pages/RussianToursPage');
  if (/^\/tours\/[1-9][0-9]*$/.test(path)) return import('./app/pages/TourDetailPage');
  if (/^\/ru\/tours\/[1-9][0-9]*$/.test(path)) return import('./app/pages/RussianTourDetailPage');
  if (path === '/join-tour') return import('./app/pages/JoinTourPage');
  if (path === '/gallery') return import('./app/pages/GalleryPage');
  if (path === '/blogs') return import('./app/pages/BlogsPage');
  if (/^\/blogs\/[a-z0-9-]+$/.test(path)) return import('./app/pages/BlogPostPage');
  if (/^\/(?:ru\/)?destinations\/[a-z0-9-]+$/.test(path)) return import('./app/pages/DestinationPage');
  if (path === '/feedback' || path === '/ru/feedback') return import('./app/pages/FeedbackPage');
  if (path === '/auth') return import('./app/pages/AuthPage');
  if (path === '/dashboard') return import('./app/pages/UserDashboardPage');
  if (path === '/create-tour') return import('./app/pages/CreateTourPage');
  if (path === '/admin/login') return import('./admin/AdminLoginPage');
  if (path.startsWith('/admin')) return import('./admin/AdminDashboardPage');
  return import('./app/pages/NotFoundPage');
}

async function bootstrap() {
  void preloadCurrentRoute().catch(() => {
    // The normal React lazy boundary still handles a transient route-chunk failure.
  });

  document
    .querySelectorAll('[data-static-seo-head="true"]')
    .forEach((element) => element.remove());

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <HelmetProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
}

void bootstrap();

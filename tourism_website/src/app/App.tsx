import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import { CustomTourForm } from './components/CustomTourForm';
import { AuthRoute } from './components/AuthRoute';
import { AdminRoute } from '../admin/components/AdminRoute';

// Align router base with Vite's base path for GH Pages deploys.
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '');

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const TourDetailPage = lazy(() => import('./pages/TourDetailPage').then((module) => ({ default: module.TourDetailPage })));
const ToursPage = lazy(() => import('./pages/ToursPage').then((module) => ({ default: module.ToursPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((module) => ({ default: module.ExplorePage })));
const BlogsPage = lazy(() => import('./pages/BlogsPage').then((module) => ({ default: module.BlogsPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((module) => ({ default: module.FeedbackPage })));
const CreateTourPage = lazy(() => import('./pages/CreateTourPage').then((module) => ({ default: module.CreateTourPage })));
const JoinTourPage = lazy(() => import('./pages/JoinTourPage').then((module) => ({ default: module.JoinTourPage })));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage').then((module) => ({ default: module.UserDashboardPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const AdminLoginPage = lazy(() => import('../admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));
const AdminLayout = lazy(() => import('../admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboardPage = lazy(() => import('../admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));

const PageLoader = () => (
  <div className="py-16 text-center text-muted-foreground">Loading...</div>
);

export default function App() {
  return (
    <BrowserRouter basename={routerBase}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:tourId" element={<TourDetailPage />} />
            <Route path="/custom-tour" element={<CustomTourForm />} />
            <Route path="/join-tour" element={<JoinTourPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AuthRoute />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
            </Route>
            <Route element={<AuthRoute requiredRole="seller" />}>
              <Route path="/create-tour" element={<CreateTourPage />} />
            </Route>
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

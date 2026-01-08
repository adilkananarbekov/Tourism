import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firebaseEnabled } from '../lib/firebase';
import { Button } from './ui/button';

type AuthRouteProps = {
  requiredRole?: 'buyer' | 'seller';
};

export function AuthRoute({ requiredRole }: AuthRouteProps) {
  const location = useLocation();
  const { user, profile, loading } = useAuth();

  if (!firebaseEnabled) {
    return <Outlet />;
  }

  if (loading) {
    return <p className="text-muted-foreground">Checking your account...</p>;
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="py-16 px-4 text-center">
        <h2 className="text-2xl text-foreground mb-3">Role Required</h2>
        <p className="text-muted-foreground mb-6">
          This section is available to {requiredRole === 'seller' ? 'sellers' : 'buyers'} only.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Update your role</Link>
        </Button>
      </div>
    );
  }

  return <Outlet />;
}

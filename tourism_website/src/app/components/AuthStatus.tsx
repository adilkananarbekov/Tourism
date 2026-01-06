import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { firebaseEnabled } from '../lib/firebase';

export function AuthStatus() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  if (!firebaseEnabled) {
    return null;
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{profile?.name || user.email}</span>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}

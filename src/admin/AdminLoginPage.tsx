import { LayoutDashboard, FileText, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { SEO } from '../app/components/SEO';
import { authenticateAdmin } from './auth';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const success = await authenticateAdmin(username, password);
    if (!success) {
      setErrorMessage('Invalid credentials.');
      return;
    }

    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen admin-shell auth-shell bg-background text-foreground px-4 py-12 flex items-center">
      <SEO
        title="Admin Login"
        description="Sign in to manage tours, news, and bookings."
      />
      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        <div className="hidden lg:flex relative overflow-hidden rounded-2xl border border-border bg-card/60 auth-hero">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-transparent" />
          <div className="relative z-10 p-10 flex flex-col justify-between text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Admin Console</p>
              <h1 className="text-4xl mt-4 mb-4">Control the Kyrgyz Riders experience</h1>
              <p className="text-white/70">
                Review bookings, update tours, and publish news with a focused control center.
              </p>
            </div>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center gap-3 text-sm">
                <LayoutDashboard className="h-4 w-4" />
                Manage tours, sights, and content
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4" />
                Publish news and stories instantly
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4" />
                Approve bookings and requests
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/90 border border-border rounded-2xl shadow-lg p-8 space-y-6 auth-panel">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Superuser Access</p>
            <h2 className="text-3xl text-foreground mt-3">Admin Sign In</h2>
            <p className="text-muted-foreground text-sm">
              Use your admin username and password to access the control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="admin123"
                className="h-11"
                required
              />
            </div>
            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
            <Button
              type="submit"
              className="w-full btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Sign In to Admin
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

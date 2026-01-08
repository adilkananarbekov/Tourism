import { Mail, Lock, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { firebaseEnabled } from '../lib/firebase';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const signUpSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  role: z.enum(['buyer', 'seller']),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/dashboard';
  }, [location.search]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', role: 'buyer' },
  });

  const handleSignIn = async (values: SignInValues) => {
    setErrorMessage(null);
    try {
      await signIn(values.email, values.password);
      navigate(nextUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleSignUp = async (values: SignUpValues) => {
    setErrorMessage(null);
    try {
      await signUp(values);
      navigate(nextUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to create account.');
    }
  };

  if (!firebaseEnabled) {
    return (
      <section className="py-16 px-4 text-center">
        <h1 className="text-3xl text-foreground mb-3">Account Setup Disabled</h1>
        <p className="text-muted-foreground">
          Configure the backend to enable authentication features.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen auth-shell bg-background text-foreground px-4 py-12">
      <SEO
        title={mode === 'signin' ? 'Sign In' : 'Sign Up'}
        description="Access your Kyrgyz Riders account to manage bookings, submit tours, and connect with guides."
      />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-stretch">
        <div className="hidden lg:flex relative overflow-hidden rounded-3xl border border-border bg-card/60 auth-hero">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/35 to-transparent" />
          <div className="relative z-10 p-10 flex flex-col justify-between text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Kyrgyz Riders</p>
              <h1 className="text-4xl mt-4 mb-4">Begin your next mountain story</h1>
              <p className="text-white/75">
                Save itineraries, manage bookings, and unlock curated journeys across Kyrgyzstan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <p className="text-2xl font-semibold">24+</p>
                <p>Curated routes</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <p className="text-2xl font-semibold">7</p>
                <p>Regions explored</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/90 border border-border rounded-3xl shadow-lg p-6 sm:p-8 space-y-6 auth-panel">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Account Access</p>
            <h2 className="text-3xl text-foreground">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === 'signin'
                ? 'Sign in to manage your bookings and travel requests.'
                : 'Join as a buyer or seller to access the full platform.'}
            </p>
          </div>

          <div className="flex rounded-full border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-full py-2 text-sm transition-all ${
                mode === 'signin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full py-2 text-sm transition-all ${
                mode === 'signup'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-divider">Email Access</div>

          {mode === 'signin' ? (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-5">
              <div className="space-y-2">
                <div className="relative auth-input">
                  <Mail className="auth-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder=" "
                    className="peer h-12 pl-10 pt-5 pb-2"
                    {...signInForm.register('email')}
                  />
                  <Label
                    htmlFor="signin-email"
                    className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary"
                  >
                    Email address
                  </Label>
                </div>
                {signInForm.formState.errors.email && (
                  <p className="text-xs text-red-600">{signInForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative auth-input">
                  <Lock className="auth-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder=" "
                    className="peer h-12 pl-10 pt-5 pb-2"
                    {...signInForm.register('password')}
                  />
                  <Label
                    htmlFor="signin-password"
                    className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary"
                  >
                    Password
                  </Label>
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-xs text-red-600">{signInForm.formState.errors.password.message}</p>
                )}
              </div>
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              <Button
                type="submit"
                className="w-full btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-5">
              <div className="space-y-2">
                <div className="relative auth-input">
                  <User className="auth-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    placeholder=" "
                    className="peer h-12 pl-10 pt-5 pb-2"
                    {...signUpForm.register('name')}
                  />
                  <Label
                    htmlFor="signup-name"
                    className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary"
                  >
                    Full name
                  </Label>
                </div>
                {signUpForm.formState.errors.name && (
                  <p className="text-xs text-red-600">{signUpForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative auth-input">
                  <Mail className="auth-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder=" "
                    className="peer h-12 pl-10 pt-5 pb-2"
                    {...signUpForm.register('email')}
                  />
                  <Label
                    htmlFor="signup-email"
                    className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary"
                  >
                    Email address
                  </Label>
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-xs text-red-600">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative auth-input">
                  <Lock className="auth-input-icon absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder=" "
                    className="peer h-12 pl-10 pt-5 pb-2"
                    {...signUpForm.register('password')}
                  />
                  <Label
                    htmlFor="signup-password"
                    className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary"
                  >
                    Password
                  </Label>
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="text-xs text-red-600">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-role">Role</Label>
                <select
                  id="signup-role"
                  {...signUpForm.register('role')}
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              <Button
                type="submit"
                className="w-full btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Account
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground">
            Admin access?{' '}
            <Link to="/admin/login" className="text-primary underline underline-offset-4">
              Go to admin console
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SEO } from '../components/SEO';
import {
  subscribeBookingsByUserId,
  subscribeSellerSubmissionsByOwnerId,
  type BookingRequest,
  type SellerSubmission,
  upsertUserProfile,
} from '../lib/dataStore';
import {
  loadLocalBookings,
  loadLocalProfile,
  loadLocalSubmissions,
  saveLocalProfile,
  type LocalProfile,
} from '../lib/localStorage';
import { useAuth } from '../context/AuthContext';

type BookingItem = BookingRequest & {
  id?: string;
  createdAt?: unknown;
  submittedAt?: string;
  status?: string;
};

type SubmissionItem = SellerSubmission & {
  createdAt?: unknown;
  submittedAt?: string;
};

const ROLE_OPTIONS: Array<LocalProfile['role']> = ['buyer', 'seller'];

function formatDate(value: unknown) {
  if (!value) {
    return 'N/A';
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleDateString();
  }
  return value instanceof Date ? value.toLocaleDateString() : 'N/A';
}

export function UserDashboardPage() {
  const { user, profile: authProfile, loading, updateRole } = useAuth();
  const [profile, setProfile] = useState<LocalProfile>({ name: '', email: '', role: 'buyer' });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const bookingStatusRef = useRef<Record<string, string>>({});
  const submissionStatusRef = useRef<Record<string, string>>({});

  const localBookings = useMemo(() => {
    const items = loadLocalBookings();
    return profile.email ? items.filter((item) => item.email === profile.email) : items;
  }, [profile.email]);

  const localSubmissions = useMemo(() => {
    const items = loadLocalSubmissions();
    return profile.email ? items.filter((item) => item.contactEmail === profile.email) : items;
  }, [profile.email]);

  useEffect(() => {
    if (loading) {
      return;
    }
    const stored = loadLocalProfile();
    setProfile({
      name: authProfile?.name || user?.displayName || stored?.name || '',
      email: authProfile?.email || user?.email || stored?.email || '',
      role: (authProfile?.role as LocalProfile['role']) || stored?.role || 'buyer',
    });
  }, [authProfile?.email, authProfile?.name, authProfile?.role, loading, user?.displayName, user?.email]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (profile.role === 'buyer') {
      const unsubscribe = subscribeBookingsByUserId(
        user.uid,
        (data) => {
          const nextBookings = data.length ? data : localBookings;
          setBookings(nextBookings);
          nextBookings.forEach((booking) => {
            if (!booking.id) {
              return;
            }
            const previous = bookingStatusRef.current[booking.id];
            if (previous && previous !== (booking.status || 'pending')) {
              toast(`Booking status updated: ${booking.status || 'pending'}`);
            }
            bookingStatusRef.current[booking.id] = booking.status || 'pending';
          });
          setBookingMessage(data.length ? 'Synced from local data store.' : 'Showing locally saved bookings.');
        },
        (error) => setBookingMessage(error.message)
      );
      return () => unsubscribe();
    }

    const unsubscribe = subscribeSellerSubmissionsByOwnerId(
      user.uid,
      (data) => {
        const nextSubmissions = data.length ? data : localSubmissions;
        setSubmissions(nextSubmissions);
        nextSubmissions.forEach((submission) => {
          if (!submission.id) {
            return;
          }
          const previous = submissionStatusRef.current[submission.id];
          if (previous && previous !== submission.status) {
            toast(`Submission status updated: ${submission.status}`);
          }
          submissionStatusRef.current[submission.id] = submission.status;
        });
        setSubmissionMessage(data.length ? 'Synced from local data store.' : 'Showing locally saved submissions.');
      },
      (error) => setSubmissionMessage(error.message)
    );
    return () => unsubscribe();
  }, [loading, localBookings, localSubmissions, profile.role, user]);

  const handleSaveProfile = async () => {
    setProfileMessage(null);
    if (!profile.name || !profile.email) {
      setProfileMessage('Please add your name and email.');
      return;
    }

    setIsSyncing(true);
    try {
      saveLocalProfile(profile);
      await upsertUserProfile({
        name: profile.name,
        email: profile.email,
        role: profile.role,
        uid: user?.uid,
      });
      if (user) {
        await updateRole(profile.role);
      }
      setProfileMessage('Profile saved.');
    } catch {
      setProfileMessage('Unable to save profile right now.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading your dashboard...</p>;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO
        title="Dashboard"
        description="Manage your bookings, submissions, and traveler profile."
        path="/dashboard"
        noindex
      />
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl text-foreground">Your Dashboard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Keep your profile updated and track bookings or tour submissions based on your role.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-2xl text-foreground mb-1">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Set your role to switch between buyer and seller tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profileName">Full Name</Label>
              <Input
                id="profileName"
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="profileEmail">Email</Label>
              <Input
                id="profileEmail"
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                placeholder="you@example.com"
                disabled={Boolean(user)}
              />
            </div>
            <div>
              <Label htmlFor="profileRole">Role</Label>
              <select
                id="profileRole"
                value={profile.role}
                onChange={(event) =>
                  setProfile({ ...profile, role: event.target.value as LocalProfile['role'] })
                }
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role === 'buyer' ? 'Buyer' : 'Seller'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {profileMessage && <p className="text-sm text-muted-foreground">{profileMessage}</p>}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSaveProfile}
              disabled={isSyncing}
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSyncing ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/tours">Browse Tours</Link>
            </Button>
          </div>
        </div>

        {profile.role === 'buyer' ? (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl text-foreground">Your Bookings</h2>
                {bookingMessage && <p className="text-sm text-muted-foreground">{bookingMessage}</p>}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/feedback">Leave Feedback</Link>
                </Button>
                <Button asChild className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/tours">Book a Tour</Link>
                </Button>
              </div>
            </div>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground">No bookings yet. Book a tour to see it here.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking, index) => (
                  <div key={booking.id || index} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-foreground font-medium">{booking.tourTitle}</p>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {booking.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Dates: {booking.startDate} to {booking.endDate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {formatDate(booking.submittedAt || booking.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl text-foreground">Your Tour Submissions</h2>
                {submissionMessage && (
                  <p className="text-sm text-muted-foreground">{submissionMessage}</p>
                )}
              </div>
              <Button asChild className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/create-tour">Submit New Tour</Link>
              </Button>
            </div>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground">No submissions yet. Share your first tour idea.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission, index) => (
                  <div
                    key={submission.id || index}
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-foreground font-medium">{submission.title}</p>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Season: {submission.season} - {submission.price}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {formatDate(submission.submittedAt || submission.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

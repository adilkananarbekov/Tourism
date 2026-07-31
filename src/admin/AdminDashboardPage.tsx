import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileImage,
  RefreshCw,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Textarea } from '../app/components/ui/textarea';
import type { Tour } from '../app/components/tour-data';
import { toast } from 'sonner';
import { uploadImage } from '../app/lib/storage';
import { withBasePath } from '../app/lib/assets';
import {
  BlogPost,
  BookingRequest,
  ContentSettings,
  CustomTourRequest,
  FeedbackEntry,
  SellerSubmission,
  Sight,
  UserRecord,
  createBlogPost,
  createSight,
  createTour,
  deleteBlogPost,
  deleteSight,
  deleteTour,
  fetchAdminBlogPosts,
  fetchAdminSights,
  fetchContentSettings,
  fetchSellerSubmissions,
  fetchTours,
  fetchUsers,
  subscribeBookings,
  subscribeCustomTourRequests,
  subscribeFeedbackEntries,
  subscribeSellerSubmissions,
  updateBlogPost,
  updateBookingStatus,
  updateContentSettings,
  updateCustomTourRequestStatus,
  updateFeedbackResponse,
  updateSellerSubmissionStatus,
  updateSight,
  updateTour,
  updateUserRole,
} from '../app/lib/dataStore';
import { fetchEventSummary } from '../app/lib/eventTracker';
import {
  TelegramAdminStatus,
  fetchApiTelegramStatus,
  retryApiTelegramRequests,
  sendApiTelegramTest,
} from '../app/lib/api';

type TourFormState = {
  id: string;
  title: string;
  isHot: boolean;
  duration: string;
  tourType: string;
  season: string;
  description: string;
  image: string;
  price: string;
  highlights: string;
  itinerary: string;
  packingList: string;
  accommodation: string;
  meals: string;
  difficulty: string;
  groupSize: string;
  included: string;
  notIncluded: string;
};

const EMPTY_TOUR_FORM: TourFormState = {
  id: '',
  title: '',
  isHot: false,
  duration: '',
  tourType: '',
  season: '',
  description: '',
  image: '',
  price: '',
  highlights: '',
  itinerary: '',
  packingList: '',
  accommodation: '',
  meals: '',
  difficulty: '',
  groupSize: '',
  included: '',
  notIncluded: '',
};

const leadStatusOptions = ['pending', 'contacted', 'approved', 'completed', 'cancelled', 'rejected'];
const sellerStatusOptions = ['pending', 'approved', 'rejected'];

type BlogFormState = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  readTime: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY_BLOG_FORM: BlogFormState = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Travel guide',
  readTime: '7 min read',
  status: 'draft',
  featured: false,
  publishedAt: '',
  seoTitle: '',
  seoDescription: '',
};

function formatAdminDate(value?: string) {
  if (!value) {
    return 'Not specified';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = status || 'pending';
  const color =
    normalized === 'published' || normalized === 'approved' || normalized === 'completed' || normalized === 'sent'
      ? 'bg-emerald-100 text-emerald-800'
      : normalized === 'failed' || normalized === 'rejected' || normalized === 'cancelled'
        ? 'bg-red-100 text-red-800'
        : normalized === 'contacted'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-amber-100 text-amber-800';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${color}`}>
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

type ImageUploadPanelProps = {
  id: string;
  label: string;
  value: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  description?: string;
};

function formatFileSize(file: File) {
  if (file.size < 1024 * 1024) {
    return `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }
  return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveImagePreview(value: string) {
  if (!value) {
    return '';
  }
  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }
  return withBasePath(value);
}

function ImageUploadPanel({
  id,
  label,
  value,
  file,
  onFileChange,
  description = 'JPG, PNG, WebP, AVIF или HEIC/HEIF. HEIC автоматически преобразуется в JPG. Максимум 16 MB.',
}: ImageUploadPanelProps) {
  const [filePreview, setFilePreview] = useState('');

  useEffect(() => {
    if (!file) {
      setFilePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  const preview = filePreview || resolveImagePreview(value);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
        <div className="admin-upload-preview overflow-hidden rounded-md border border-border bg-card">
          {preview ? (
            <img
              src={preview}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileImage className="h-6 w-6" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
          {file && (
            <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <span className="text-foreground">{file.name}</span> · {formatFileSize(file)}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <label
              htmlFor={id}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <UploadCloud className="h-4 w-4" />
              Choose photo
            </label>
            <Input
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
              className="sr-only"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
            {file && (
              <Button type="button" variant="outline" onClick={() => onFileChange(null)}>
                <X className="h-4 w-4" />
                Remove selected
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            После выбора нажмите Save. HEIC/HEIF автоматически станет JPG на сервере, а URL подставится автоматически.
          </p>
        </div>
      </div>
    </div>
  );
}

type EventSummary = {
  totals: Record<string, number>;
  recent: Array<{
    source: string;
    event_name: string;
    path: string;
    label: string;
    created_at: string;
  }>;
};

export function AdminDashboardPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  const [tours, setTours] = useState<Tour[]>([]);
  const [sights, setSights] = useState<Sight[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [customRequests, setCustomRequests] = useState<Array<CustomTourRequest & { id: string }>>([]);
  const [bookings, setBookings] = useState<Array<BookingRequest & { id: string }>>([]);
  const [sellerSubmissions, setSellerSubmissions] = useState<SellerSubmission[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [contentSettings, setContentSettings] = useState<ContentSettings>({});
  const [eventSummary, setEventSummary] = useState<EventSummary>({ totals: {}, recent: [] });
  const [telegramStatus, setTelegramStatus] = useState<TelegramAdminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [tourForm, setTourForm] = useState<TourFormState>(EMPTY_TOUR_FORM);
  const [tourEditId, setTourEditId] = useState<number | null>(null);

  const [sightForm, setSightForm] = useState({ name: '', region: '', description: '', imageUrl: '' });
  const [sightEditId, setSightEditId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [blogEditId, setBlogEditId] = useState<string | null>(null);
  const [tourImageFile, setTourImageFile] = useState<File | null>(null);
  const [sightImageFile, setSightImageFile] = useState<File | null>(null);
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null);

  const bookingCountRef = useRef<number | null>(null);
  const requestCountRef = useRef<number | null>(null);
  const submissionCountRef = useRef<number | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadStatic = async () => {
      try {
        const [toursData, sightsData, blogData, usersData, contentData, eventsData] = await Promise.all([
          fetchTours(),
          fetchAdminSights(),
          fetchAdminBlogPosts(),
          fetchUsers(),
          fetchContentSettings(),
          fetchEventSummary().catch(() => ({ totals: {}, recent: [] })),
        ]);
        if (!isActive) {
          return;
        }
        setTours(toursData);
        setSights(sightsData);
        setBlogPosts(blogData);
        setUsers(usersData);
        setContentSettings(contentData || {});
        setEventSummary(eventsData);
        fetchApiTelegramStatus().then(setTelegramStatus).catch(() => setTelegramStatus(null));
      } catch (err) {
        if (isActive) {
          setErrorMessage(err instanceof Error ? err.message : 'Unable to load admin data.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadStatic();

    const unsubscribeRequests = subscribeCustomTourRequests(
      (data) => {
        setCustomRequests(data);
        if (requestCountRef.current !== null && data.length > requestCountRef.current) {
          toast('New tour request received.');
        }
        requestCountRef.current = data.length;
      },
      (error) => setErrorMessage(error.message)
    );

    const unsubscribeBookings = subscribeBookings(
      (data) => {
        setBookings(data);
        if (bookingCountRef.current !== null && data.length > bookingCountRef.current) {
          toast('New booking received.');
        }
        bookingCountRef.current = data.length;
      },
      (error) => setErrorMessage(error.message)
    );

    const unsubscribeSubmissions = subscribeSellerSubmissions(
      (data) => {
        setSellerSubmissions(data);
        if (submissionCountRef.current !== null && data.length > submissionCountRef.current) {
          toast('New seller submission received.');
        }
        submissionCountRef.current = data.length;
      },
      (error) => setErrorMessage(error.message)
    );

    const unsubscribeFeedback = subscribeFeedbackEntries(
      (data) => {
        setFeedbackEntries(data);
      },
      (error) => setErrorMessage(error.message)
    );

    return () => {
      isActive = false;
      unsubscribeRequests();
      unsubscribeBookings();
      unsubscribeSubmissions();
      unsubscribeFeedback();
    };
  }, []);

  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, [activeTab]);

  const stats = useMemo(() => {
    const pendingLeads =
      customRequests.filter((request) => (request.status || 'pending') === 'pending').length +
      bookings.filter((booking) => (booking.status || 'pending') === 'pending').length;
    return [
      { label: 'Active tours', value: tours.length },
      { label: 'Published guides', value: blogPosts.filter((post) => post.status !== 'draft' && post.status !== 'archived').length },
      { label: 'Pending leads', value: pendingLeads },
      { label: 'Pending seller tours', value: sellerSubmissions.filter((item) => (item.status || 'pending') === 'pending').length },
    ];
  }, [tours, blogPosts, bookings, customRequests, sellerSubmissions]);

  const matchesSearch = (...values: unknown[]) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || values.some((value) => String(value || '').toLowerCase().includes(query));
  };

  const filteredTours = tours.filter((tour) => matchesSearch(tour.title, tour.tourType, tour.season));
  const filteredSights = sights.filter((sight) => matchesSearch(sight.name, sight.region));
  const filteredBlogPosts = blogPosts.filter(
    (post) =>
      matchesSearch(post.title, post.slug, post.category, post.excerpt) &&
      (statusFilter === 'all' || (post.status || 'published') === statusFilter)
  );
  const filteredRequests = customRequests.filter(
    (request) =>
      matchesSearch(request.name, request.email, request.phone, request.telegramUsername) &&
      (statusFilter === 'all' || (request.status || 'pending') === statusFilter)
  );
  const filteredBookings = bookings.filter(
    (booking) =>
      matchesSearch(booking.name, booking.email, booking.phone, booking.tourTitle) &&
      (statusFilter === 'all' || (booking.status || 'pending') === statusFilter)
  );
  const filteredUsers = users.filter((user) => matchesSearch(user.name, user.email, user.role));

  const setTourFormFromTour = (tour: Tour) => {
    setTourForm({
      id: String(tour.id),
      title: tour.title,
      isHot: Boolean(tour.isHot),
      duration: tour.duration,
      tourType: tour.tourType,
      season: tour.season,
      description: tour.description,
      image: tour.image,
      price: tour.price,
      highlights: tour.highlights.join('\n'),
      itinerary: tour.itinerary.map((day) => `${day.title}: ${day.description}`).join('\n'),
      packingList: tour.packingList.join('\n'),
      accommodation: tour.practicalInfo.accommodation,
      meals: tour.practicalInfo.meals,
      difficulty: tour.practicalInfo.difficulty,
      groupSize: tour.practicalInfo.groupSize,
      included: tour.practicalInfo.included.join('\n'),
      notIncluded: tour.practicalInfo.notIncluded.join('\n'),
    });
    setTourEditId(tour.id);
  };

  const buildTourFromForm = (): Tour => {
    const itineraryLines = tourForm.itinerary.split('\n').filter(Boolean);
    return {
      id: Number(tourForm.id),
      title: tourForm.title,
      isHot: tourForm.isHot,
      duration: tourForm.duration,
      tourType: tourForm.tourType,
      season: tourForm.season,
      description: tourForm.description,
      image: tourForm.image,
      price: tourForm.price,
      highlights: tourForm.highlights.split('\n').filter(Boolean),
      itinerary: itineraryLines.map((line, index) => {
        const parts = line.split(':');
        const title = parts.length > 1 ? parts[0].trim() : `Day ${index + 1}`;
        const description = parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim();
        return {
          day: index + 1,
          title,
          description,
        };
      }),
      packingList: tourForm.packingList.split('\n').filter(Boolean),
      practicalInfo: {
        accommodation: tourForm.accommodation,
        meals: tourForm.meals,
        difficulty: tourForm.difficulty,
        groupSize: tourForm.groupSize,
        included: tourForm.included.split('\n').filter(Boolean),
        notIncluded: tourForm.notIncluded.split('\n').filter(Boolean),
      },
    };
  };

  const handleSaveTour = async () => {
    setErrorMessage(null);
    if (!tourForm.id || !tourForm.title || !tourForm.price) {
      setErrorMessage('Tour ID, title, and price are required.');
      return;
    }

    let imageUrl = tourForm.image;
    setSavingTarget('tour');
    try {
      if (tourImageFile) {
        imageUrl = await uploadImage(tourImageFile, 'tours');
      }
      const tour = { ...buildTourFromForm(), image: imageUrl };
      if (tourEditId) {
        await updateTour(tourEditId, tour);
      } else {
        await createTour(tour);
      }
      setTours(await fetchTours());
      setTourForm(EMPTY_TOUR_FORM);
      setTourEditId(null);
      setTourImageFile(null);
      toast.success(tourEditId ? 'Tour updated.' : 'Tour created.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save tour.');
    } finally {
      setSavingTarget(null);
    }
  };

  const handleDeleteTour = async (id: number) => {
    if (!window.confirm('Delete this tour? It will disappear from the public website.')) {
      return;
    }
    try {
      await deleteTour(id);
      setTours(await fetchTours());
      toast.success('Tour deleted.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete tour.');
    }
  };

  const handleSaveSight = async () => {
    setErrorMessage(null);
    if (!sightForm.name || !sightForm.region) {
      setErrorMessage('Sight name and region are required.');
      return;
    }
    let imageUrl = sightForm.imageUrl;
    setSavingTarget('sight');
    try {
      if (sightImageFile) {
        imageUrl = await uploadImage(sightImageFile, 'sights');
      }
      if (sightEditId) {
        await updateSight(sightEditId, { ...sightForm, imageUrl });
        setSightEditId(null);
      } else {
        await createSight({ ...sightForm, imageUrl });
      }
      setSights(await fetchAdminSights());
      setSightForm({ name: '', region: '', description: '', imageUrl: '' });
      setSightImageFile(null);
      toast.success(sightEditId ? 'Sight updated.' : 'Sight added.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save sight.');
    } finally {
      setSavingTarget(null);
    }
  };

  const handleSaveBlogPost = async () => {
    setErrorMessage(null);
    if (!blogForm.title || !blogForm.content) {
      setErrorMessage('Blog title and content are required.');
      return;
    }
    let coverImage = blogForm.coverImage;
    setSavingTarget('blog');
    try {
      if (blogImageFile) {
        coverImage = await uploadImage(blogImageFile, 'blog-posts');
      }
      const slug =
        blogForm.slug.trim() ||
        blogForm.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      const post = {
        ...blogForm,
        slug,
        coverImage,
        publishedAt:
          blogForm.status === 'published'
            ? blogForm.publishedAt || new Date().toISOString()
            : blogForm.publishedAt,
      };
      if (blogEditId) {
        await updateBlogPost(blogEditId, post);
        setBlogEditId(null);
      } else {
        await createBlogPost(post);
      }
      setBlogPosts(await fetchAdminBlogPosts());
      setBlogForm(EMPTY_BLOG_FORM);
      setBlogImageFile(null);
      toast.success(blogEditId ? 'Blog post updated.' : 'Blog post created.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save blog post.');
    } finally {
      setSavingTarget(null);
    }
  };

  const handleDeleteSight = async (id: string) => {
    if (!window.confirm('Delete this sight?')) {
      return;
    }
    try {
      await deleteSight(id);
      setSights(await fetchAdminSights());
      toast.success('Sight deleted.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete sight.');
    }
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!window.confirm('Delete this guide? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteBlogPost(id);
      setBlogPosts(await fetchAdminBlogPosts());
      toast.success('Guide deleted.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete guide.');
    }
  };

  const handleApproveSubmission = async (submission: SellerSubmission) => {
    const submissionId = submission.id as string;
    await updateSellerSubmissionStatus(submissionId, 'approved');

    const newTour: Tour = {
      id: Math.max(0, ...tours.map((tour) => Number(tour.id) || 0)) + 1,
      title: String(submission.title || 'New Tour'),
      duration: String(submission.duration || 'TBD'),
      tourType: String(submission.tourType || 'Custom'),
      season: String(submission.season || 'All seasons'),
      description: String(submission.description || ''),
      image: String(submission.image || ''),
      price: String(submission.price || ''),
      highlights: (submission.highlights as string[]) || [],
      itinerary: ((submission.itinerary as string[]) || []).map((line, index) => ({
        day: index + 1,
        title: `Day ${index + 1}`,
        description: line,
      })),
      packingList: [],
      practicalInfo: {
        accommodation: 'To be confirmed',
        meals: 'To be confirmed',
        difficulty: 'Moderate',
        groupSize: '4-10 participants',
        included: [],
        notIncluded: [],
      },
    };
    await createTour(newTour);
    setSellerSubmissions(await fetchSellerSubmissions());
    setTours(await fetchTours());
    toast.success('Seller submission approved and added to tours.');
  };

  const handleCustomRequestStatusChange = async (id: string, status: string) => {
    await updateCustomTourRequestStatus(id, status);
    setCustomRequests((prev) =>
      prev.map((request) => (request.id === id ? { ...request, status } : request))
    );
    toast.success('Request status updated.');
  };

  const handleBookingStatusChange = async (id: string, status: string) => {
    await updateBookingStatus(id, status);
    setBookings((prev) =>
      prev.map((booking) => (booking.id === id ? { ...booking, status } : booking))
    );
    toast.success('Booking status updated.');
  };

  const handleSellerStatusChange = async (id: string, status: string) => {
    await updateSellerSubmissionStatus(id, status);
    setSellerSubmissions((prev) =>
      prev.map((submission) => (submission.id === id ? { ...submission, status } : submission))
    );
    toast.success('Seller submission updated.');
  };

  const handleFeedbackResponseChange = async (
    id: string,
    adminResponse: string,
    isPublished?: boolean
  ) => {
    await updateFeedbackResponse(id, adminResponse, isPublished);
    setFeedbackEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, adminResponse, isPublished: isPublished ?? entry.isPublished }
          : entry
      )
    );
    toast.success('Review updated.');
  };

  const handleUserRoleChange = async (id: string, role: string) => {
    await updateUserRole(id, role);
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role } : user)));
    toast.success('User role updated.');
  };

  const handleSaveContent = async () => {
    setSavingTarget('content');
    try {
      await updateContentSettings(contentSettings);
      toast.success('Website content settings saved.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save content settings.');
    } finally {
      setSavingTarget(null);
    }
  };

  const refreshTelegramStatus = async () => {
    const status = await fetchApiTelegramStatus();
    setTelegramStatus(status);
    return status;
  };

  const handleTelegramTest = async () => {
    setSavingTarget('telegram-test');
    try {
      const result = await sendApiTelegramTest();
      await refreshTelegramStatus();
      toast.success(`Telegram test sent to ${result.sent} chat(s).`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to send Telegram test.');
    } finally {
      setSavingTarget(null);
    }
  };

  const handleTelegramRetry = async () => {
    setSavingTarget('telegram-retry');
    try {
      await retryApiTelegramRequests();
      await refreshTelegramStatus();
      toast.success('Undelivered requests were sent again.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to retry Telegram delivery.');
    } finally {
      setSavingTarget(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading admin dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div key={activeTab} className="admin-section space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-medium text-foreground">Operations overview</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Content, incoming leads, reviews, and notification health at a glance.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-medium text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-lg border border-border p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-foreground">Telegram delivery</h2>
                    <p className="text-sm text-muted-foreground">Website lead notifications</p>
                  </div>
                  {telegramStatus?.configured && telegramStatus.registeredChatCount > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                {telegramStatus ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-muted-foreground">Connected chats</p>
                        <p className="mt-1 text-xl font-medium">{telegramStatus.registeredChatCount}</p>
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-muted-foreground">Undelivered</p>
                        <p className="mt-1 text-xl font-medium">{telegramStatus.undeliveredRequestCount}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bot {telegramStatus.configured ? 'configured' : 'not configured'} ·{' '}
                      {telegramStatus.pollingEnabled ? 'polling enabled' : 'polling disabled'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingTarget === 'telegram-test'}
                        onClick={handleTelegramTest}
                      >
                        <Bot className="h-4 w-4" />
                        Send test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          savingTarget === 'telegram-retry' ||
                          telegramStatus.undeliveredRequestCount === 0
                        }
                        onClick={handleTelegramRetry}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry undelivered
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Telegram status is available when the server API is connected.
                  </p>
                )}
              </section>

              <section className="rounded-lg border border-border p-4 sm:p-5">
                <h2 className="font-medium text-foreground">Needs attention</h2>
                <div className="mt-4 space-y-3">
                  <a
                    href="/admin/dashboard?tab=requests"
                    className="flex items-center justify-between rounded-md bg-muted p-3 text-sm hover:bg-muted/80"
                  >
                    <span>New custom requests</span>
                    <span className="font-medium">
                      {customRequests.filter((item) => (item.status || 'pending') === 'pending').length}
                    </span>
                  </a>
                  <a
                    href="/admin/dashboard?tab=bookings"
                    className="flex items-center justify-between rounded-md bg-muted p-3 text-sm hover:bg-muted/80"
                  >
                    <span>New bookings</span>
                    <span className="font-medium">
                      {bookings.filter((item) => (item.status || 'pending') === 'pending').length}
                    </span>
                  </a>
                  <a
                    href="/admin/dashboard?tab=blogs"
                    className="flex items-center justify-between rounded-md bg-muted p-3 text-sm hover:bg-muted/80"
                  >
                    <span>Draft guides</span>
                    <span className="font-medium">
                      {blogPosts.filter((item) => item.status === 'draft').length}
                    </span>
                  </a>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'tours' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl text-foreground mb-2">Tour Management</h2>
              <p className="text-muted-foreground text-sm">
                Create, edit, or delete tours. Keep highlights, images, and itinerary up to date.
              </p>
            </div>
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search tours"
                className="pl-9"
                placeholder="Search by title, type, or season"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {filteredTours.map((tour) => (
                  <div key={tour.id} className="border border-border rounded-lg p-4 space-y-2 admin-row">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">{tour.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {tour.price}{tour.isHot ? ' · Hot tours' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 admin-row-actions">
                        <Button size="sm" variant="outline" onClick={() => setTourFormFromTour(tour)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteTour(tour.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTours.length === 0 && <EmptyState text="No tours match this search." />}
              </div>
            <div className="space-y-4">
              <h3 className="text-lg text-foreground">
                {tourEditId ? 'Edit Tour' : 'Create Tour'}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tourId">Tour ID</Label>
                  <Input
                    id="tourId"
                    value={tourForm.id}
                    onChange={(event) => setTourForm({ ...tourForm, id: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourTitle">Title</Label>
                  <Input
                    id="tourTitle"
                    value={tourForm.title}
                    onChange={(event) => setTourForm({ ...tourForm, title: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourDuration">Duration</Label>
                  <Input
                    id="tourDuration"
                    value={tourForm.duration}
                    onChange={(event) => setTourForm({ ...tourForm, duration: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourPrice">Price</Label>
                  <Input
                    id="tourPrice"
                    value={tourForm.price}
                    onChange={(event) => setTourForm({ ...tourForm, price: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourSeason">Season</Label>
                  <Input
                    id="tourSeason"
                    value={tourForm.season}
                    onChange={(event) => setTourForm({ ...tourForm, season: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourType">Tour Type</Label>
                  <Input
                    id="tourType"
                    value={tourForm.tourType}
                    onChange={(event) => setTourForm({ ...tourForm, tourType: event.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tourImage">Image URL</Label>
                <Input
                  id="tourImage"
                  value={tourForm.image}
                  placeholder="/uploads/tours/photo.webp or https://..."
                  onChange={(event) => setTourForm({ ...tourForm, image: event.target.value })}
                />
                <div className="mt-3">
                  <ImageUploadPanel
                    id="tourImageFile"
                    label="Tour photo"
                    value={tourForm.image}
                    file={tourImageFile}
                    onFileChange={setTourImageFile}
                    description="Главное фото тура. Лучше горизонтальное 1600px+; JPG/WebP/PNG или HEIC — HEIC станет JPG автоматически."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tourDescription">Description</Label>
                <Textarea
                  id="tourDescription"
                  rows={3}
                  value={tourForm.description}
                  onChange={(event) => setTourForm({ ...tourForm, description: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tourHighlights">Highlights (one per line)</Label>
                <Textarea
                  id="tourHighlights"
                  rows={3}
                  value={tourForm.highlights}
                  onChange={(event) => setTourForm({ ...tourForm, highlights: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tourItinerary">Itinerary (one per line)</Label>
                <Textarea
                  id="tourItinerary"
                  rows={4}
                  value={tourForm.itinerary}
                  onChange={(event) => setTourForm({ ...tourForm, itinerary: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tourPacking">Packing List</Label>
                  <Textarea
                    id="tourPacking"
                    rows={3}
                    value={tourForm.packingList}
                    onChange={(event) => setTourForm({ ...tourForm, packingList: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourIncluded">Included</Label>
                  <Textarea
                    id="tourIncluded"
                    rows={3}
                    value={tourForm.included}
                    onChange={(event) => setTourForm({ ...tourForm, included: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourNotIncluded">Not Included</Label>
                  <Textarea
                    id="tourNotIncluded"
                    rows={3}
                    value={tourForm.notIncluded}
                    onChange={(event) => setTourForm({ ...tourForm, notIncluded: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourAccommodation">Accommodation</Label>
                  <Input
                    id="tourAccommodation"
                    value={tourForm.accommodation}
                    onChange={(event) => setTourForm({ ...tourForm, accommodation: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourMeals">Meals</Label>
                  <Input
                    id="tourMeals"
                    value={tourForm.meals}
                    onChange={(event) => setTourForm({ ...tourForm, meals: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourDifficulty">Difficulty</Label>
                  <Input
                    id="tourDifficulty"
                    value={tourForm.difficulty}
                    onChange={(event) => setTourForm({ ...tourForm, difficulty: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tourGroupSize">Group Size</Label>
                  <Input
                    id="tourGroupSize"
                    value={tourForm.groupSize}
                    onChange={(event) => setTourForm({ ...tourForm, groupSize: event.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveTour}
                disabled={savingTarget === 'tour'}
                className="admin-sticky-action btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {savingTarget === 'tour' ? 'Saving tour...' : tourEditId ? 'Update Tour' : 'Create Tour'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sights' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Sight Management</h2>
            <p className="text-muted-foreground text-sm">Add or update featured sights for travel content.</p>
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search sights"
              className="pl-9"
              placeholder="Search by sight or region"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredSights.map((sight) => (
              <div key={sight.id} className="border border-border rounded-lg p-4 flex justify-between admin-row">
                <div>
                  <p className="text-foreground">{sight.name}</p>
                  <p className="text-sm text-muted-foreground">{sight.region}</p>
                </div>
                <div className="flex gap-2 admin-row-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSightForm({
                        name: sight.name,
                        region: sight.region,
                        description: sight.description,
                        imageUrl: sight.imageUrl,
                      });
                      setSightEditId(sight.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSight(sight.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {filteredSights.length === 0 && <EmptyState text="No sights match this search." />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sightName">Name</Label>
              <Input
                id="sightName"
                value={sightForm.name}
                onChange={(event) => setSightForm({ ...sightForm, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sightRegion">Region</Label>
              <Input
                id="sightRegion"
                value={sightForm.region}
                onChange={(event) => setSightForm({ ...sightForm, region: event.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="sightDescription">Description</Label>
              <Textarea
                id="sightDescription"
                rows={3}
                value={sightForm.description}
                onChange={(event) => setSightForm({ ...sightForm, description: event.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="sightImage">Image URL</Label>
              <Input
                id="sightImage"
                value={sightForm.imageUrl}
                placeholder="/uploads/sights/photo.webp or https://..."
                onChange={(event) => setSightForm({ ...sightForm, imageUrl: event.target.value })}
              />
              <div className="mt-3">
                <ImageUploadPanel
                  id="sightImageFile"
                  label="Sight photo"
                  value={sightForm.imageUrl}
                  file={sightImageFile}
                  onFileChange={setSightImageFile}
                  description="Фото места для карточек и контента. Можно загрузить прямо с телефона: HEIC будет автоматически преобразован в JPG."
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveSight}
            disabled={savingTarget === 'sight'}
            className="admin-sticky-action btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {savingTarget === 'sight' ? 'Saving sight...' : sightEditId ? 'Update Sight' : 'Add Sight'}
          </Button>
        </div>
      )}

      {activeTab === 'blogs' && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl text-foreground">Travel guide publishing</h2>
            <p className="text-sm text-muted-foreground">
              Create search-focused guides, prepare drafts, and control what is visible on the website.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search travel guides"
                className="pl-9"
                placeholder="Search title, slug, or category"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter guides by status"
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredBlogPosts.map((post) => (
              <div key={post.id} className="rounded-lg border border-border p-4 admin-row">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{post.title}</p>
                      <StatusBadge status={post.status || 'published'} />
                      {post.featured && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      /blogs/{post.slug || post.id} · {post.category || 'Uncategorized'} ·{' '}
                      {post.readTime || 'Reading time not set'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 admin-row-actions">
                    {post.slug && post.status !== 'draft' && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/blogs/${post.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          View
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBlogForm({
                          slug: post.slug || '',
                          title: post.title,
                          excerpt: post.excerpt,
                          content: post.content,
                          coverImage: post.coverImage || '',
                          category: post.category || 'Travel guide',
                          readTime: post.readTime || '7 min read',
                          status: post.status || 'published',
                          featured: Boolean(post.featured),
                          publishedAt: post.publishedAt || '',
                          seoTitle: post.seoTitle || '',
                          seoDescription: post.seoDescription || '',
                        });
                        setBlogEditId(post.id);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteBlogPost(post.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredBlogPosts.length === 0 && <EmptyState text="No guides match these filters." />}
          </div>

          <div className="space-y-5 rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {blogEditId ? 'Edit guide' : 'Create a new guide'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save as a draft until the text, SEO fields, and cover image are ready.
                </p>
              </div>
              {blogEditId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBlogEditId(null);
                    setBlogForm(EMPTY_BLOG_FORM);
                    setBlogImageFile(null);
                  }}
                >
                  Cancel editing
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="blogTitle">Title</Label>
                <Input
                  id="blogTitle"
                  value={blogForm.title}
                  onChange={(event) => setBlogForm({ ...blogForm, title: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="blogSlug">URL slug</Label>
                <Input
                  id="blogSlug"
                  value={blogForm.slug}
                  placeholder="song-kul-lake-travel-guide"
                  onChange={(event) =>
                    setBlogForm({
                      ...blogForm,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, ''),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="blogCategory">Category</Label>
                <Input
                  id="blogCategory"
                  value={blogForm.category}
                  onChange={(event) => setBlogForm({ ...blogForm, category: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="blogReadTime">Reading time</Label>
                <Input
                  id="blogReadTime"
                  value={blogForm.readTime}
                  placeholder="7 min read"
                  onChange={(event) => setBlogForm({ ...blogForm, readTime: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="blogStatus">Publication status</Label>
                <select
                  id="blogStatus"
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                  value={blogForm.status}
                  onChange={(event) =>
                    setBlogForm({
                      ...blogForm,
                      status: event.target.value as BlogFormState['status'],
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex min-h-10 items-center gap-3 rounded-md border border-border bg-card px-3 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={blogForm.featured}
                  onChange={(event) =>
                    setBlogForm({ ...blogForm, featured: event.target.checked })
                  }
                />
                Feature this guide at the top of the blog page
              </label>
            </div>
            <div>
              <Label htmlFor="blogExcerpt">Card excerpt</Label>
              <Textarea
                id="blogExcerpt"
                rows={3}
                value={blogForm.excerpt}
                onChange={(event) => setBlogForm({ ...blogForm, excerpt: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="blogCover">Cover Image URL</Label>
              <Input
                id="blogCover"
                value={blogForm.coverImage}
                placeholder="/uploads/blog-posts/photo.webp or https://..."
                onChange={(event) => setBlogForm({ ...blogForm, coverImage: event.target.value })}
              />
              <div className="mt-3">
                <ImageUploadPanel
                  id="blogCoverFile"
                  label="Blog cover"
                  value={blogForm.coverImage || ''}
                  file={blogImageFile}
                  onFileChange={setBlogImageFile}
                  description="Обложка новости или статьи. HEIC с iPhone автоматически преобразуется в JPG после сохранения."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="blogContent">Article content (safe HTML supported)</Label>
              <Textarea
                id="blogContent"
                rows={16}
                value={blogForm.content}
                placeholder="<h2>Section title</h2><p>Article text...</p>"
                onChange={(event) => setBlogForm({ ...blogForm, content: event.target.value })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="blogSeoTitle">SEO title</Label>
                <Input
                  id="blogSeoTitle"
                  value={blogForm.seoTitle}
                  placeholder="Up to about 60 characters"
                  onChange={(event) => setBlogForm({ ...blogForm, seoTitle: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="blogPublishedAt">Publication date</Label>
                <Input
                  id="blogPublishedAt"
                  type="date"
                  value={blogForm.publishedAt.slice(0, 10)}
                  onChange={(event) =>
                    setBlogForm({ ...blogForm, publishedAt: event.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="blogSeoDescription">SEO description</Label>
                <Textarea
                  id="blogSeoDescription"
                  rows={2}
                  value={blogForm.seoDescription}
                  placeholder="A specific summary of roughly 140–160 characters"
                  onChange={(event) =>
                    setBlogForm({ ...blogForm, seoDescription: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSaveBlogPost}
                disabled={savingTarget === 'blog'}
                className="admin-sticky-action btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {savingTarget === 'blog'
                  ? 'Saving guide...'
                  : blogEditId
                    ? 'Update guide'
                    : blogForm.status === 'published'
                      ? 'Publish guide'
                      : 'Save draft'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl text-foreground">Custom tour leads</h2>
            <p className="text-sm text-muted-foreground">
              Contact travelers, record progress, and check whether each lead reached Telegram.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search custom requests"
                className="pl-9"
                placeholder="Search name, email, phone, or Telegram"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter custom requests"
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {leadStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <article key={request.id} className="space-y-4 rounded-lg border border-border p-4 admin-row">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{request.name}</p>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Received {formatAdminDate(request.createdAt)} · ID {request.id}
                    </p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                    value={request.status || 'pending'}
                    onChange={(event) =>
                      handleCustomRequestStatusChange(request.id, event.target.value)
                    }
                  >
                    {leadStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                    <div className="mt-1 space-y-1">
                      {request.email && <a className="block text-primary hover:underline" href={`mailto:${request.email}`}>{request.email}</a>}
                      {request.phone && <a className="block text-primary hover:underline" href={`tel:${request.phone}`}>{request.phone}</a>}
                      {request.telegramUsername && (
                        <a
                          className="block text-primary hover:underline"
                          href={`https://t.me/${request.telegramUsername.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {request.telegramUsername}
                        </a>
                      )}
                      {request.countryOfResidence && <p className="text-muted-foreground">Country: {request.countryOfResidence}</p>}
                      {request.contactPreference && <p className="text-muted-foreground">Preferred: {request.contactPreference}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Route & dates</p>
                    <p className="mt-1">{request.startLocation} → {request.endLocation}</p>
                    <p>{request.startDate || '?'} to {request.endDate || '?'}</p>
                    <p>{request.groupSize} traveler(s) · {request.pace || 'Pace not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Preferences</p>
                    <p className="mt-1">Budget: {request.budget || 'Not specified'}</p>
                    <p>Stay: {request.accommodation || 'Not specified'}</p>
                    <p>{request.activities?.join(', ') || 'No activities selected'}</p>
                  </div>
                </div>
                {request.specialRequests && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Traveler notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{request.specialRequests}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>Telegram delivery:</span>
                  <StatusBadge status={request.telegramDeliveryStatus} />
                  {request.telegramAttempts ? <span>{request.telegramAttempts} attempt(s)</span> : null}
                  {request.telegramError && <span className="text-red-700">{request.telegramError}</span>}
                </div>
              </article>
            ))}
            {filteredRequests.length === 0 && <EmptyState text="No custom requests match these filters." />}
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">Seller tour submissions</h3>
              <p className="text-sm text-muted-foreground">
                Review supplier content before adding it to the public tour catalog.
              </p>
            </div>
            {sellerSubmissions.map((submission) => (
              <article key={submission.id} className="space-y-3 rounded-lg border border-border p-4 admin-row">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{submission.title}</p>
                      <StatusBadge status={submission.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {submission.duration} · {submission.price} · {submission.season}
                    </p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                    value={submission.status || 'pending'}
                    onChange={(event) =>
                      handleSellerStatusChange(submission.id, event.target.value)
                    }
                  >
                    {sellerStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-foreground">{submission.description}</p>
                <p className="text-sm text-muted-foreground">
                  Supplier: {submission.contactName || 'Not specified'} ·{' '}
                  <a className="text-primary hover:underline" href={`mailto:${submission.contactEmail}`}>
                    {submission.contactEmail}
                  </a>
                </p>
                <div className="flex flex-wrap gap-2 admin-row-actions">
                  <Button
                    size="sm"
                    disabled={submission.status === 'approved'}
                    onClick={() => handleApproveSubmission(submission)}
                  >
                    Approve & Add to Tours
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleSellerStatusChange(submission.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
            {sellerSubmissions.length === 0 && <EmptyState text="No seller submissions yet." />}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl text-foreground">Booking leads</h2>
            <p className="text-sm text-muted-foreground">
              All requested tours, traveler contacts, dates, totals, and follow-up status.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search bookings"
                className="pl-9"
                placeholder="Search traveler, tour, email, or phone"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter bookings"
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {leadStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="space-y-4 rounded-lg border border-border p-4 admin-row">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{booking.tourTitle}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Received {formatAdminDate(booking.createdAt)} · ID {booking.id}
                    </p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                    value={booking.status || 'pending'}
                    onChange={(event) => handleBookingStatusChange(booking.id, event.target.value)}
                  >
                    {leadStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Traveler</p>
                    <p className="mt-1 font-medium">{booking.name}</p>
                    {booking.email && <a className="block text-primary hover:underline" href={`mailto:${booking.email}`}>{booking.email}</a>}
                    {booking.phone && <a className="block text-primary hover:underline" href={`tel:${booking.phone}`}>{booking.phone}</a>}
                    {booking.telegramUsername && (
                      <a
                        className="block text-primary hover:underline"
                        href={`https://t.me/${booking.telegramUsername.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {booking.telegramUsername}
                      </a>
                    )}
                    {booking.countryOfResidence && <p className="mt-1 text-muted-foreground">Country: {booking.countryOfResidence}</p>}
                    {booking.contactPreference && <p className="text-muted-foreground">Preferred: {booking.contactPreference}</p>}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Trip</p>
                    <p className="mt-1">{booking.startDate || '?'} to {booking.endDate || '?'}</p>
                    <p>{booking.participants} participant(s)</p>
                    <p>{booking.dateFlexibility || 'Fixed dates'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Value</p>
                    <p className="mt-1 text-lg font-medium">{booking.totalPrice || 'Not calculated'}</p>
                    <p>{booking.pricePerPerson || 'Price not set'} per person</p>
                  </div>
                </div>
                {booking.notes && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>Telegram delivery:</span>
                  <StatusBadge status={booking.telegramDeliveryStatus} />
                  {booking.telegramAttempts ? <span>{booking.telegramAttempts} attempt(s)</span> : null}
                  {booking.telegramError && <span className="text-red-700">{booking.telegramError}</span>}
                </div>
              </article>
            ))}
            {filteredBookings.length === 0 && <EmptyState text="No bookings match these filters." />}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">User Management</h2>
            <p className="text-muted-foreground text-sm">Assign roles to buyers and sellers.</p>
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search users"
              className="pl-9"
              placeholder="Search name, email, or role"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border border-border rounded-lg p-4 flex items-center justify-between admin-row">
                <div>
                  <p className="text-foreground">{user.name || user.email || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {formatAdminDate(user.createdAt)}
                  </p>
                </div>
                <select
                  className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                  value={user.role || 'buyer'}
                  onChange={(event) => handleUserRoleChange(user.id, event.target.value)}
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>
            ))}
            {filteredUsers.length === 0 && <EmptyState text="No users match this search." />}
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Content Settings</h2>
            <p className="text-muted-foreground text-sm">Update contact info and hero copy.</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="heroHeadline">Hero Headline</Label>
              <Input
                id="heroHeadline"
                value={contentSettings.heroHeadline || ''}
                onChange={(event) =>
                  setContentSettings({ ...contentSettings, heroHeadline: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="heroSubheadline">Hero Subheadline</Label>
              <Textarea
                id="heroSubheadline"
                rows={2}
                value={contentSettings.heroSubheadline || ''}
                onChange={(event) =>
                  setContentSettings({ ...contentSettings, heroSubheadline: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                value={contentSettings.contactEmail || ''}
                onChange={(event) =>
                  setContentSettings({ ...contentSettings, contactEmail: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contentSettings.contactPhone || ''}
                onChange={(event) =>
                  setContentSettings({ ...contentSettings, contactPhone: event.target.value })
                }
              />
            </div>
            <Button
              onClick={handleSaveContent}
              disabled={savingTarget === 'content'}
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingTarget === 'content' ? 'Saving content...' : 'Save Content'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Event Tracker</h2>
            <p className="text-muted-foreground text-sm">
              Page views, CTA clicks, request submits, and Telegram bot actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(eventSummary.totals).slice(0, 9).map(([key, value]) => (
              <div key={key} className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{key}</p>
                <p className="text-3xl text-foreground">{value}</p>
              </div>
            ))}
            {Object.keys(eventSummary.totals).length === 0 && (
              <p className="text-muted-foreground">No tracked events yet.</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg text-foreground">Recent Events</h3>
            {eventSummary.recent.map((event, index) => (
              <div
                key={`${event.created_at}-${index}`}
                className="border border-border rounded-lg p-4 admin-row"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-foreground font-medium">
                    {event.source}:{event.event_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{event.label || event.path}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-2xl text-foreground">Review moderation</h2>
            <p className="text-sm text-muted-foreground">
              Reply to traveler reviews and choose which ones are published on the website.
            </p>
          </div>
          <div className="space-y-4">
            {feedbackEntries.map((entry) => (
              <div key={entry.id} className="border border-border rounded-lg p-4 space-y-3 admin-row">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{entry.name}</p>
                      <span className="text-amber-600">{'★'.repeat(Math.max(1, Math.min(5, entry.rating || 5)))}</span>
                      <StatusBadge status={entry.isPublished ? 'published' : 'pending'} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {formatAdminDate(entry.createdAt)}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(entry.isPublished)}
                      onChange={(event) =>
                        handleFeedbackResponseChange(
                          entry.id,
                          entry.adminResponse || '',
                          event.target.checked
                        )
                      }
                    />
                    Publish
                  </label>
                </div>
                <p className="rounded-md bg-muted p-3 text-sm text-foreground">{entry.comments}</p>
                <div>
                  <Label htmlFor={`feedback-${entry.id}`}>Admin Response</Label>
                  <Textarea
                    id={`feedback-${entry.id}`}
                    rows={2}
                    value={entry.adminResponse || ''}
                    placeholder="Write a public response from Go Kyrgyzstan Travel"
                    onChange={(event) =>
                      setFeedbackEntries((current) =>
                        current.map((item) =>
                          item.id === entry.id
                            ? { ...item, adminResponse: event.target.value }
                            : item
                        )
                      )
                    }
                    onBlur={(event) =>
                      handleFeedbackResponseChange(
                        entry.id,
                        event.target.value,
                        entry.isPublished
                      )
                    }
                  />
                </div>
                <label
                  htmlFor="tourIsHot"
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground"
                >
                  <input
                    id="tourIsHot"
                    type="checkbox"
                    checked={tourForm.isHot}
                    onChange={(event) => setTourForm({ ...tourForm, isHot: event.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Show in Hot tours on home
                </label>
              </div>
            ))}
            {feedbackEntries.length === 0 && <EmptyState text="No traveler reviews yet." />}
          </div>
        </div>
      )}

      {activeTab === 'overview' && feedbackEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg text-foreground">Latest Feedback</h3>
          {feedbackEntries.slice(0, 3).map((entry) => (
            <div key={entry.id} className="border border-border rounded-lg p-4 admin-row">
              <p className="text-foreground font-medium">{entry.name}</p>
              <p className="text-sm text-muted-foreground">{entry.comments}</p>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

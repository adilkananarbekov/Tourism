import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Textarea } from '../app/components/ui/textarea';
import type { Tour } from '../app/components/tour-data';
import { toast } from 'sonner';
import { uploadImage } from '../app/lib/storage';
import {
  BlogPost,
  ContentSettings,
  FeedbackEntry,
  Sight,
  UserRecord,
  createBlogPost,
  createSight,
  createTour,
  deleteBlogPost,
  deleteSight,
  deleteTour,
  fetchBlogPosts,
  fetchContentSettings,
  fetchSellerSubmissions,
  fetchSights,
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
} from '../app/lib/firestore';

type TourFormState = {
  id: string;
  title: string;
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

const statusOptions = ['pending', 'approved', 'rejected', 'completed'];

export function AdminDashboardPage() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  const [tours, setTours] = useState<Tour[]>([]);
  const [sights, setSights] = useState<Sight[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [customRequests, setCustomRequests] = useState<Array<Record<string, unknown>>>([]);
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [sellerSubmissions, setSellerSubmissions] = useState<Array<Record<string, unknown>>>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [contentSettings, setContentSettings] = useState<ContentSettings>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tourForm, setTourForm] = useState<TourFormState>(EMPTY_TOUR_FORM);
  const [tourEditId, setTourEditId] = useState<number | null>(null);

  const [sightForm, setSightForm] = useState({ name: '', region: '', description: '', imageUrl: '' });
  const [sightEditId, setSightEditId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', coverImage: '' });
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
        const [toursData, sightsData, blogData, usersData, contentData] = await Promise.all([
          fetchTours(),
          fetchSights(),
          fetchBlogPosts(),
          fetchUsers(),
          fetchContentSettings(),
        ]);
        if (!isActive) {
          return;
        }
        setTours(toursData);
        setSights(sightsData);
        setBlogPosts(blogData);
        setUsers(usersData);
        setContentSettings(contentData || {});
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
          toast('New custom tour request received.');
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

  const stats = useMemo(() => {
    return [
      { label: 'Tours', value: tours.length },
      { label: 'Bookings', value: bookings.length },
      { label: 'Custom Requests', value: customRequests.length },
      { label: 'Seller Submissions', value: sellerSubmissions.length },
    ];
  }, [tours, bookings, customRequests, sellerSubmissions]);

  const setTourFormFromTour = (tour: Tour) => {
    setTourForm({
      id: String(tour.id),
      title: tour.title,
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
    try {
      if (tourImageFile) {
        imageUrl = await uploadImage(tourImageFile, 'tours');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to upload tour image.');
      return;
    }

    const tour = { ...buildTourFromForm(), image: imageUrl };
    try {
      if (tourEditId) {
        await updateTour(tourEditId, tour);
      } else {
        await createTour(tour);
      }
      setTours(await fetchTours());
      setTourForm(EMPTY_TOUR_FORM);
      setTourEditId(null);
      setTourImageFile(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save tour.');
    }
  };

  const handleDeleteTour = async (id: number) => {
    await deleteTour(id);
    setTours(await fetchTours());
  };

  const handleSaveSight = async () => {
    setErrorMessage(null);
    if (!sightForm.name || !sightForm.region) {
      setErrorMessage('Sight name and region are required.');
      return;
    }
    let imageUrl = sightForm.imageUrl;
    try {
      if (sightImageFile) {
        imageUrl = await uploadImage(sightImageFile, 'sights');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to upload sight image.');
      return;
    }
    if (sightEditId) {
      await updateSight(sightEditId, { ...sightForm, imageUrl });
      setSightEditId(null);
    } else {
      await createSight({ ...sightForm, imageUrl });
    }
    setSights(await fetchSights());
    setSightForm({ name: '', region: '', description: '', imageUrl: '' });
    setSightImageFile(null);
  };

  const handleSaveBlogPost = async () => {
    setErrorMessage(null);
    if (!blogForm.title || !blogForm.content) {
      setErrorMessage('Blog title and content are required.');
      return;
    }
    let coverImage = blogForm.coverImage;
    try {
      if (blogImageFile) {
        coverImage = await uploadImage(blogImageFile, 'blog-posts');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to upload blog image.');
      return;
    }
    if (blogEditId) {
      await updateBlogPost(blogEditId, { ...blogForm, coverImage });
      setBlogEditId(null);
    } else {
      await createBlogPost({ ...blogForm, coverImage });
    }
    setBlogPosts(await fetchBlogPosts());
    setBlogForm({ title: '', excerpt: '', content: '', coverImage: '' });
    setBlogImageFile(null);
  };

  const handleDeleteSight = async (id: string) => {
    await deleteSight(id);
    setSights(await fetchSights());
  };

  const handleApproveSubmission = async (submission: Record<string, unknown>) => {
    const submissionId = submission.id as string;
    await updateSellerSubmissionStatus(submissionId, 'approved');

    const newTour: Tour = {
      id: Date.now(),
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
  };

  const handleCustomRequestStatusChange = async (id: string, status: string) => {
    await updateCustomTourRequestStatus(id, status);
    setCustomRequests((prev) =>
      prev.map((request) => (request.id === id ? { ...request, status } : request))
    );
  };

  const handleBookingStatusChange = async (id: string, status: string) => {
    await updateBookingStatus(id, status);
    setBookings((prev) =>
      prev.map((booking) => (booking.id === id ? { ...booking, status } : booking))
    );
  };

  const handleSellerStatusChange = async (id: string, status: string) => {
    await updateSellerSubmissionStatus(id, status);
    setSellerSubmissions((prev) =>
      prev.map((submission) => (submission.id === id ? { ...submission, status } : submission))
    );
  };

  const handleFeedbackResponseChange = async (id: string, adminResponse: string) => {
    await updateFeedbackResponse(id, adminResponse);
    setFeedbackEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, adminResponse } : entry))
    );
  };

  const handleUserRoleChange = async (id: string, role: string) => {
    await updateUserRole(id, role);
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role } : user)));
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading admin dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div key={activeTab} className="admin-section space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl text-foreground">{stat.value}</p>
              </div>
            ))}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {tours.map((tour) => (
                  <div key={tour.id} className="border border-border rounded-lg p-4 space-y-2 admin-row">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">{tour.title}</p>
                        <p className="text-sm text-muted-foreground">{tour.price}</p>
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
              </div>
            <div className="space-y-4">
              <h3 className="text-lg text-foreground">
                {tourEditId ? 'Edit Tour' : 'Create Tour'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
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
                  onChange={(event) => setTourForm({ ...tourForm, image: event.target.value })}
                />
                <div className="mt-2">
                  <Label htmlFor="tourImageFile">Or Upload Image</Label>
                  <Input
                    id="tourImageFile"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setTourImageFile(event.target.files?.[0] || null)}
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
              <div className="grid grid-cols-2 gap-3">
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
                className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {tourEditId ? 'Update Tour' : 'Create Tour'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sights' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Sight Management</h2>
            <p className="text-muted-foreground text-sm">Add or update sights shown in the explore page.</p>
          </div>
          <div className="space-y-3">
            {sights.map((sight) => (
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
                onChange={(event) => setSightForm({ ...sightForm, imageUrl: event.target.value })}
              />
              <div className="mt-2">
                <Label htmlFor="sightImageFile">Or Upload Image</Label>
                <Input
                  id="sightImageFile"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSightImageFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveSight}
            className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {sightEditId ? 'Update Sight' : 'Add Sight'}
          </Button>
        </div>
      )}

      {activeTab === 'blogs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">News & Blog Management</h2>
            <p className="text-muted-foreground text-sm">Publish news updates and edit travel stories.</p>
          </div>
          <div className="space-y-3">
            {blogPosts.map((post) => (
              <div key={post.id} className="border border-border rounded-lg p-4 flex justify-between admin-row">
                <div>
                  <p className="text-foreground">{post.title}</p>
                  <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                </div>
                <div className="flex gap-2 admin-row-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBlogForm({
                        title: post.title,
                        excerpt: post.excerpt,
                        content: post.content,
                        coverImage: post.coverImage || '',
                      });
                      setBlogEditId(post.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      await deleteBlogPost(post.id);
                      setBlogPosts(await fetchBlogPosts());
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blogTitle">Title</Label>
              <Input
                id="blogTitle"
                value={blogForm.title}
                onChange={(event) => setBlogForm({ ...blogForm, title: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="blogExcerpt">Excerpt</Label>
              <Textarea
                id="blogExcerpt"
                rows={2}
                value={blogForm.excerpt}
                onChange={(event) => setBlogForm({ ...blogForm, excerpt: event.target.value })}
              />
            </div>
            <div>
              <Label>Content</Label>
              <ReactQuill
                theme="snow"
                value={blogForm.content}
                onChange={(value) => setBlogForm({ ...blogForm, content: value })}
              />
            </div>
            <div>
              <Label htmlFor="blogCover">Cover Image URL</Label>
              <Input
                id="blogCover"
                value={blogForm.coverImage}
                onChange={(event) => setBlogForm({ ...blogForm, coverImage: event.target.value })}
              />
              <div className="mt-2">
                <Label htmlFor="blogCoverFile">Or Upload Image</Label>
                <Input
                  id="blogCoverFile"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setBlogImageFile(event.target.files?.[0] || null)}
                />
              </div>
            </div>
            <Button
              onClick={handleSaveBlogPost}
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {blogEditId ? 'Update Blog Post' : 'Create Blog Post'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Custom Requests</h2>
            <p className="text-muted-foreground text-sm">Review custom tour requests and seller submissions.</p>
          </div>
          <div className="space-y-3">
            {customRequests.map((request) => (
              <div key={request.id as string} className="border border-border rounded-lg p-4 space-y-2 admin-row">
                <p className="text-foreground font-medium">{request.name as string}</p>
                <p className="text-sm text-muted-foreground">
                  Dates: {request.startDate as string} to {request.endDate as string}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                    value={(request.status as string) || 'pending'}
                    onChange={(event) =>
                      handleCustomRequestStatusChange(request.id as string, event.target.value)
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg text-foreground">Seller Submissions</h3>
            {sellerSubmissions.map((submission) => (
              <div key={submission.id as string} className="border border-border rounded-lg p-4 space-y-2 admin-row">
                <p className="text-foreground font-medium">{submission.title as string}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {(submission.status as string) || 'pending'}
                </p>
                <div className="flex gap-2 admin-row-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSellerStatusChange(submission.id as string, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveSubmission(submission)}
                  >
                    Approve & Add to Tours
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleSellerStatusChange(submission.id as string, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Bookings</h2>
            <p className="text-muted-foreground text-sm">Update booking status after review.</p>
          </div>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id as string} className="border border-border rounded-lg p-4 space-y-2 admin-row">
                <p className="text-foreground font-medium">{booking.tourTitle as string}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.name as string} - {booking.startDate as string} to {booking.endDate as string}
                </p>
                <select
                  className="h-9 rounded-md border border-border bg-card px-2 text-sm"
                  value={(booking.status as string) || 'pending'}
                  onChange={(event) => handleBookingStatusChange(booking.id as string, event.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">User Management</h2>
            <p className="text-muted-foreground text-sm">Assign roles to buyers and sellers.</p>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="border border-border rounded-lg p-4 flex items-center justify-between admin-row">
                <div>
                  <p className="text-foreground">{user.name || user.email || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
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
              onClick={() => updateContentSettings(contentSettings)}
              className="btn-micro bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Content
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl text-foreground mb-2">Feedback Responses</h2>
            <p className="text-muted-foreground text-sm">
              Respond to traveler feedback and highlight helpful comments.
            </p>
          </div>
          <div className="space-y-4">
            {feedbackEntries.map((entry) => (
              <div key={entry.id} className="border border-border rounded-lg p-4 space-y-3 admin-row">
                <div>
                  <p className="text-foreground font-medium">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">{entry.comments}</p>
                </div>
                <div>
                  <Label htmlFor={`feedback-${entry.id}`}>Admin Response</Label>
                  <Textarea
                    id={`feedback-${entry.id}`}
                    rows={2}
                    defaultValue={entry.adminResponse || ''}
                    onBlur={(event) => handleFeedbackResponseChange(entry.id, event.target.value)}
                  />
                </div>
              </div>
            ))}
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

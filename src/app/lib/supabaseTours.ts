import type { Tour } from '../components/tour-data';
import { requireSupabase, supabaseClientEnabled } from './supabase';

type SupabaseTourRow = {
  id: number;
  title: string;
  duration: string;
  tour_type: string;
  season: string;
  description: string;
  image: string;
  price: string;
  locations: Tour['locations'];
  highlights: string[];
  itinerary: Tour['itinerary'];
  packing_list: string[];
  practical_info: Tour['practicalInfo'];
};

export async function fetchSupabaseTours(): Promise<Tour[]> {
  if (!supabaseClientEnabled) {
    return [];
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('tours')
    .select(
      'id,title,duration,tour_type,season,description,image,price,locations,highlights,itinerary,packing_list,practical_info'
    )
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data || []) as SupabaseTourRow[]).map((tour) => ({
    id: tour.id,
    title: tour.title,
    duration: tour.duration,
    tourType: tour.tour_type,
    season: tour.season,
    description: tour.description,
    image: tour.image,
    price: tour.price,
    locations: tour.locations || [],
    highlights: tour.highlights || [],
    itinerary: tour.itinerary || [],
    packingList: tour.packing_list || [],
    practicalInfo: tour.practical_info || {
      accommodation: '',
      meals: '',
      difficulty: '',
      groupSize: '',
      included: [],
      notIncluded: [],
    },
  }));
}

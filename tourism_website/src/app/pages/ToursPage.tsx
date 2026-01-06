import { useMemo, useState } from 'react';
import { ToursGrid } from '../components/ToursGrid';
import { useToursData } from '../hooks/useTours';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SEO } from '../components/SEO';

export function ToursPage() {
  const { tours, loading, error } = useToursData();
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const options = useMemo(() => {
    const seasons = new Set<string>();
    const types = new Set<string>();
    const difficulties = new Set<string>();
    tours.forEach((tour) => {
      if (tour.season) {
        seasons.add(tour.season);
      }
      if (tour.tourType) {
        types.add(tour.tourType);
      }
      if (tour.practicalInfo?.difficulty) {
        difficulties.add(tour.practicalInfo.difficulty);
      }
    });
    return {
      seasons: Array.from(seasons),
      types: Array.from(types),
      difficulties: Array.from(difficulties),
    };
  }, [tours]);

  const filteredTours = useMemo(() => {
    const normalizePrice = (price: string) => {
      const parsed = Number(price.replace(/[^0-9.]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const normalizeDuration = (duration: string) => {
      const parsed = Number(duration.replace(/[^0-9]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    let result = tours.filter((tour) => {
      const matchesSearch =
        !search ||
        tour.title.toLowerCase().includes(search.toLowerCase()) ||
        tour.description.toLowerCase().includes(search.toLowerCase()) ||
        tour.tourType.toLowerCase().includes(search.toLowerCase());
      const matchesSeason = seasonFilter === 'all' || tour.season === seasonFilter;
      const matchesType = typeFilter === 'all' || tour.tourType === typeFilter;
      const matchesDifficulty =
        difficultyFilter === 'all' || tour.practicalInfo.difficulty === difficultyFilter;
      const priceValue = normalizePrice(tour.price);
      const matchesMin = min === null || priceValue >= min;
      const matchesMax = max === null || priceValue <= max;
      return matchesSearch && matchesSeason && matchesType && matchesDifficulty && matchesMin && matchesMax;
    });

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => normalizePrice(a.price) - normalizePrice(b.price));
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => normalizePrice(b.price) - normalizePrice(a.price));
    } else if (sortBy === 'duration') {
      result = [...result].sort((a, b) => normalizeDuration(a.duration) - normalizeDuration(b.duration));
    }

    return result;
  }, [difficultyFilter, maxPrice, minPrice, search, seasonFilter, sortBy, tours, typeFilter]);

  return (
    <div className="py-12">
      <SEO
        title="Tours"
        description="Browse Kyrgyzstan tours by season, difficulty, and price."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl text-foreground mb-3">Tours</h1>
          <p className="text-muted-foreground">
            Filter tours by season, type, difficulty, and budget.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search tours"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="season">Season</Label>
            <select
              id="season"
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={seasonFilter}
              onChange={(event) => setSeasonFilter(event.target.value)}
            >
              <option value="all">All</option>
              {options.seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="tourType">Type</Label>
            <select
              id="tourType"
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">All</option>
              {options.types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
            >
              <option value="all">All</option>
              {options.difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sortBy">Sort</Label>
            <select
              id="sortBy"
              className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="duration">Duration</option>
            </select>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                placeholder="2000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredTours.length} of {tours.length} tours
        </p>
      </div>

      <ToursGrid tours={filteredTours} loading={loading} error={error} stagger />
    </div>
  );
}

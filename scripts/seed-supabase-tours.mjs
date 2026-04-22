import fs from 'node:fs';
import vm from 'node:vm';

function readEnv() {
  const values = {};
  if (!fs.existsSync('.env')) {
    return values;
  }

  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#') || !line.includes('=')) {
      continue;
    }
    const [key, ...rest] = line.split('=');
    values[key.trim()] = rest.join('=').trim();
  }
  return values;
}

function readTours() {
  const source = fs.readFileSync('src/app/components/tour-data.ts', 'utf8');
  const start = source.indexOf('export const tours');
  const body = source
    .slice(start)
    .replace(/^export const tours:\s*Tour\[\]\s*=/, 'const tours =')
    .replace(/;\s*$/, '');
  return JSON.parse(vm.runInNewContext(`${body}; JSON.stringify(tours);`));
}

const env = readEnv();
const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !apiKey) {
  throw new Error('Missing VITE_SUPABASE_URL and a Supabase API key in .env.');
}

const rows = readTours().map((tour) => ({
  id: tour.id,
  title: tour.title,
  duration: tour.duration,
  tour_type: tour.tourType,
  season: tour.season,
  description: tour.description,
  image: tour.image,
  price: tour.price,
  locations: tour.locations || [],
  highlights: tour.highlights || [],
  itinerary: tour.itinerary || [],
  packing_list: tour.packingList || [],
  practical_info: tour.practicalInfo || {},
  is_active: true,
}));

const response = await fetch(`${supabaseUrl}/rest/v1/tours?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
});

if (!response.ok) {
  throw new Error(`Unable to seed tours: ${response.status} ${await response.text()}`);
}

console.log(`Seeded ${rows.length} tours into Supabase.`);

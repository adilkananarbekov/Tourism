import fs from 'node:fs';
import path from 'node:path';

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

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

const env = readEnv();
const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const bucket = env.VITE_SUPABASE_ASSET_BUCKET || 'tourism-assets';

if (!supabaseUrl || !apiKey) {
  throw new Error('Missing VITE_SUPABASE_URL and an upload key in .env.');
}

const publicDir = path.resolve('public');
const files = [...walkFiles('public/images'), ...walkFiles('public/videos')].filter((file) =>
  Boolean(mimeTypes[path.extname(file).toLowerCase()])
);

let uploaded = 0;
for (const file of files) {
  const relativePath = path.relative(publicDir, path.resolve(file)).replaceAll(path.sep, '/');
  const objectPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const contentType = mimeTypes[path.extname(file).toLowerCase()];
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: 'PUT',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: fs.readFileSync(file),
  });

  if (!response.ok) {
    throw new Error(`Unable to upload ${relativePath}: ${response.status} ${await response.text()}`);
  }
  uploaded += 1;
}

console.log(`Uploaded ${uploaded} media files to Supabase Storage bucket "${bucket}".`);

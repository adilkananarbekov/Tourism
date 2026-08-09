import crypto from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';

const currentFilePath = fileURLToPath(import.meta.url);
const backendDir = path.dirname(currentFilePath);
const sourceRepoRoot = path.resolve(backendDir, '..');
const repoRoot = fs.existsSync(path.join(sourceRepoRoot, 'data', 'seed_tours.json'))
  ? sourceRepoRoot
  : backendDir;

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(backendDir, '.env') });

const seedToursPath = path.join(repoRoot, 'data', 'seed_tours.json');
const seedBlogPostsPath = path.join(repoRoot, 'data', 'seed_blog_posts.json');
const seedSightsPath = path.join(repoRoot, 'data', 'seed_sights.json');
const galleryImagesPath = path.join(repoRoot, 'data', 'gallery_images.json');
const destinationsPath = path.join(repoRoot, 'data', 'destinations.json');
const tourSlugsPath = path.join(repoRoot, 'data', 'tour_slugs.json');
const legacyDataFilePath = path.resolve(repoRoot, process.env.DATA_FILE_PATH || 'backend/data/app-data.json');
const databasePath = path.resolve(repoRoot, process.env.DATABASE_PATH || 'backend/data/go-kyrgyzstan-travel.sqlite');
const uploadsDir = path.resolve(repoRoot, process.env.UPLOADS_DIR || 'public/uploads');
const uploadsPublicPath = `/${(process.env.UPLOADS_PUBLIC_PATH || '/uploads').replace(/^\/+|\/+$/g, '')}`;
const heifConvertBinary = process.env.HEIF_CONVERT_BIN || '/usr/bin/heif-convert';
const execFile = promisify(execFileCallback);
const imageUploadContentTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const heifUploadContentTypes = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) {
    return fallback;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${filePath}: ${message}`);
  }
}

const tourSlugs = readJsonFile(tourSlugsPath, {});

function publicTourPath(tour, locale = 'en') {
  const slug = asString(tourSlugs[String(tour?.id)], 160);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return null;
  }
  return `${locale === 'ru' ? '/ru' : ''}/tours/${slug}`;
}

function nowIso() {
  return new Date().toISOString();
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value, maxLength = 240) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, maxLength);
}

function normalizeTelegramUsername(value) {
  return asString(value, 80).replace(/^@+/, '').toLowerCase();
}

function asNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeGuestRequestPayload(type, payload) {
  const normalized = {};
  const stringFields = {
    name: 160,
    countryOfResidence: 240,
    contactPreference: 80,
    email: 240,
    telegramUsername: 80,
    phone: 80,
    tourTitle: 240,
    startDate: 40,
    endDate: 40,
    dateFlexibility: 240,
    startLocation: 240,
    endLocation: 240,
    pace: 120,
    accommodation: 240,
    budget: 120,
    pricePerPerson: 120,
    totalPrice: 120,
    notes: 2000,
    specialRequests: 3000,
    userId: 160,
  };

  for (const [field, maxLength] of Object.entries(stringFields)) {
    normalized[field] = asString(payload[field], maxLength);
  }

  for (const field of ['sights', 'activities']) {
    normalized[field] = Array.isArray(payload[field])
      ? payload[field].slice(0, 30).map((item) => asString(item, 160)).filter(Boolean)
      : [];
  }

  const countField = type === 'booking' ? 'participants' : 'groupSize';
  normalized[countField] = Math.min(100, Math.max(1, Math.trunc(asNumber(payload[countField], 1))));

  if (type === 'booking') {
    normalized.tourId = Math.max(0, Math.trunc(asNumber(payload.tourId, 0)));
  }

  if (!normalized.name) {
    throw new Error('Name is required.');
  }
  if (!normalized.countryOfResidence) {
    throw new Error('Country of residence is required.');
  }
  const contactPreferences = new Set(['whatsapp', 'telegram', 'email']);
  if (!contactPreferences.has(normalized.contactPreference)) {
    throw new Error('Choose WhatsApp, Telegram, or email as the contact method.');
  }
  const normalizedPhone = normalized.phone.replace(/[\s()-]/g, '');
  if (normalized.contactPreference === 'whatsapp' && !/^\+\d{7,15}$/.test(normalizedPhone)) {
    throw new Error('Use a phone number with country code, for example +1 803 555 0123.');
  }
  if (normalized.contactPreference === 'telegram' && !normalized.telegramUsername) {
    throw new Error('Telegram username is required for the selected contact method.');
  }
  if (normalized.contactPreference === 'email' && !normalized.email) {
    throw new Error('Email is required for the selected contact method.');
  }
  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    throw new Error('Email address is invalid.');
  }
  if (type === 'booking' && !normalized.tourId && !normalized.tourTitle) {
    throw new Error('Tour is required for a booking request.');
  }

  return normalized;
}

function parseJson(value, fallback) {
  if (typeof value !== 'string' || !value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stringifyJson(value) {
  return JSON.stringify(value ?? null);
}

function sanitizeSlug(value, fallback = 'file') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallback;
}

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    tour_json TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guest_requests (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('booking', 'custom_tour_request')),
    payload_json TEXT NOT NULL,
    source_ip TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_events (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'web',
    event_name TEXT NOT NULL,
    path TEXT,
    label TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS seller_submissions (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedback_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comments TEXT NOT NULL,
    admin_response TEXT NOT NULL DEFAULT '',
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tours_active ON tours(is_active);
  CREATE INDEX IF NOT EXISTS idx_guest_requests_created ON guest_requests(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_guest_requests_status ON guest_requests(status);
  CREATE INDEX IF NOT EXISTS idx_site_events_created ON site_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_site_events_name ON site_events(event_name);
  CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
  CREATE INDEX IF NOT EXISTS idx_seller_submissions_owner ON seller_submissions(owner_id);
  CREATE INDEX IF NOT EXISTS idx_seller_submissions_status ON seller_submissions(status);
  CREATE INDEX IF NOT EXISTS idx_feedback_published ON feedback_entries(is_published);
`);

function ensureColumn(tableName, columnName, definition) {
  const columns = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

ensureColumn('guest_requests', 'telegram_delivery_status', "TEXT NOT NULL DEFAULT 'waiting'");
ensureColumn('guest_requests', 'telegram_attempts', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('guest_requests', 'telegram_sent_at', 'TEXT');
ensureColumn('guest_requests', 'telegram_error', 'TEXT');

const statements = {
  getMeta: sqlite.prepare('SELECT value FROM meta WHERE key = ?'),
  setMeta: sqlite.prepare(`
    INSERT INTO meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `),
  countTours: sqlite.prepare('SELECT COUNT(*) AS count FROM tours'),
  maxTourId: sqlite.prepare('SELECT COALESCE(MAX(id), 0) AS id FROM tours'),
  listTours: sqlite.prepare('SELECT * FROM tours WHERE is_active = 1 ORDER BY id ASC'),
  listAdminTours: sqlite.prepare('SELECT * FROM tours ORDER BY id ASC'),
  getTour: sqlite.prepare('SELECT * FROM tours WHERE id = ?'),
  upsertTour: sqlite.prepare(`
    INSERT INTO tours (id, title, tour_json, is_active, created_at, updated_at)
    VALUES (@id, @title, @tourJson, @isActive, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      tour_json = excluded.tour_json,
      is_active = excluded.is_active,
      updated_at = excluded.updated_at
  `),
  deleteTour: sqlite.prepare('UPDATE tours SET is_active = 0, updated_at = ? WHERE id = ?'),
  insertGuestRequest: sqlite.prepare(`
    INSERT OR IGNORE INTO guest_requests
      (id, type, payload_json, source_ip, status, created_at, updated_at)
    VALUES
      (@id, @type, @payloadJson, @sourceIp, @status, @createdAt, @updatedAt)
  `),
  listGuestRequests: sqlite.prepare('SELECT * FROM guest_requests ORDER BY created_at DESC LIMIT 500'),
  listUndeliveredGuestRequests: sqlite.prepare(`
    SELECT *
    FROM guest_requests
    WHERE telegram_delivery_status != 'sent'
    ORDER BY created_at ASC
    LIMIT 100
  `),
  getGuestRequest: sqlite.prepare('SELECT * FROM guest_requests WHERE id = ?'),
  updateGuestRequestStatus: sqlite.prepare(`
    UPDATE guest_requests
    SET status = ?, updated_at = ?
    WHERE id = ?
  `),
  updateGuestRequestTelegramDelivery: sqlite.prepare(`
    UPDATE guest_requests
    SET
      telegram_delivery_status = ?,
      telegram_attempts = telegram_attempts + 1,
      telegram_sent_at = ?,
      telegram_error = ?
    WHERE id = ?
  `),
  countUndeliveredGuestRequests: sqlite.prepare(`
    SELECT COUNT(*) AS count
    FROM guest_requests
    WHERE telegram_delivery_status != 'sent'
  `),
  insertEvent: sqlite.prepare(`
    INSERT OR IGNORE INTO site_events
      (id, source, event_name, path, label, metadata_json, created_at)
    VALUES
      (@id, @source, @eventName, @path, @label, @metadataJson, @createdAt)
  `),
  trimEvents: sqlite.prepare(`
    DELETE FROM site_events
    WHERE id NOT IN (
      SELECT id FROM site_events ORDER BY created_at DESC LIMIT 5000
    )
  `),
  purgeExpiredEvents: sqlite.prepare('DELETE FROM site_events WHERE created_at < ?'),
  eventTotals: sqlite.prepare(`
    SELECT event_name, COUNT(*) AS count
    FROM site_events
    GROUP BY event_name
    ORDER BY count DESC, event_name ASC
  `),
  recentEvents: sqlite.prepare(`
    SELECT source, event_name, path, label, created_at
    FROM site_events
    ORDER BY created_at DESC
    LIMIT 40
  `),
  topEventPaths: sqlite.prepare(`
    SELECT path, COUNT(*) AS count
    FROM site_events
    WHERE path != ''
    GROUP BY path
    ORDER BY count DESC, path ASC
    LIMIT 12
  `),
  topEventInterests: sqlite.prepare(`
    SELECT label, COUNT(*) AS count
    FROM site_events
    WHERE label != ''
      AND event_name NOT IN ('page_view', 'scroll_depth', 'analytics_consent_granted')
    GROUP BY label
    ORDER BY count DESC, label ASC
    LIMIT 12
  `),
  createUser: sqlite.prepare(`
    INSERT INTO app_users (id, name, email, password_hash, role, created_at, updated_at)
    VALUES (@id, @name, @email, @passwordHash, @role, @createdAt, @updatedAt)
  `),
  getUserById: sqlite.prepare('SELECT * FROM app_users WHERE id = ?'),
  getUserByEmail: sqlite.prepare('SELECT * FROM app_users WHERE email = ?'),
  listUsers: sqlite.prepare('SELECT * FROM app_users ORDER BY created_at DESC LIMIT 500'),
  updateUserProfile: sqlite.prepare(`
    UPDATE app_users
    SET name = ?, role = ?, updated_at = ?
    WHERE id = ?
  `),
  updateUserRole: sqlite.prepare(`
    UPDATE app_users
    SET role = ?, updated_at = ?
    WHERE id = ?
  `),
  insertSellerSubmission: sqlite.prepare(`
    INSERT INTO seller_submissions
      (id, owner_id, payload_json, status, created_at, updated_at)
    VALUES
      (@id, @ownerId, @payloadJson, @status, @createdAt, @updatedAt)
  `),
  listSellerSubmissions: sqlite.prepare(`
    SELECT * FROM seller_submissions ORDER BY created_at DESC LIMIT 500
  `),
  listSellerSubmissionsByOwner: sqlite.prepare(`
    SELECT * FROM seller_submissions WHERE owner_id = ? ORDER BY created_at DESC LIMIT 200
  `),
  getSellerSubmission: sqlite.prepare('SELECT * FROM seller_submissions WHERE id = ?'),
  updateSellerSubmissionStatus: sqlite.prepare(`
    UPDATE seller_submissions
    SET status = ?, updated_at = ?
    WHERE id = ?
  `),
  insertFeedback: sqlite.prepare(`
    INSERT INTO feedback_entries
      (id, user_id, name, rating, comments, admin_response, is_published, created_at, updated_at)
    VALUES
      (@id, @userId, @name, @rating, @comments, '', 0, @createdAt, @updatedAt)
  `),
  listFeedback: sqlite.prepare(`
    SELECT * FROM feedback_entries ORDER BY created_at DESC LIMIT 500
  `),
  listPublishedFeedback: sqlite.prepare(`
    SELECT * FROM feedback_entries WHERE is_published = 1 ORDER BY created_at DESC LIMIT 100
  `),
  getFeedback: sqlite.prepare('SELECT * FROM feedback_entries WHERE id = ?'),
  updateFeedback: sqlite.prepare(`
    UPDATE feedback_entries
    SET admin_response = ?, is_published = ?, updated_at = ?
    WHERE id = ?
  `),
};

function analyticsRetentionCutoff() {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 13);
  return cutoff.toISOString();
}

statements.purgeExpiredEvents.run(analyticsRetentionCutoff());

function getMeta(key) {
  return statements.getMeta.get(key)?.value || '';
}

function setMeta(key, value) {
  statements.setMeta.run(key, value);
}

function getJsonMeta(key, fallback) {
  return parseJson(getMeta(key), fallback);
}

function setJsonMeta(key, value) {
  setMeta(key, stringifyJson(value));
}

const contentCollectionMetaKeys = {
  sights: 'content_sights',
  blogPosts: 'content_blog_posts',
};

function getContentCollection(name) {
  return getJsonMeta(contentCollectionMetaKeys[name], []);
}

function setContentCollection(name, items) {
  setJsonMeta(contentCollectionMetaKeys[name], items);
}

function createContentItem(name, item) {
  const items = getContentCollection(name);
  const now = nowIso();
  const entry = {
    ...item,
    id: asString(item?.id || '', 120) || crypto.randomUUID(),
    createdAt: item?.createdAt || now,
    updatedAt: now,
  };
  setContentCollection(name, [entry, ...items.filter((existing) => existing.id !== entry.id)]);
  return entry;
}

function updateContentItem(name, id, updates) {
  const items = getContentCollection(name);
  const index = items.findIndex((item) => String(item.id) === String(id));
  if (index === -1) {
    return null;
  }
  const next = {
    ...items[index],
    ...updates,
    id: items[index].id,
    updatedAt: nowIso(),
  };
  items[index] = next;
  setContentCollection(name, items);
  return next;
}

function deleteContentItem(name, id) {
  const items = getContentCollection(name);
  const next = items.filter((item) => String(item.id) !== String(id));
  setContentCollection(name, next);
  return next.length !== items.length;
}

function seedContentIfNeeded() {
  if (getMeta('content_seed_version') === '1') {
    return;
  }

  if (getContentCollection('blogPosts').length === 0) {
    const posts = readJsonFile(seedBlogPostsPath, []);
    if (Array.isArray(posts)) {
      setContentCollection('blogPosts', posts);
    }
  }

  if (getContentCollection('sights').length === 0) {
    const sights = readJsonFile(seedSightsPath, []);
    if (Array.isArray(sights)) {
      setContentCollection('sights', sights);
    }
  }

  setMeta('content_seed_version', '1');
}

function getNextTourId() {
  return Number(statements.maxTourId.get().id) + 1;
}

function normalizeTourForStorage(tour, explicitId) {
  if (!isObject(tour)) {
    throw new Error('Tour must be an object.');
  }

  const id = explicitId ?? asNumber(tour.id, getNextTourId());
  const title = asString(tour.title, 180);
  if (!title) {
    throw new Error('Tour title is required.');
  }

  const isActive = tour.is_active === false || tour.isActive === false ? 0 : 1;
  const storedTour = {
    ...tour,
    id,
    is_active: Boolean(isActive),
  };

  return {
    id,
    title,
    tourJson: stringifyJson(storedTour),
    isActive,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function upsertTour(tour, explicitId) {
  const row = normalizeTourForStorage(tour, explicitId);
  statements.upsertTour.run(row);
  return mapTourRow(statements.getTour.get(row.id));
}

function mapTourRow(row) {
  if (!row) {
    return null;
  }

  const tour = parseJson(row.tour_json, {});
  return {
    ...tour,
    id: Number(row.id),
    title: row.title,
    is_active: Boolean(row.is_active),
  };
}

function insertGuestRequest({ id, type, payload, sourceIp, status, createdAt, updatedAt }) {
  statements.insertGuestRequest.run({
    id: id || crypto.randomUUID(),
    type,
    payloadJson: stringifyJson(payload),
    sourceIp: asString(sourceIp || '', 120),
    status: asString(status || 'pending', 80) || 'pending',
    createdAt: createdAt || nowIso(),
    updatedAt: updatedAt || createdAt || nowIso(),
  });
}

function mapGuestRequestRow(row) {
  return {
    id: row.id,
    type: row.type,
    payload: parseJson(row.payload_json, {}),
    source_ip: row.source_ip || '',
    status: row.status,
    telegram_delivery_status: row.telegram_delivery_status || 'waiting',
    telegram_attempts: Number(row.telegram_attempts || 0),
    telegram_sent_at: row.telegram_sent_at || '',
    telegram_error: row.telegram_error || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeEmail(value) {
  return asString(value, 240).toLowerCase();
}

function mapUserRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSellerSubmissionRow(row) {
  if (!row) {
    return null;
  }
  return {
    ...parseJson(row.payload_json, {}),
    id: row.id,
    ownerId: row.owner_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFeedbackRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id || '',
    name: row.name,
    rating: Number(row.rating),
    comments: row.comments,
    adminResponse: row.admin_response || '',
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeSellerSubmissionPayload(payload) {
  if (!isObject(payload)) {
    throw new Error('Submission payload must be an object.');
  }
  const title = asString(payload.title, 180);
  const duration = asString(payload.duration, 100);
  const price = asString(payload.price, 100);
  if (!title || !duration || !price) {
    throw new Error('Title, duration, and price are required.');
  }
  return {
    title,
    duration,
    price,
    season: asString(payload.season, 120),
    tourType: asString(payload.tourType, 120),
    description: asString(payload.description, 5000),
    highlights: Array.isArray(payload.highlights)
      ? payload.highlights.slice(0, 30).map((item) => asString(item, 240)).filter(Boolean)
      : [],
    itinerary: Array.isArray(payload.itinerary)
      ? payload.itinerary.slice(0, 30).map((item) => asString(item, 1000)).filter(Boolean)
      : [],
    image: asString(payload.image, 500),
    contactName: asString(payload.contactName, 160),
    contactEmail: normalizeEmail(payload.contactEmail),
  };
}

function normalizeBlogPostPayload(payload, currentId = '') {
  if (!isObject(payload)) {
    throw new Error('Blog payload must be an object.');
  }
  const title = asString(payload.title, 180);
  const content = asString(payload.content, 50000);
  if (!title || !content) {
    throw new Error('Blog title and content are required.');
  }
  const slug = String(payload.slug || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  if (!slug) {
    throw new Error('A URL slug is required.');
  }
  const duplicate = getContentCollection('blogPosts').some(
    (post) => post.id !== currentId && post.slug === slug,
  );
  if (duplicate) {
    throw new Error('Another guide already uses this URL slug.');
  }
  const allowedStatuses = new Set(['draft', 'published', 'archived']);
  return {
    ...payload,
    title,
    slug,
    content,
    excerpt: asString(payload.excerpt, 600),
    category: asString(payload.category, 120),
    readTime: asString(payload.readTime, 80),
    status: allowedStatuses.has(payload.status) ? payload.status : 'draft',
    featured: Boolean(payload.featured),
    seoTitle: asString(payload.seoTitle, 180),
    seoDescription: asString(payload.seoDescription, 320),
  };
}

function buildUploadedImagePath(folder, fileName, contentType) {
  const safeFolder = sanitizeSlug(folder, 'general');
  const originalName = sanitizeSlug(path.parse(fileName || '').name, 'image');
  const extFromName = path.extname(fileName || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  const extFromType = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
  }[contentType];
  const extension = extFromType || extFromName || '.jpg';
  const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(extension)
    ? extension
    : '.jpg';
  const storedName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${originalName}${safeExtension}`;
  const directory = path.join(uploadsDir, safeFolder);
  const filePath = path.join(directory, storedName);
  const publicUrl = `${uploadsPublicPath}/${safeFolder}/${storedName}`;
  return { directory, filePath, publicUrl };
}

function uploadHeaderValue(value) {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function isHeifFileName(fileName) {
  return /\.(heic|heif)$/i.test(fileName || '');
}

function shouldParseImageUpload(req) {
  const contentType = uploadHeaderValue(req.headers['content-type'])
    .split(';')[0]
    .trim()
    .toLowerCase();
  const fileName = uploadHeaderValue(req.headers['x-file-name']);
  return (
    imageUploadContentTypes.has(contentType) ||
    (contentType === 'application/octet-stream' && isHeifFileName(fileName))
  );
}

async function convertHeifToJpeg(input) {
  const temporaryDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'go-kyrgyzstan-heif-'));
  const sourcePath = path.join(temporaryDirectory, 'source.heic');
  const outputPath = path.join(temporaryDirectory, 'converted.jpg');

  try {
    await fs.promises.writeFile(sourcePath, input, { mode: 0o600 });
    await execFile(heifConvertBinary, ['--quiet', '--quality', '86', sourcePath, outputPath], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    const convertedFiles = (await fs.promises.readdir(temporaryDirectory))
      .filter((fileName) => /^converted(?:-\d+)?\.jpe?g$/i.test(fileName))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    if (convertedFiles.length === 0) {
      throw new Error('The HEIC converter did not produce a JPEG file.');
    }

    return fs.promises.readFile(path.join(temporaryDirectory, convertedFiles[0]));
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown HEIC conversion error.';
    throw new Error(`Unable to convert this HEIC/HEIF image to JPG: ${details}`);
  } finally {
    await fs.promises.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function insertEvent({ id, source, eventName, event_name, path: eventPath, label, metadata, createdAt }) {
  const normalizedEventName = asString(eventName || event_name, 120);
  if (!normalizedEventName) {
    throw new Error('eventName is required.');
  }

  statements.insertEvent.run({
    id: id || crypto.randomUUID(),
    source: asString(source || 'web', 60) || 'web',
    eventName: normalizedEventName,
    path: asString(eventPath || '', 240),
    label: asString(label || '', 240),
    metadataJson: stringifyJson(isObject(metadata) ? metadata : {}),
    createdAt: createdAt || nowIso(),
  });
  statements.trimEvents.run();
  statements.purgeExpiredEvents.run(analyticsRetentionCutoff());
}

function buildEventSummary() {
  const totals = statements.eventTotals.all().reduce((acc, row) => {
    acc[row.event_name] = Number(row.count);
    return acc;
  }, {});

  return {
    totals,
    paths: statements.topEventPaths.all().map((event) => ({
      path: event.path || '',
      count: Number(event.count),
    })),
    interests: statements.topEventInterests.all().map((event) => ({
      label: event.label || '',
      count: Number(event.count),
    })),
    recent: statements.recentEvents.all().map((event) => ({
      source: event.source || 'web',
      event_name: event.event_name || 'unknown',
      path: event.path || '',
      label: event.label || '',
      created_at: event.created_at || '',
    })),
  };
}

function seedToursIfNeeded() {
  const count = Number(statements.countTours.get().count);
  if (count > 0) {
    return;
  }

  const seedTours = readJsonFile(seedToursPath, []);
  if (!Array.isArray(seedTours)) {
    throw new Error(`Expected ${seedToursPath} to contain an array.`);
  }

  const seed = sqlite.transaction((tours) => {
    for (const tour of tours) {
      upsertTour(tour);
    }
  });

  seed(seedTours);
}

function migrateLegacyJsonIfNeeded() {
  if (getMeta('legacy_json_migrated') === '1' || !fs.existsSync(legacyDataFilePath)) {
    return;
  }

  const legacy = readJsonFile(legacyDataFilePath, null);
  if (!isObject(legacy)) {
    setMeta('legacy_json_migrated', '1');
    return;
  }

  const migrate = sqlite.transaction(() => {
    if (Array.isArray(legacy.tours)) {
      for (const tour of legacy.tours) {
        upsertTour(tour);
      }
    }

    if (Array.isArray(legacy.guestRequests)) {
      for (const request of legacy.guestRequests) {
        if (!isObject(request)) {
          continue;
        }
        const type = request.type === 'custom_tour_request' ? 'custom_tour_request' : 'booking';
        insertGuestRequest({
          id: asString(request.id || '', 120) || crypto.randomUUID(),
          type,
          payload: isObject(request.payload) ? request.payload : request,
          sourceIp: request.source_ip,
          status: request.status,
          createdAt: request.created_at || request.createdAt || nowIso(),
          updatedAt: request.updated_at || request.updatedAt || request.created_at || nowIso(),
        });
      }
    }

    if (Array.isArray(legacy.events)) {
      for (const event of legacy.events) {
        if (!isObject(event)) {
          continue;
        }
        try {
          insertEvent({
            id: asString(event.id || '', 120) || crypto.randomUUID(),
            source: event.source,
            eventName: event.event_name || event.eventName,
            path: event.path,
            label: event.label,
            metadata: event.metadata,
            createdAt: event.created_at || event.createdAt || nowIso(),
          });
        } catch {
          // Skip malformed legacy analytics rows.
        }
      }
    }

    setMeta('legacy_json_migrated', '1');
  });

  migrate();
}

migrateLegacyJsonIfNeeded();
seedToursIfNeeded();
seedContentIfNeeded();

const apiPort = Number.parseInt(process.env.PORT || process.env.API_PORT || '4000', 10) || 4000;
const apiHost = (process.env.API_HOST || '127.0.0.1').trim();
const corsOrigin = process.env.CORS_ORIGIN || '*';
const publicSiteUrl = (process.env.PUBLIC_SITE_URL || 'https://kyrgyz.tours').replace(/\/+$/, '');
const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kyrgyz.tours').trim();
const adminPasswordHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
const adminPassword = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || '';
const jwtSecret = process.env.JWT_SECRET || '';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
const telegramBotToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const telegramWebhookSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
const telegramPollingEnabled = process.env.TELEGRAM_POLLING_ENABLED !== 'false';
const telegramEnvChatIds = (process.env.TELEGRAM_CHAT_IDS || '')
  .split(',')
  .map((chatId) => chatId.trim())
  .filter(Boolean);
const telegramAllowedUsernames = (process.env.TELEGRAM_ALLOWED_USERNAMES || '')
  .split(',')
  .map(normalizeTelegramUsername)
  .filter(Boolean);

if (!adminPasswordHash && !adminPassword) {
  throw new Error('Set ADMIN_PASSWORD_HASH (recommended) or ADMIN_PASSWORD in your backend environment.');
}

if (!jwtSecret) {
  throw new Error('Set JWT_SECRET in your backend environment before starting the backend.');
}

if (!adminPasswordHash && adminPassword) {
  console.warn('ADMIN_PASSWORD is being used. Prefer ADMIN_PASSWORD_HASH for production.');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function compactLine(label, value) {
  const text = Array.isArray(value) ? value.filter(Boolean).join(', ') : value;
  const clean = asString(String(text ?? ''), 500);
  return clean ? `<b>${escapeHtml(label)}:</b> ${escapeHtml(clean)}` : '';
}

function getTelegramActorUsername(message) {
  if (!isObject(message)) {
    return '';
  }

  const fromUsername = isObject(message.from) ? normalizeTelegramUsername(message.from.username) : '';
  const chatUsername = isObject(message.chat) ? normalizeTelegramUsername(message.chat.username) : '';
  return fromUsername || chatUsername;
}

function isTelegramMessageAllowed(message) {
  if (telegramAllowedUsernames.length === 0) {
    return true;
  }

  const username = getTelegramActorUsername(message);
  return Boolean(username && telegramAllowedUsernames.includes(username));
}

function getStoredTelegramChats() {
  const stored = parseJson(getMeta('telegram_chats'), []);
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .filter(isObject)
    .map((chat) => ({
      id: String(chat.id || '').trim(),
      username: normalizeTelegramUsername(chat.username),
      registeredAt: asString(chat.registeredAt || '', 80),
    }))
    .filter((chat) => chat.id);
}

function getStoredTelegramChatIds() {
  const storedChats = getStoredTelegramChats();
  if (storedChats.length > 0) {
    return storedChats
      .filter((chat) => (
        telegramAllowedUsernames.length === 0 ||
        (chat.username && telegramAllowedUsernames.includes(chat.username))
      ))
      .map((chat) => chat.id);
  }

  if (telegramAllowedUsernames.length > 0) {
    return [];
  }

  const stored = parseJson(getMeta('telegram_chat_ids'), []);
  return Array.isArray(stored) ? stored.map(String).filter(Boolean) : [];
}

function getTelegramChatIds(extraChatIds = []) {
  return [...new Set([...telegramEnvChatIds, ...getStoredTelegramChatIds(), ...extraChatIds.map(String)])]
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}

function rememberTelegramChat(message) {
  if (!isObject(message) || !isTelegramMessageAllowed(message) || !isObject(message.chat)) {
    return null;
  }

  const chat = message.chat;
  if (chat.id === undefined || chat.id === null) {
    return null;
  }

  const chatId = String(chat.id);
  const username = getTelegramActorUsername(message);
  const nextChats = [
    ...getStoredTelegramChats().filter((storedChat) => storedChat.id !== chatId),
    {
      id: chatId,
      username,
      registeredAt: nowIso(),
    },
  ];
  const nextChatIds = nextChats.map((storedChat) => storedChat.id);
  setMeta('telegram_chats', stringifyJson(nextChats));
  setMeta('telegram_chat_ids', stringifyJson(nextChatIds));
  return chatId;
}

async function callTelegramApi(method, body = {}) {
  if (!telegramBotToken) {
    return null;
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.ok === false) {
    const description = isObject(result) ? asString(result.description || '', 240) : '';
    throw new Error(`Telegram ${method} failed with ${response.status}: ${description}`);
  }

  return result;
}

function formatGuestRequestMessage({ id, type, payload, createdAt }) {
  const requestLabel = type === 'booking' ? 'Tour booking request' : 'Tour request';
  const lines = [
    `<b>Go Kyrgyzstan Travel</b>`,
    `<b>${escapeHtml(requestLabel)}</b>`,
    compactLine('Request ID', id),
    compactLine('Created', createdAt),
    compactLine('Name', payload.name),
    compactLine('Country of residence', payload.countryOfResidence),
    compactLine('Preferred contact', payload.contactPreference),
    compactLine('Telegram', payload.telegramUsername),
    compactLine('WhatsApp', payload.phone),
    compactLine('Email', payload.email),
    compactLine('Tour', payload.tourTitle || payload.tourId),
    compactLine('Participants', payload.participants || payload.groupSize),
    compactLine('Start date', payload.startDate),
    compactLine('End date', payload.endDate),
    compactLine('Date flexibility', payload.dateFlexibility),
    compactLine('Start location', payload.startLocation),
    compactLine('End location', payload.endLocation),
    compactLine('Sights', payload.sights),
    compactLine('Activities', payload.activities),
    compactLine('Budget', payload.budget),
    compactLine('Total price', payload.totalPrice),
    compactLine('Notes', payload.notes || payload.specialRequests),
  ].filter(Boolean);

  return lines.join('\n').slice(0, 3900);
}

async function sendTelegramMessage(chatId, text) {
  if (!telegramBotToken || !chatId || !text) {
    return false;
  }

  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  return true;
}

function updateTelegramDelivery(requestId, status, error = '') {
  const sentAt = status === 'sent' ? nowIso() : null;
  statements.updateGuestRequestTelegramDelivery.run(
    status,
    sentAt,
    asString(error, 500),
    requestId,
  );
}

async function sendRecentGuestRequestsToChat(chatId) {
  const rows = statements.listUndeliveredGuestRequests.all();
  if (rows.length === 0) {
    return;
  }

  await sendTelegramMessage(
    chatId,
    [
      '<b>Go Kyrgyzstan Travel</b>',
      `Sending ${rows.length} saved website request${rows.length === 1 ? '' : 's'} that still need Telegram delivery.`,
    ].join('\n')
  );

  for (const row of rows) {
    const request = mapGuestRequestRow(row);
    try {
      await sendTelegramMessage(
        chatId,
        formatGuestRequestMessage({
          id: request.id,
          type: request.type,
          payload: request.payload,
          createdAt: request.created_at,
        })
      );
      updateTelegramDelivery(request.id, 'sent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Telegram notification failed.';
      updateTelegramDelivery(request.id, 'failed', message);
      console.error(message);
    }
  }
}

async function sendTelegramToAll(text, extraChatIds = []) {
  if (telegramBotToken && getTelegramChatIds(extraChatIds).length === 0) {
    await refreshTelegramChatsFromUpdates();
  }

  const chatIds = getTelegramChatIds(extraChatIds);
  if (!telegramBotToken || chatIds.length === 0) {
    return { sent: 0, failed: 0, configured: Boolean(telegramBotToken), chatCount: chatIds.length };
  }

  const results = await Promise.allSettled(chatIds.map((chatId) => sendTelegramMessage(chatId, text)));
  const failed = results.filter((result) => result.status === 'rejected');
  const errors = failed.map((failure) => (
    failure.reason instanceof Error ? failure.reason.message : 'Telegram notification failed.'
  ));
  for (const failure of failed) {
    console.error(failure.reason instanceof Error ? failure.reason.message : 'Telegram notification failed.');
  }

  return {
    sent: results.length - failed.length,
    failed: failed.length,
    configured: true,
    chatCount: chatIds.length,
    errors,
  };
}

async function deliverGuestRequestTelegram(entry) {
  const message = formatGuestRequestMessage(entry);
  try {
    const result = await sendTelegramToAll(message);
    if (!result.configured) {
      updateTelegramDelivery(entry.id, 'disabled', 'Telegram bot token is not configured.');
      return result;
    }
    if (result.chatCount === 0) {
      updateTelegramDelivery(entry.id, 'waiting', 'No Telegram chat is registered yet.');
      console.warn('Telegram bot token is configured, but no Telegram chat is registered yet.');
      return result;
    }
    if (result.sent > 0) {
      updateTelegramDelivery(entry.id, 'sent', result.failed > 0 ? result.errors?.join('; ') : '');
      return result;
    }

    updateTelegramDelivery(entry.id, 'failed', result.errors?.join('; ') || 'Telegram delivery failed.');
    return result;
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Telegram notification failed.';
    updateTelegramDelivery(entry.id, 'failed', messageText);
    console.error(messageText);
    return { sent: 0, failed: 1, configured: Boolean(telegramBotToken), chatCount: 0 };
  }
}

function notifyGuestRequestTelegram(entry) {
  void deliverGuestRequestTelegram(entry);
}

let telegramPollRunning = false;

async function refreshTelegramChatsFromUpdates() {
  if (!telegramBotToken || telegramPollRunning) {
    return;
  }

  telegramPollRunning = true;
  try {
    const offset = Number(getMeta('telegram_update_offset') || '0') || undefined;
    const result = await callTelegramApi('getUpdates', {
      offset,
      timeout: 0,
      allowed_updates: ['message', 'channel_post'],
    });
    const updates = Array.isArray(result?.result) ? result.result : [];
    let nextOffset = offset || 0;

    for (const update of updates) {
      if (typeof update.update_id === 'number') {
        nextOffset = Math.max(nextOffset, update.update_id + 1);
      }

      const message = update.message || update.channel_post || {};
      const rawChatId = isObject(message.chat) && message.chat.id !== undefined && message.chat.id !== null
        ? String(message.chat.id)
        : '';
      const wasRegistered = rawChatId ? getTelegramChatIds().includes(rawChatId) : false;
      const chatId = rememberTelegramChat(message);
      const text = asString(message.text || '', 300);

      if (chatId && (text.startsWith('/start') || text.startsWith('/connect'))) {
        await sendTelegramToAll(
          [
            '<b>Go Kyrgyzstan Travel</b>',
            'Telegram notifications are connected for this chat.',
            'New website requests will be sent here.',
          ].join('\n'),
          [chatId]
        );
        if (!wasRegistered) {
          await sendRecentGuestRequestsToChat(chatId);
        }
      } else if (!chatId && isObject(message.chat) && (text.startsWith('/start') || text.startsWith('/connect'))) {
        await sendTelegramMessage(
          message.chat.id,
          [
            '<b>Go Kyrgyzstan Travel</b>',
            'This Telegram account is not allowed to receive website requests.',
          ].join('\n')
        );
      }
    }

    if (nextOffset) {
      setMeta('telegram_update_offset', String(nextOffset));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Telegram polling failed.');
  } finally {
    telegramPollRunning = false;
  }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(helmet());
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((item) => item.trim()) }));
app.use(express.json({ limit: '128kb' }));

function createRateLimiter({ windowMs, max, keyPrefix }) {
  const hits = new Map();
  let lastCleanupAt = 0;

  return (req, res, next) => {
    const currentTime = Date.now();
    if (currentTime - lastCleanupAt > windowMs) {
      for (const [key, value] of hits) {
        if (value.resetAt <= currentTime) {
          hits.delete(key);
        }
      }
      lastCleanupAt = currentTime;
    }

    const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const current = hits.get(key);
    const entry = !current || current.resetAt <= currentTime
      ? { count: 0, resetAt: currentTime + windowMs }
      : current;
    entry.count += 1;
    hits.set(key, entry);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000))));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    next();
  };
}

const guestRequestLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: 'guest-request',
});
const eventLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyPrefix: 'event',
});
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'admin-login',
});
const userAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: 'user-auth',
});
const feedbackLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: 'feedback',
});

function parseBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

function requireUser(req, res, next) {
  const token = parseBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Sign in is required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = isObject(payload) ? statements.getUserById.get(String(payload.sub || '')) : null;
    if (!user || payload.kind !== 'user') {
      res.status(401).json({ error: 'Invalid or expired user session.' });
      return;
    }
    req.user = mapUserRow(user);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired user session.' });
  }
}

function requireAdmin(req, res, next) {
  const token = parseBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing admin token.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (!isObject(payload) || payload.role !== 'admin') {
      res.status(401).json({ error: 'Invalid admin token.' });
      return;
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'go-kyrgyzstan-travel-api',
    timestamp: nowIso(),
  });
});

function createUserSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      kind: 'user',
      role: user.role,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );
}

app.post('/api/auth/signup', userAuthLimiter, async (req, res) => {
  const name = asString(req.body?.name || '', 160);
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const role = req.body?.role === 'seller' ? 'seller' : 'buyer';

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A valid name and email are required.' });
    return;
  }
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ error: 'Password must contain between 8 and 128 characters.' });
    return;
  }
  if (statements.getUserByEmail.get(email)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const createdAt = nowIso();
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  statements.createUser.run({
    id,
    name,
    email,
    passwordHash,
    role,
    createdAt,
    updatedAt: createdAt,
  });
  const user = mapUserRow(statements.getUserById.get(id));
  res.status(201).json({ token: createUserSessionToken(user), user });
});

app.post('/api/auth/login', userAuthLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const row = statements.getUserByEmail.get(email);
  if (!row || !password || !(await bcrypt.compare(password, row.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  const user = mapUserRow(row);
  res.json({ token: createUserSessionToken(user), user });
});

app.get('/api/auth/me', requireUser, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/auth/profile', requireUser, (req, res) => {
  const name = asString(req.body?.name || req.user.name, 160);
  const role = req.body?.role === 'seller' ? 'seller' : 'buyer';
  if (!name) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }
  statements.updateUserProfile.run(name, role, nowIso(), req.user.id);
  const user = mapUserRow(statements.getUserById.get(req.user.id));
  res.json({ token: createUserSessionToken(user), user });
});

app.get('/api/user/bookings', requireUser, (req, res) => {
  const bookings = statements.listGuestRequests
    .all()
    .map(mapGuestRequestRow)
    .filter((request) => request.type === 'booking' && request.payload?.userId === req.user.id);
  res.json({ bookings });
});

app.get('/api/seller-submissions', requireUser, (req, res) => {
  res.json({
    submissions: statements.listSellerSubmissionsByOwner
      .all(req.user.id)
      .map(mapSellerSubmissionRow),
  });
});

app.post('/api/seller-submissions', requireUser, (req, res) => {
  try {
    const payload = normalizeSellerSubmissionPayload(req.body);
    const id = crypto.randomUUID();
    const createdAt = nowIso();
    statements.insertSellerSubmission.run({
      id,
      ownerId: req.user.id,
      payloadJson: stringifyJson(payload),
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    });
    res.status(201).json({ submission: mapSellerSubmissionRow(statements.getSellerSubmission.get(id)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save submission.';
    res.status(400).json({ error: message });
  }
});

app.get('/api/feedback', (_req, res) => {
  res.json({ feedback: statements.listPublishedFeedback.all().map(mapFeedbackRow) });
});

app.post('/api/feedback', feedbackLimiter, (req, res) => {
  const name = asString(req.body?.name || '', 160);
  const comments = asString(req.body?.comments || '', 3000);
  const rating = Math.min(5, Math.max(1, Math.trunc(asNumber(req.body?.rating, 0))));
  if (!name || !comments || !rating) {
    res.status(400).json({ error: 'Name, rating, and comments are required.' });
    return;
  }
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  statements.insertFeedback.run({
    id,
    userId: null,
    name,
    rating,
    comments,
    createdAt,
    updatedAt: createdAt,
  });
  res.status(201).json({ feedback: mapFeedbackRow(statements.getFeedback.get(id)) });
});

app.get('/api/tours', (_req, res) => {
  res.json({ tours: statements.listTours.all().map(mapTourRow).filter(Boolean) });
});

app.get('/api/tours/:id', (req, res) => {
  const tour = mapTourRow(statements.getTour.get(Number(req.params.id)));
  if (!tour || tour.is_active === false) {
    res.status(404).json({ error: 'Tour not found.' });
    return;
  }
  res.json({ tour });
});

app.get('/internal/legacy-tour-redirect', (req, res) => {
  const tourId = Math.trunc(asNumber(req.query.id, 0));
  const tour = mapTourRow(statements.getTour.get(tourId));
  const locale = asString(req.query.locale, 8).startsWith('ru') ? 'ru' : 'en';
  const destination = tour ? publicTourPath(tour, locale) : null;

  if (!destination) {
    res.status(404).end();
    return;
  }

  res.set('Cache-Control', 'public, max-age=86400').redirect(301, destination);
});

app.get('/api/sights', (_req, res) => {
  res.json({ sights: getContentCollection('sights') });
});

app.get('/api/blog-posts', (_req, res) => {
  const posts = getContentCollection('blogPosts')
    .filter((post) => post.status !== 'draft' && post.status !== 'archived')
    .sort((a, b) => String(b.publishedAt || b.createdAt || '').localeCompare(String(a.publishedAt || a.createdAt || '')));
  res.json({ posts });
});

app.get('/api/sitemap.xml', (_req, res) => {
  const galleryImages = readJsonFile(galleryImagesPath, [])
    .filter((image) => typeof image === 'string' && image.startsWith('/'));
  const destinationRoutes = readJsonFile(destinationsPath, [])
    .filter((destination) => isObject(destination) && /^[a-z0-9][a-z0-9-]*$/.test(asString(destination.slug, 120)))
    .flatMap((destination) => {
      const slug = asString(destination.slug, 120);
      const heroImage = asString(destination.heroImage, 500);
      const optimizedHeroImage = heroImage.replace(/\.(jpe?g)$/i, '-960.webp');
      const images = optimizedHeroImage.startsWith('/') ? [optimizedHeroImage] : [];
      return [
        { path: `/destinations/${slug}`, priority: '0.8', changefreq: 'monthly', images },
        { path: `/ru/destinations/${slug}`, priority: '0.7', changefreq: 'monthly', images },
      ];
    });
  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/tours', priority: '0.9', changefreq: 'weekly' },
    { path: '/join-tour', priority: '0.8', changefreq: 'monthly' },
    { path: '/gallery', priority: '0.7', changefreq: 'monthly', images: galleryImages },
    { path: '/blogs', priority: '0.8', changefreq: 'weekly' },
    { path: '/feedback', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms-of-use', priority: '0.3', changefreq: 'yearly' },
    { path: '/ru', priority: '0.9', changefreq: 'weekly' },
    { path: '/ru/tours', priority: '0.8', changefreq: 'weekly' },
    { path: '/ru/feedback', priority: '0.6', changefreq: 'monthly' },
    { path: '/ru/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/ru/terms-of-use', priority: '0.3', changefreq: 'yearly' },
  ];
  const tourRoutes = statements.listTours
    .all()
    .map(mapTourRow)
    .filter(Boolean)
    .map((tour) => {
      const path = publicTourPath(tour);
      return path ? {
      path,
      priority: '0.8',
      changefreq: 'monthly',
      images: tour.image ? [tour.image] : [],
      } : null;
    })
    .filter(Boolean);
  const russianTourRoutes = statements.listTours
    .all()
    .map(mapTourRow)
    .filter(Boolean)
    .map((tour) => {
      const path = publicTourPath(tour, 'ru');
      return path ? {
      path,
      priority: '0.7',
      changefreq: 'monthly',
      images: tour.image ? [tour.image] : [],
      } : null;
    })
    .filter(Boolean);
  const blogRoutes = getContentCollection('blogPosts')
    .filter((post) => post.status !== 'draft' && post.status !== 'archived')
    .map((post) => ({
      path: `/blogs/${encodeURIComponent(asString(post.slug || post.id, 180))}`,
      priority: post.featured ? '0.8' : '0.7',
      changefreq: 'monthly',
      lastmod: asString(post.updatedAt || post.publishedAt || post.createdAt, 40).slice(0, 10),
    }))
    .filter((route) => !route.path.endsWith('/'));
  const routes = [...staticRoutes, ...destinationRoutes, ...tourRoutes, ...russianTourRoutes, ...blogRoutes];
  const localizedRouteAlternates = (routePath) => {
    const englishPath = routePath === '/ru'
      ? '/'
      : routePath.startsWith('/ru/')
        ? routePath.slice(3)
        : routePath;
    const supportsRussian =
      englishPath === '/' ||
      englishPath === '/tours' ||
      englishPath === '/feedback' ||
      englishPath === '/privacy-policy' ||
      englishPath === '/terms-of-use' ||
      /^\/tours\/[a-z0-9][a-z0-9-]*$/.test(englishPath) ||
      /^\/destinations\/[a-z0-9-]+$/.test(englishPath);
    if (!supportsRussian) {
      return '';
    }
    const russianPath = englishPath === '/' ? '/ru' : `/ru${englishPath}`;
    return [
      `<xhtml:link rel="alternate" hreflang="en" href="${escapeHtml(`${publicSiteUrl}${englishPath}`)}" />`,
      `<xhtml:link rel="alternate" hreflang="ru" href="${escapeHtml(`${publicSiteUrl}${russianPath}`)}" />`,
      `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeHtml(`${publicSiteUrl}${englishPath}`)}" />`,
    ].join('');
  };
  const urls = routes
    .map((route) => {
      const lastmod = route.lastmod ? `<lastmod>${escapeHtml(route.lastmod)}</lastmod>` : '';
      const alternates = localizedRouteAlternates(route.path);
      const images = (route.images || [])
        .map((image) => `<image:image><image:loc>${escapeHtml(`${publicSiteUrl}${image}`)}</image:loc></image:image>`)
        .join('');
      return [
        '<url>',
        `<loc>${escapeHtml(`${publicSiteUrl}${route.path}`)}</loc>`,
        lastmod,
        alternates,
        images,
        `<changefreq>${route.changefreq}</changefreq>`,
        `<priority>${route.priority}</priority>`,
        '</url>',
      ].join('');
    })
    .join('');

  res
    .type('application/xml')
    .set('Cache-Control', 'public, max-age=300')
    .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
});

app.get('/api/content-settings', (_req, res) => {
  res.json({ settings: getJsonMeta('content_settings', {}) });
});

app.post('/api/guest-requests', guestRequestLimiter, (req, res) => {
  const { type, payload } = req.body || {};
  if (type !== 'booking' && type !== 'custom_tour_request') {
    res.status(400).json({ error: 'type must be "booking" or "custom_tour_request".' });
    return;
  }
  if (!isObject(payload)) {
    res.status(400).json({ error: 'payload must be an object.' });
    return;
  }
  if (JSON.stringify(payload).length > 20000) {
    res.status(413).json({ error: 'Request payload is too large.' });
    return;
  }

  let normalizedPayload;
  try {
    normalizedPayload = normalizeGuestRequestPayload(type, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload.';
    res.status(400).json({ error: message });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = nowIso();
  insertGuestRequest({
    id,
    type,
    payload: normalizedPayload,
    sourceIp: req.ip,
    status: 'pending',
    createdAt,
  });
  notifyGuestRequestTelegram({ id, type, payload: normalizedPayload, createdAt });

  res.status(201).json({ id, status: 'saved' });
});

app.post('/api/events', eventLimiter, (req, res) => {
  if (!isObject(req.body)) {
    res.status(400).json({ error: 'Event payload must be an object.' });
    return;
  }

  try {
    insertEvent({
      source: req.body.source,
      eventName: req.body.eventName || req.body.event_name,
      path: req.body.path,
      label: req.body.label,
      metadata: req.body.metadata,
      createdAt: nowIso(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid event payload.';
    res.status(400).json({ error: message });
    return;
  }

  res.status(201).json({ status: 'saved' });
});

app.post('/api/admin/login', adminLoginLimiter, async (req, res) => {
  const username = asString(req.body?.username || '', 120).toLowerCase();
  const password = String(req.body?.password || '');

  const usernameAllowed =
    username === adminUsername.toLowerCase() || username === adminEmail.toLowerCase();

  if (!usernameAllowed || !password) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const validPassword = adminPasswordHash
    ? await bcrypt.compare(password, adminPasswordHash)
    : password === adminPassword;

  if (!validPassword) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = jwt.sign(
    {
      sub: 'admin',
      role: 'admin',
      username: adminUsername,
      email: adminEmail,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );

  res.json({
    token,
    user: {
      username: adminUsername,
      email: adminEmail,
      role: 'admin',
    },
  });
});

app.get('/api/admin/me', requireAdmin, (_req, res) => {
  res.json({
    user: {
      username: adminUsername,
      email: adminEmail,
      role: 'admin',
    },
  });
});

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  res.json({ users: statements.listUsers.all().map(mapUserRow) });
});

app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
  const role = req.body?.role;
  if (role !== 'buyer' && role !== 'seller') {
    res.status(400).json({ error: 'Role must be buyer or seller.' });
    return;
  }
  const result = statements.updateUserRole.run(role, nowIso(), req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: mapUserRow(statements.getUserById.get(req.params.id)) });
});

app.get('/api/admin/seller-submissions', requireAdmin, (_req, res) => {
  res.json({
    submissions: statements.listSellerSubmissions.all().map(mapSellerSubmissionRow),
  });
});

app.patch('/api/admin/seller-submissions/:id', requireAdmin, (req, res) => {
  const status = asString(req.body?.status || '', 80);
  const allowedStatuses = new Set(['pending', 'approved', 'rejected', 'completed']);
  if (!allowedStatuses.has(status)) {
    res.status(400).json({ error: 'Invalid submission status.' });
    return;
  }
  const result = statements.updateSellerSubmissionStatus.run(status, nowIso(), req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Submission not found.' });
    return;
  }
  res.json({ submission: mapSellerSubmissionRow(statements.getSellerSubmission.get(req.params.id)) });
});

app.get('/api/admin/feedback', requireAdmin, (_req, res) => {
  res.json({ feedback: statements.listFeedback.all().map(mapFeedbackRow) });
});

app.patch('/api/admin/feedback/:id', requireAdmin, (req, res) => {
  const existing = mapFeedbackRow(statements.getFeedback.get(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Feedback not found.' });
    return;
  }
  const adminResponse = asString(req.body?.adminResponse ?? existing.adminResponse, 3000);
  const isPublished = req.body?.isPublished === undefined
    ? existing.isPublished
    : Boolean(req.body.isPublished);
  statements.updateFeedback.run(adminResponse, isPublished ? 1 : 0, nowIso(), req.params.id);
  res.json({ feedback: mapFeedbackRow(statements.getFeedback.get(req.params.id)) });
});

app.get('/api/admin/tours', requireAdmin, (_req, res) => {
  res.json({ tours: statements.listAdminTours.all().map(mapTourRow).filter(Boolean) });
});

app.post('/api/admin/tours', requireAdmin, (req, res) => {
  try {
    const tour = upsertTour(req.body);
    res.status(201).json({ tour });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create tour.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/tours/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = mapTourRow(statements.getTour.get(id));
  if (!existing) {
    res.status(404).json({ error: 'Tour not found.' });
    return;
  }

  try {
    const tour = upsertTour({ ...existing, ...req.body, id }, id);
    res.json({ tour });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update tour.';
    res.status(400).json({ error: message });
  }
});

app.delete('/api/admin/tours/:id', requireAdmin, (req, res) => {
  const result = statements.deleteTour.run(nowIso(), Number(req.params.id));
  if (result.changes === 0) {
    res.status(404).json({ error: 'Tour not found.' });
    return;
  }
  res.json({ status: 'deleted' });
});

app.get('/api/admin/sights', requireAdmin, (_req, res) => {
  res.json({ sights: getContentCollection('sights') });
});

app.post('/api/admin/sights', requireAdmin, (req, res) => {
  if (!isObject(req.body) || !asString(req.body.name || '', 160)) {
    res.status(400).json({ error: 'Sight name is required.' });
    return;
  }
  res.status(201).json({ sight: createContentItem('sights', req.body) });
});

app.put('/api/admin/sights/:id', requireAdmin, (req, res) => {
  if (!isObject(req.body)) {
    res.status(400).json({ error: 'Sight payload must be an object.' });
    return;
  }
  const sight = updateContentItem('sights', req.params.id, req.body);
  if (!sight) {
    res.status(404).json({ error: 'Sight not found.' });
    return;
  }
  res.json({ sight });
});

app.delete('/api/admin/sights/:id', requireAdmin, (req, res) => {
  if (!deleteContentItem('sights', req.params.id)) {
    res.status(404).json({ error: 'Sight not found.' });
    return;
  }
  res.json({ status: 'deleted' });
});

app.get('/api/admin/blog-posts', requireAdmin, (_req, res) => {
  res.json({ posts: getContentCollection('blogPosts') });
});

app.post('/api/admin/blog-posts', requireAdmin, (req, res) => {
  try {
    res.status(201).json({ post: createContentItem('blogPosts', normalizeBlogPostPayload(req.body)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create blog post.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/blog-posts/:id', requireAdmin, (req, res) => {
  try {
    const post = updateContentItem(
      'blogPosts',
      req.params.id,
      normalizeBlogPostPayload(req.body, req.params.id),
    );
    if (!post) {
      res.status(404).json({ error: 'Blog post not found.' });
      return;
    }
    res.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update blog post.';
    res.status(400).json({ error: message });
  }
});

app.delete('/api/admin/blog-posts/:id', requireAdmin, (req, res) => {
  if (!deleteContentItem('blogPosts', req.params.id)) {
    res.status(404).json({ error: 'Blog post not found.' });
    return;
  }
  res.json({ status: 'deleted' });
});

app.put('/api/admin/content-settings', requireAdmin, (req, res) => {
  if (!isObject(req.body)) {
    res.status(400).json({ error: 'Content settings payload must be an object.' });
    return;
  }
  setJsonMeta('content_settings', req.body);
  res.json({ settings: req.body });
});

app.post(
  '/api/admin/uploads/:folder',
  requireAdmin,
  express.raw({
    type: shouldParseImageUpload,
    limit: '16mb',
  }),
  async (req, res) => {
    const contentType = uploadHeaderValue(req.headers['content-type'])
      .split(';')[0]
      .trim()
      .toLowerCase();
    const fileName = asString(uploadHeaderValue(req.headers['x-file-name']) || 'image', 180);
    const isHeif = heifUploadContentTypes.has(contentType) || isHeifFileName(fileName);
    if (!imageUploadContentTypes.has(contentType) && !(contentType === 'application/octet-stream' && isHeif)) {
      res.status(400).json({ error: 'Only image uploads are supported.' });
      return;
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: 'Upload body is empty.' });
      return;
    }

    try {
      const output = isHeif ? await convertHeifToJpeg(req.body) : req.body;
      const outputContentType = isHeif ? 'image/jpeg' : contentType;
      const upload = buildUploadedImagePath(req.params.folder, fileName, outputContentType);
      fs.mkdirSync(upload.directory, { recursive: true });
      fs.writeFileSync(upload.filePath, output, { mode: 0o640 });
      res.status(201).json({
        url: upload.publicUrl,
        size: output.length,
        contentType: outputContentType,
        convertedFrom: isHeif ? contentType || 'HEIC/HEIF' : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process image upload.';
      res.status(422).json({ error: message });
    }
  }
);

app.get('/api/admin/guest-requests', requireAdmin, (_req, res) => {
  res.json({ requests: statements.listGuestRequests.all().map(mapGuestRequestRow) });
});

app.patch('/api/admin/guest-requests/:id', requireAdmin, (req, res) => {
  const status = asString(req.body?.status || '', 80);
  const allowedStatuses = new Set(['pending', 'contacted', 'approved', 'completed', 'cancelled', 'rejected']);
  if (!allowedStatuses.has(status)) {
    res.status(400).json({ error: 'Invalid request status.' });
    return;
  }

  const result = statements.updateGuestRequestStatus.run(status, nowIso(), req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Request not found.' });
    return;
  }

  res.json({ request: mapGuestRequestRow(statements.getGuestRequest.get(req.params.id)) });
});

app.get('/api/admin/events', requireAdmin, (_req, res) => {
  res.json(buildEventSummary());
});

app.get('/api/admin/telegram/status', requireAdmin, (_req, res) => {
  res.json({
    configured: Boolean(telegramBotToken),
    registeredChatCount: getTelegramChatIds().length,
    allowedUsernameCount: telegramAllowedUsernames.length,
    webhookConfigured: Boolean(telegramWebhookSecret),
    pollingEnabled: telegramPollingEnabled,
    undeliveredRequestCount: Number(statements.countUndeliveredGuestRequests.get().count),
  });
});

app.post('/api/admin/telegram/test', requireAdmin, async (_req, res) => {
  const result = await sendTelegramToAll(
    [
      '<b>Go Kyrgyzstan Travel</b>',
      'Telegram notifications are connected.',
      compactLine('Time', nowIso()),
    ].join('\n')
  );
  res.json(result);
});

app.post('/api/admin/telegram/retry', requireAdmin, async (_req, res) => {
  const chatIds = getTelegramChatIds();
  if (chatIds.length === 0) {
    res.status(409).json({ error: 'No Telegram chat is registered.' });
    return;
  }

  for (const chatId of chatIds) {
    await sendRecentGuestRequestsToChat(chatId);
  }

  res.json({
    status: 'completed',
    undeliveredRequestCount: Number(statements.countUndeliveredGuestRequests.get().count),
  });
});

app.post('/api/telegram/webhook/:secret', async (req, res) => {
  if (!telegramBotToken || !telegramWebhookSecret || req.params.secret !== telegramWebhookSecret) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }

  const update = req.body || {};
  const message =
    update.message ||
    update.edited_message ||
    update.channel_post ||
    update.edited_channel_post ||
    {};
  const rawChatId = isObject(message.chat) && message.chat.id !== undefined && message.chat.id !== null
    ? String(message.chat.id)
    : '';
  const wasRegistered = rawChatId ? getTelegramChatIds().includes(rawChatId) : false;
  const chatId = rememberTelegramChat(message);
  const text = asString(message.text || '', 300);

  if (chatId && (text.startsWith('/start') || text.startsWith('/connect'))) {
    await sendTelegramToAll(
      [
        '<b>Go Kyrgyzstan Travel</b>',
        'Telegram notifications are connected for this chat.',
        'New website requests will be sent here.',
      ].join('\n'),
      [chatId]
    );
    if (!wasRegistered) {
      await sendRecentGuestRequestsToChat(chatId);
    }
  } else if (!chatId && isObject(message.chat) && (text.startsWith('/start') || text.startsWith('/connect'))) {
    await sendTelegramMessage(
      message.chat.id,
      [
        '<b>Go Kyrgyzstan Travel</b>',
        'This Telegram account is not allowed to receive website requests.',
      ].join('\n')
    );
  }

  res.json({ ok: true });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request payload is too large.' });
    return;
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  res.status(500).json({ error: message });
});

app.listen(apiPort, apiHost, () => {
  console.log(`Go Kyrgyzstan Travel backend is running on http://${apiHost}:${apiPort}`);
  console.log(`SQLite database: ${databasePath}`);
  if (telegramBotToken && telegramPollingEnabled) {
    refreshTelegramChatsFromUpdates();
    setInterval(refreshTelegramChatsFromUpdates, 10000).unref();
  }
});

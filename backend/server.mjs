import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
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
const repoRoot = path.resolve(backendDir, '..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(backendDir, '.env') });

const seedToursPath = path.join(repoRoot, 'data', 'seed_tours.json');
const legacyDataFilePath = path.resolve(repoRoot, process.env.DATA_FILE_PATH || 'backend/data/app-data.json');
const databasePath = path.resolve(repoRoot, process.env.DATABASE_PATH || 'backend/data/go-kyrgyzstan-travel.sqlite');
const uploadsDir = path.resolve(repoRoot, process.env.UPLOADS_DIR || 'public/uploads');
const uploadsPublicPath = `/${(process.env.UPLOADS_PUBLIC_PATH || '/uploads').replace(/^\/+|\/+$/g, '')}`;

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

  CREATE INDEX IF NOT EXISTS idx_tours_active ON tours(is_active);
  CREATE INDEX IF NOT EXISTS idx_guest_requests_created ON guest_requests(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_guest_requests_status ON guest_requests(status);
  CREATE INDEX IF NOT EXISTS idx_site_events_created ON site_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_site_events_name ON site_events(event_name);
`);

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
  getGuestRequest: sqlite.prepare('SELECT * FROM guest_requests WHERE id = ?'),
  updateGuestRequestStatus: sqlite.prepare(`
    UPDATE guest_requests
    SET status = ?, updated_at = ?
    WHERE id = ?
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
};

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
    created_at: row.created_at,
    updated_at: row.updated_at,
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
}

function buildEventSummary() {
  const totals = statements.eventTotals.all().reduce((acc, row) => {
    acc[row.event_name] = Number(row.count);
    return acc;
  }, {});

  return {
    totals,
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

const apiPort = Number.parseInt(process.env.PORT || process.env.API_PORT || '4000', 10) || 4000;
const corsOrigin = process.env.CORS_ORIGIN || '*';
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
    compactLine('Telegram', payload.telegramUsername),
    compactLine('Phone', payload.phone),
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

async function sendRecentGuestRequestsToChat(chatId, limit = 10) {
  const rows = statements.listGuestRequests.all().slice(0, limit).reverse();
  if (rows.length === 0) {
    return;
  }

  await sendTelegramMessage(
    chatId,
    [
      '<b>Go Kyrgyzstan Travel</b>',
      `Sending the latest ${rows.length} saved website request${rows.length === 1 ? '' : 's'}.`,
    ].join('\n')
  );

  for (const row of rows) {
    const request = mapGuestRequestRow(row);
    await sendTelegramMessage(
      chatId,
      formatGuestRequestMessage({
        id: request.id,
        type: request.type,
        payload: request.payload,
        createdAt: request.created_at,
      })
    );
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
  for (const failure of failed) {
    console.error(failure.reason instanceof Error ? failure.reason.message : 'Telegram notification failed.');
  }

  return {
    sent: results.length - failed.length,
    failed: failed.length,
    configured: true,
    chatCount: chatIds.length,
  };
}

function notifyGuestRequestTelegram(entry) {
  const message = formatGuestRequestMessage(entry);
  sendTelegramToAll(message).then((result) => {
    if (result.configured && result.chatCount === 0) {
      console.warn('Telegram bot token is configured, but no Telegram chat is registered yet.');
    }
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : 'Telegram notification failed.');
  });
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
app.use(helmet());
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((item) => item.trim()) }));
app.use(express.json({ limit: '1mb' }));

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
    database: path.relative(repoRoot, databasePath).replace(/\\/g, '/'),
    timestamp: nowIso(),
  });
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

app.get('/api/sights', (_req, res) => {
  res.json({ sights: getContentCollection('sights') });
});

app.get('/api/blog-posts', (_req, res) => {
  res.json({ posts: getContentCollection('blogPosts') });
});

app.get('/api/content-settings', (_req, res) => {
  res.json({ settings: getJsonMeta('content_settings', {}) });
});

app.post('/api/guest-requests', (req, res) => {
  const { type, payload } = req.body || {};
  if (type !== 'booking' && type !== 'custom_tour_request') {
    res.status(400).json({ error: 'type must be "booking" or "custom_tour_request".' });
    return;
  }
  if (!isObject(payload)) {
    res.status(400).json({ error: 'payload must be an object.' });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = nowIso();
  insertGuestRequest({
    id,
    type,
    payload,
    sourceIp: req.ip,
    status: 'pending',
    createdAt,
  });
  notifyGuestRequestTelegram({ id, type, payload, createdAt });

  res.status(201).json({ id, status: 'saved' });
});

app.post('/api/events', (req, res) => {
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

app.get('/api/events', (_req, res) => {
  res.json(buildEventSummary());
});

app.post('/api/admin/login', async (req, res) => {
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

app.post('/api/admin/blog-posts', requireAdmin, (req, res) => {
  if (!isObject(req.body) || !asString(req.body.title || '', 180)) {
    res.status(400).json({ error: 'Blog title is required.' });
    return;
  }
  res.status(201).json({ post: createContentItem('blogPosts', req.body) });
});

app.put('/api/admin/blog-posts/:id', requireAdmin, (req, res) => {
  if (!isObject(req.body)) {
    res.status(400).json({ error: 'Blog payload must be an object.' });
    return;
  }
  const post = updateContentItem('blogPosts', req.params.id, req.body);
  if (!post) {
    res.status(404).json({ error: 'Blog post not found.' });
    return;
  }
  res.json({ post });
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
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    limit: '12mb',
  }),
  (req, res) => {
    const contentType = asString(req.headers['content-type'] || '', 80).split(';')[0].toLowerCase();
    if (!contentType.startsWith('image/')) {
      res.status(400).json({ error: 'Only image uploads are supported.' });
      return;
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: 'Upload body is empty.' });
      return;
    }

    const fileName = asString(req.headers['x-file-name'] || 'image', 180);
    const upload = buildUploadedImagePath(req.params.folder, fileName, contentType);
    fs.mkdirSync(upload.directory, { recursive: true });
    fs.writeFileSync(upload.filePath, req.body);
    res.status(201).json({
      url: upload.publicUrl,
      size: req.body.length,
      contentType,
    });
  }
);

app.get('/api/admin/guest-requests', requireAdmin, (_req, res) => {
  res.json({ requests: statements.listGuestRequests.all().map(mapGuestRequestRow) });
});

app.patch('/api/admin/guest-requests/:id', requireAdmin, (req, res) => {
  const status = asString(req.body?.status || '', 80);
  if (!status) {
    res.status(400).json({ error: 'status is required.' });
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
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  res.status(500).json({ error: message });
});

app.listen(apiPort, () => {
  console.log(`Go Kyrgyzstan Travel backend is running on http://localhost:${apiPort}`);
  console.log(`SQLite database: ${databasePath}`);
  if (telegramBotToken && telegramPollingEnabled) {
    refreshTelegramChatsFromUpdates();
    setInterval(refreshTelegramChatsFromUpdates, 10000).unref();
  }
});

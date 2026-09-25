import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptsDir, '..');
const repoRoot = path.resolve(backendDir, '..');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gkt-analytics-test-'));
const databasePath = path.join(temporaryRoot, 'analytics.sqlite');

function isoDaysAgo(days, seconds = 0) {
  return new Date(Date.now() - days * 86400000 - seconds * 1000).toISOString();
}

function seedLegacyEvents() {
  const database = new Database(databasePath);
  database.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE site_events (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'web',
      event_name TEXT NOT NULL,
      path TEXT,
      label TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
  const insert = database.prepare(`
    INSERT INTO site_events (id, source, event_name, path, label, metadata_json, created_at)
    VALUES (?, 'web', ?, ?, ?, ?, ?)
  `);
  const seed = database.transaction(() => {
    for (let index = 0; index < 510; index += 1) {
      insert.run(`page-${index}`, 'page_view', '/tours/', '/tours/', '{}', isoDaysAgo(0, index));
    }
    insert.run('old-page', 'page_view', '/old/', '/old/', '{}', isoDaysAgo(8));
    insert.run('ancient-page', 'page_view', '/ancient/', '/ancient/', '{}', isoDaysAgo(430));
    insert.run('click', 'tour_card_view_click', '/tours/', 'Song-Kul Horse Tour', '{}', isoDaysAgo(0, 600));
    insert.run('unknown', 'attacker_custom_event', '/x', 'Untrusted', '{}', isoDaysAgo(0, 610));
    const discardedPadding = JSON.stringify({ padding: 'x'.repeat(4096) });
    for (let index = 0; index < 300; index += 1) {
      insert.run(
        `ancient-padding-${index}`,
        'page_view',
        '/ancient/',
        '/ancient/',
        discardedPadding,
        isoDaysAgo(430, index)
      );
    }
  });
  seed();
  database.close();
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function startBackend(port) {
  const output = [];
  const child = spawn(process.execPath, [path.join(backendDir, 'server.mjs')], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_PATH: databasePath,
      PORT: String(port),
      API_HOST: '127.0.0.1',
      ADMIN_USERNAME: 'analytics-test-admin',
      ADMIN_PASSWORD: 'analytics-test-password',
      ADMIN_PASSWORD_HASH: '',
      JWT_SECRET: 'analytics-test-secret-that-is-long-enough',
      TELEGRAM_BOT_TOKEN: '',
      TELEGRAM_POLLING_ENABLED: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  child.stdout.on('data', (chunk) => output.push(String(chunk)));
  child.stderr.on('data', (chunk) => output.push(String(chunk)));

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Backend exited before readiness:\n${output.join('')}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return { child, output };
    } catch {
      // Keep polling until the short startup deadline expires.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Backend did not become ready:\n${output.join('')}`);
}

async function stopBackend(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function postEvent(port, payload) {
  return fetch(`http://127.0.0.1:${port}/api/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function inspectDatabase() {
  const database = new Database(databasePath, { readonly: true });
  const inspection = {
    rawCount: database.prepare('SELECT COUNT(*) AS count FROM site_events').get().count,
    marker: database
      .prepare("SELECT value FROM meta WHERE key = 'site_event_daily_aggregates_v2'")
      .get()?.value,
    compactionMarker: database
      .prepare("SELECT value FROM meta WHERE key = 'site_event_storage_compacted_v1'")
      .get()?.value,
    pendingCount: database
      .prepare('SELECT COUNT(*) AS count FROM site_events WHERE analytics_aggregated_at IS NULL')
      .get().count,
    freePages: database.pragma('freelist_count', { simple: true }),
    totals: Object.fromEntries(
      database
        .prepare(`
          SELECT value, SUM(count) AS count
          FROM site_event_daily_aggregates
          WHERE dimension = 'event'
          GROUP BY value
        `)
        .all()
        .map((row) => [row.value, row.count])
    ),
    dimensions: database
      .prepare(`
        SELECT dimension, value, SUM(count) AS count
        FROM site_event_daily_aggregates
        GROUP BY dimension, value
        ORDER BY dimension, count DESC, value
      `)
      .all(),
    pagePaths: database
      .prepare(`
        SELECT value, SUM(count) AS count
        FROM site_event_daily_aggregates
        WHERE dimension = 'path'
        GROUP BY value
        ORDER BY count DESC
      `)
      .all(),
    newest: database
      .prepare(`
        SELECT source, event_name, path, label, metadata_json, analytics_aggregated_at
        FROM site_events
        ORDER BY created_at DESC, id DESC
        LIMIT 10
      `)
      .all(),
    rollbackEvent: database
      .prepare(`
        SELECT label, metadata_json, analytics_aggregated_at
        FROM site_events
        WHERE id = 'rollback-old-backend-event'
      `)
      .get(),
  };
  database.close();
  return inspection;
}

function insertEventLikeRolledBackBackend() {
  const database = new Database(databasePath);
  // This intentionally uses the old seven-column INSERT shape. The new marker
  // column receives its NULL default, even if the previous deployment rolled
  // back and its boolean migration marker already exists.
  database
    .prepare(`
      INSERT INTO site_events
        (id, source, event_name, path, label, metadata_json, created_at)
      VALUES
        (?, 'web', 'footer_whatsapp_click', '/', 'phone:+996 880 099 808',
         '{"email":"rollback@example.com"}', ?)
    `)
    .run('rollback-old-backend-event', isoDaysAgo(0));
  database.exec(`
    DELETE FROM site_events
    WHERE id NOT IN (
      SELECT id FROM site_events ORDER BY created_at DESC, id DESC LIMIT 5000
    )
  `);
  const pendingCount = database
    .prepare('SELECT COUNT(*) AS count FROM site_events WHERE analytics_aggregated_at IS NULL')
    .get().count;
  database.close();
  return pendingCount;
}

seedLegacyEvents();
let backend;

try {
  const port = await availablePort();
  backend = await startBackend(port);

  let response = await postEvent(port, {
    source: 'untrusted-source',
    eventName: 'page_view',
    path: '/tours/?secret=query',
    label: 'person@example.com',
    metadata: {
      sessionId: '123e4567-e89b-42d3-a456-426614174000',
      locale: 'en',
      device: 'mobile',
      landing: '/?utm_source=test',
      referrerHost: 'google.com',
      utmSource: 'google',
      utmMedium: 'organic',
      utmCampaign: 'summer-tours',
      email: 'must-not-be-stored@example.com',
      participants: '99',
    },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, {
    eventName: 'tour_card_view_click',
    path: '/tours',
    label: 'Song-Kul Horse Tour',
    metadata: {
      sessionId: '123e4567-e89b-42d3-a456-426614174000',
      destinationPath: '/tours/song-kul-horse-tour?ignored=1',
      destinationHost: 'evil.example',
      href: 'https://example.com/private?email=person@example.com',
    },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, {
    eventName: 'request_form_submit_success',
    path: '/feedback',
    label: 'Direct request form',
    metadata: {
      sessionId: '123e4567-e89b-42d3-a456-426614174000',
      landing: '/?utm_source=test',
      referrerHost: 'google.com',
      utmSource: 'google',
      utmMedium: 'organic',
      utmCampaign: 'summer-tours',
    },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, {
    eventName: 'page_view',
    path: '/person%40example.com?ignored=1',
    metadata: {
      sessionId: '123e4567-e89b-42d3-a456-426614174001',
      locale: 'en',
      device: 'desktop',
      landing: '/person%40example.com',
    },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, {
    eventName: 'tour_card_view_click',
    path: '/tours',
    label: 'phone:+996 880 099 808',
    metadata: { sessionId: '123e4567-e89b-42d3-a456-426614174002' },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, {
    eventName: 'tour_card_view_click',
    path: '/tours',
    label: 'Telegram:@example_traveller',
    metadata: { sessionId: '123e4567-e89b-42d3-a456-426614174003' },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, {
    eventName: 'page_view',
    path: '/contact',
    metadata: {
      sessionId: '123e4567-e89b-42d3-a456-426614174004',
      locale: 'en',
      device: 'desktop',
      landing: '/contact',
      referrerHost: '996880099808.example',
      utmSource: 'phone:+996880099808',
      utmCampaign: 'Telegram:@example_traveller',
    },
  });
  assert.equal(response.status, 201);

  response = await postEvent(port, { eventName: 'attacker_custom_event', path: '/x' });
  assert.equal(response.status, 400);

  const loginResponse = await fetch(`http://127.0.0.1:${port}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'analytics-test-admin', password: 'analytics-test-password' }),
  });
  assert.equal(loginResponse.status, 200);
  const { token } = await loginResponse.json();
  const summaryResponse = await fetch(`http://127.0.0.1:${port}/api/admin/events`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const summary = await summaryResponse.json();
  assert.equal(summaryResponse.status, 200);
  assert.equal(summary.storage.rawLimit, 500);
  assert.equal(summary.storage.rawRetentionDays, 7);
  assert.equal(summary.paths[0].path, '/tours');
  assert.ok(summary.sources.some((row) => row.source === 'google' && row.count === 1));
  assert.ok(summary.sources.some((row) => row.source === '(direct)' && row.count === 1));
  assert.deepEqual(summary.landings[0], { landing: '/', count: 1 });
  assert.deepEqual(summary.conversionSources[0], { source: 'google', count: 1 });
  assert.deepEqual(summary.conversionLandings[0], { landing: '/', count: 1 });

  await stopBackend(backend.child);
  backend = null;

  const firstInspection = inspectDatabase();
  assert.equal(firstInspection.rawCount, 500);
  assert.ok(firstInspection.marker);
  assert.ok(firstInspection.compactionMarker);
  assert.equal(firstInspection.pendingCount, 0);
  assert.equal(firstInspection.freePages, 0);
  assert.equal(firstInspection.totals.page_view, 514);
  assert.equal(firstInspection.totals.tour_card_view_click, 4);
  assert.equal(firstInspection.totals.request_form_submit_success, 1);
  assert.equal(firstInspection.totals.attacker_custom_event, undefined);
  assert.equal(firstInspection.pagePaths[0].value, '/tours');
  assert.ok(firstInspection.pagePaths.every((row) => !row.value.includes('%40')));
  assert.ok(
    firstInspection.dimensions.every(
      (row) => !/996880099808|example_traveller|phone:|telegram:/i.test(row.value)
    )
  );
  const storedMetadata = firstInspection.newest.map((row) => JSON.parse(row.metadata_json));
  assert.ok(storedMetadata.some((metadata) => metadata.utmSource === 'google'));
  assert.ok(storedMetadata.some((metadata) => metadata.destinationPath === '/tours/song-kul-horse-tour'));
  assert.ok(storedMetadata.every((metadata) => !('email' in metadata) && !('participants' in metadata) && !('href' in metadata)));
  assert.ok(firstInspection.newest.every((row) => row.source === 'web'));
  assert.ok(firstInspection.newest.every((row) => row.analytics_aggregated_at));
  assert.ok(
    firstInspection.newest
      .filter((row) => row.event_name === 'tour_card_view_click')
      .every((row) => !/996880099808|example_traveller/i.test(row.label))
  );

  assert.equal(insertEventLikeRolledBackBackend(), 1);

  const restartPort = await availablePort();
  backend = await startBackend(restartPort);
  await stopBackend(backend.child);
  backend = null;
  const secondInspection = inspectDatabase();
  assert.equal(secondInspection.pendingCount, 0);
  assert.equal(secondInspection.totals.footer_whatsapp_click, 1);
  assert.equal(secondInspection.rollbackEvent.label, '');
  assert.equal(secondInspection.rollbackEvent.metadata_json, '{}');
  assert.ok(secondInspection.rollbackEvent.analytics_aggregated_at);
  assert.equal(secondInspection.compactionMarker, firstInspection.compactionMarker);

  const secondRestartPort = await availablePort();
  backend = await startBackend(secondRestartPort);
  await stopBackend(backend.child);
  backend = null;
  const thirdInspection = inspectDatabase();
  assert.deepEqual(thirdInspection.totals, secondInspection.totals);
  assert.equal(thirdInspection.compactionMarker, firstInspection.compactionMarker);

  console.log('Analytics storage migration, retention, sanitization, and idempotency checks passed.');
} finally {
  if (backend?.child) await stopBackend(backend.child);
  const resolvedTemporaryRoot = path.resolve(temporaryRoot);
  const resolvedSystemTemporaryRoot = path.resolve(os.tmpdir());
  if (
    resolvedTemporaryRoot.startsWith(`${resolvedSystemTemporaryRoot}${path.sep}`) &&
    path.basename(resolvedTemporaryRoot).startsWith('gkt-analytics-test-')
  ) {
    fs.rmSync(resolvedTemporaryRoot, { recursive: true, force: true });
  }
}

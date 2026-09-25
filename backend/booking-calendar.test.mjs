import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import Database from 'better-sqlite3';
import { createBookingCalendar, calendarToday, validCalendarDate } from './booking-calendar.mjs';

function fixture(databasePath = ':memory:') {
  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE tours(id INTEGER PRIMARY KEY, title TEXT, tour_json TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE guest_requests(id TEXT PRIMARY KEY, type TEXT, payload_json TEXT, source_ip TEXT, status TEXT, created_at TEXT, updated_at TEXT);
    INSERT INTO tours VALUES(1, 'Mountain route', '{"availabilityMode":"scheduled"}', 1);
    INSERT INTO tours VALUES(2, 'Private route', '{"availabilityMode":"on-request"}', 1);
  `);
  let currentTime = new Date('2026-09-09T12:00:00Z');
  const calendar = createBookingCalendar(db, { clock: () => currentTime });
  let serial = 0;
  const departure = (overrides = {}) => calendar.createDeparture({
    tourId: 1, startDate: '2026-10-01', endDate: '2026-10-03', capacity: 3, status: 'open', ...overrides,
  });
  const request = (payload = {}, type = 'booking') => {
    const id = `test-${++serial}`;
    const normalized = calendar.createRequest({
      id, type, sourceIp: '127.0.0.1', payload: {
        tourId: 1, participants: 2, name: 'Private test name', email: 'private@example.test', ...payload,
      },
    });
    return { id, payload: normalized };
  };
  return { db, calendar, departure, request, setClock: (value) => { currentTime = new Date(value); } };
}

function withFixture(run) {
  return () => {
    const f = fixture();
    try { run(f); } finally { f.db.close(); }
  };
}

test('dates are strict calendar dates and today uses Kyrgyzstan time', () => {
  assert.equal(calendarToday(new Date('2026-09-09T19:00:00Z')), '2026-09-10');
  assert.equal(validCalendarDate('2028-02-29'), true);
  for (const date of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-9-09', '2026-09-09T00:00:00Z', {}, 123]) {
    assert.equal(validCalendarDate(date), false);
  }
});

test('scheduled requests require a real slot and server derives authoritative dates', withFixture(({ departure, request }) => {
  const slot = departure();
  assert.throws(() => request(), /choose an available departure/i);
  assert.throws(() => request({ departureId: 'missing' }), /belonging to this tour/i);
  assert.throws(() => request({ tourId: 2, departureId: slot.id }), /belonging to this tour/i);
  const saved = request({ departureId: slot.id, tourTitle: 'Untrusted title' });
  assert.equal(saved.payload.startDate, '2026-10-01');
  assert.equal(saved.payload.endDate, '2026-10-03');
  assert.equal(saved.payload.tourTitle, 'Mountain route');
  assert.throws(() => request({ departureId: slot.id, startDate: '2026-10-02', endDate: slot.endDate }), /dates have changed/i);
}));

test('pending does not hold capacity, confirmation does, conflicting approval rolls back', withFixture(({ departure, request, calendar, db }) => {
  const slot = departure();
  const first = request({ departureId: slot.id });
  const second = request({ departureId: slot.id });
  assert.equal(calendar.publicDepartures(1).departures[0].remainingSeats, 3);
  assert.equal(calendar.adminDepartures().departures[0].pendingRequests, 2);
  calendar.updateRequest(first.id, { status: 'approved' });
  assert.equal(calendar.publicDepartures(1).departures[0].remainingSeats, 1);
  assert.throws(() => calendar.updateRequest(second.id, { status: 'approved' }), /not enough places/i);
  assert.equal(db.prepare('SELECT status FROM guest_requests WHERE id = ?').get(second.id).status, 'pending');
  assert.equal(calendar.adminDepartures().departures[0].confirmedParticipants, 2);
}));

test('cancellation releases seats; completed retains seats and does not double count', withFixture(({ departure, request, calendar, setClock }) => {
  const slot = departure();
  const first = request({ departureId: slot.id });
  const second = request({ departureId: slot.id });
  calendar.updateRequest(first.id, { status: 'approved' });
  calendar.updateRequest(first.id, { status: 'cancelled' });
  calendar.updateRequest(second.id, { status: 'approved' });
  calendar.updateRequest(second.id, { status: 'approved' });
  assert.equal(calendar.adminDepartures().departures[0].confirmedParticipants, 2);
  setClock('2026-10-05T12:00:00Z');
  calendar.updateRequest(second.id, { status: 'completed' });
  assert.equal(calendar.adminDepartures().departures[0].confirmedParticipants, 2);
  assert.throws(() => calendar.updateRequest(first.id, { status: 'approved' }), /already started/i);
}));

test('invalid, closed, past and oversized requests are rejected before storing', withFixture(({ departure, request, calendar, setClock, db }) => {
  const slot = departure({ status: 'closed' });
  assert.throws(() => request({ departureId: slot.id }), /no longer available/i);
  calendar.updateDeparture(slot.id, { status: 'open' });
  assert.throws(() => request({ departureId: slot.id, participants: 4 }), /not enough places/i);
  for (const participants of [0, -1, 1.5, 101, '', null, true, {}]) {
    assert.throws(() => request({ departureId: slot.id, participants }), /Participants must/i);
  }
  setClock('2026-10-02T12:00:00Z');
  assert.throws(() => request({ departureId: slot.id }), /already started/i);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM guest_requests').get().n, 0);
}));

test('on-request supports flexible dates but supplied dates must be real and future', withFixture(({ request }) => {
  assert.equal(request({ tourId: 2 }).payload.startDate, '');
  assert.throws(() => request({ tourId: 2, startDate: '2026-10-01' }), /Choose an end date/i);
  assert.throws(() => request({ tourId: 2, startDate: '2026-02-30' }), /valid calendar dates/i);
  assert.throws(() => request({ tourId: 2, startDate: '2026-09-08', endDate: '2026-09-08' }), /in the past/i);
  assert.throws(() => request({ tourId: 2, endDate: '2026-10-03' }), /Choose a start date/i);
  assert.throws(() => request({ tourId: 2, startDate: '2026-10-03', endDate: '2026-10-01' }), /on or after/i);
  assert.equal(request({ tourId: 0, tourTitle: 'Private route' }).payload.tourId, 2);
}));

test('public availability contains no customer identifiers or private request counts', withFixture(({ departure, request, calendar, setClock }) => {
  const slot = departure();
  request({ departureId: slot.id });
  departure({ startDate: '2026-10-05', endDate: '2026-10-07', status: 'closed' });
  const result = calendar.publicDepartures(1);
  assert.equal(result.mode, 'scheduled');
  assert.equal(result.timezone, 'Asia/Bishkek');
  assert.equal(result.departures.length, 2);
  for (const row of result.departures) {
    assert.deepEqual(Object.keys(row).sort(), ['capacity', 'endDate', 'id', 'remainingSeats', 'startDate', 'status', 'tourId'].sort());
  }
  assert.doesNotMatch(JSON.stringify(result), /Private test name|private@example|127\.0\.0\.1|pendingRequests/);
  setClock('2026-10-02T12:00:00Z');
  assert.equal(calendar.publicDepartures(1).departures.length, 1);
}));

test('departure capacity cannot shrink below confirmed, used dates cannot silently change or disappear', withFixture(({ departure, request, calendar }) => {
  const slot = departure();
  const booking = request({ departureId: slot.id });
  calendar.updateRequest(booking.id, { status: 'approved' });
  assert.throws(() => calendar.updateDeparture(slot.id, { capacity: 1 }), /smaller than/i);
  assert.throws(() => calendar.updateDeparture(slot.id, { startDate: '2026-10-02' }), /move requests individually/i);
  assert.throws(() => calendar.deleteDeparture(slot.id), /Close it instead/i);
  calendar.updateDeparture(slot.id, { status: 'closed' });
  assert.equal(calendar.adminDepartures().departures[0].status, 'closed');
  const empty = departure({ startDate: '2026-10-08', endDate: '2026-10-10' });
  calendar.deleteDeparture(empty.id);
  assert.equal(calendar.adminDepartures().departures.length, 1);
}));

test('confirmed move enforces new capacity atomically and cannot bypass by clearing dates/slot', withFixture(({ departure, request, calendar, db }) => {
  const first = departure();
  const second = departure({ startDate: '2026-10-10', endDate: '2026-10-12', capacity: 1 });
  const booking = request({ departureId: first.id });
  calendar.updateRequest(booking.id, { status: 'approved' });
  assert.throws(() => calendar.updateRequest(booking.id, { departureId: second.id }), /not enough places/i);
  assert.equal(calendar.departureIdForRequest(booking.id), first.id);
  assert.equal(JSON.parse(db.prepare('SELECT payload_json FROM guest_requests WHERE id = ?').get(booking.id).payload_json).startDate, first.startDate);
  assert.throws(() => calendar.updateRequest(booking.id, { departureId: '' }), /cannot be cleared/i);
  assert.throws(() => calendar.updateRequest(booking.id, { startDate: '' }), /different departure/i);
  calendar.updateDeparture(second.id, { capacity: 2 });
  calendar.updateRequest(booking.id, { departureId: second.id });
  assert.equal(calendar.departureIdForRequest(booking.id), second.id);
  const slots = calendar.adminDepartures().departures;
  assert.equal(slots[0].confirmedParticipants, 0);
  assert.equal(slots[1].confirmedParticipants, 2);
}));

test('on-request date edits stay flexible and linked requests can only move with slot', withFixture(({ request, departure, calendar }) => {
  const booking = request({ tourId: 2 });
  calendar.updateRequest(booking.id, { startDate: '2026-10-05', endDate: '2026-10-07' });
  const slot = departure({ tourId: 2, startDate: '2026-10-10', endDate: '2026-10-12' });
  calendar.updateRequest(booking.id, { departureId: slot.id });
  assert.equal(calendar.departureIdForRequest(booking.id), slot.id);
  assert.throws(() => calendar.updateRequest(booking.id, { endDate: '2026-10-15' }), /different departure/i);
}));

test('adding a schedule counts exact dated legacy confirmations and rejects undersized capacity transactionally', withFixture(({ request, departure, calendar, db }) => {
  const booking = request({ tourId: 2, startDate: '2026-10-01', endDate: '2026-10-03', participants: 3 });
  calendar.updateRequest(booking.id, { status: 'approved' });
  assert.throws(() => departure({ tourId: 2, capacity: 2 }), /existing confirmed bookings/i);
  assert.equal(calendar.adminDepartures().departures.length, 0);
  assert.equal(calendar.departureIdForRequest(booking.id), '');
  const slot = departure({ tourId: 2, capacity: 3 });
  assert.equal(slot.remainingSeats, 0);
  assert.equal(calendar.departureIdForRequest(booking.id), slot.id);
  assert.equal(calendar.publicDepartures(2).mode, 'on-request');
  assert.equal(db.prepare('SELECT status FROM guest_requests WHERE id = ?').get(booking.id).status, 'approved');
  assert.throws(() => request({ tourId: 2, startDate: slot.startDate, endDate: slot.endDate }), /not enough places/i);
}));

test('schedule mutations validate ranges, uniqueness, limits and inactive tours', withFixture(({ departure, calendar, db }) => {
  for (const capacity of [0, -1, 1.5, 101, '', null]) assert.throws(() => departure({ capacity }));
  assert.throws(() => departure({ startDate: '2026-09-08' }), /in the past/i);
  assert.throws(() => departure({ endDate: '2026-09-30' }), /on or after/i);
  assert.throws(() => departure({ startDate: '2026-02-30' }), /valid calendar dates/i);
  departure();
  assert.throws(() => departure(), /already exists/i);
  assert.throws(() => calendar.adminDepartures({ from: 'bad' }), /Invalid calendar range/i);
  assert.throws(() => calendar.adminDepartures({ from: '2026-10-10', to: '2026-10-01' }), /on or after/i);
  assert.equal(calendar.adminDepartures({ from: '2026-10-02', to: '2026-10-02' }).departures.length, 1);
  db.prepare('UPDATE tours SET is_active = 0 WHERE id = 1').run();
  assert.throws(() => calendar.publicDepartures(1), /not found/i);
}));

test('historical completion supports partial legacy dates and closed departures but still enforces capacity', withFixture(({ departure, request, calendar, db, setClock }) => {
  db.prepare(`INSERT INTO guest_requests(id, type, payload_json, status) VALUES(?, ?, ?, ?)`)
    .run('legacy-partial', 'booking', JSON.stringify({ tourId: 2, startDate: '2026-08-01', participants: 1 }), 'pending');
  assert.equal(calendar.updateRequest('legacy-partial', { status: 'completed' }).status, 'completed');
  const slot = departure();
  const first = request({ departureId: slot.id });
  const second = request({ departureId: slot.id });
  calendar.updateDeparture(slot.id, { status: 'closed' });
  setClock('2026-10-05T12:00:00Z');
  calendar.updateRequest(first.id, { status: 'completed' });
  assert.equal(calendar.adminDepartures().departures[0].confirmedParticipants, 2);
  assert.throws(() => calendar.updateRequest(second.id, { status: 'completed' }), /not enough places/i);
  assert.equal(db.prepare('SELECT status FROM guest_requests WHERE id = ?').get(second.id).status, 'pending');
}));

test('dating an already approved flexible request enforces capacity and binds the departure transactionally', withFixture(({ departure, request, calendar, db }) => {
  const slot = departure({ tourId: 2, capacity: 1 });
  const filled = request({ tourId: 2, departureId: slot.id, participants: 1 });
  calendar.updateRequest(filled.id, { status: 'approved' });
  const flexible = request({ tourId: 2, participants: 1 });
  calendar.updateRequest(flexible.id, { status: 'approved' });
  assert.throws(() => calendar.updateRequest(flexible.id, { startDate: slot.startDate, endDate: slot.endDate }), /not enough places/i);
  assert.equal(calendar.departureIdForRequest(flexible.id), '');
  assert.equal(JSON.parse(db.prepare('SELECT payload_json FROM guest_requests WHERE id = ?').get(flexible.id).payload_json).startDate, '');
  calendar.updateRequest(filled.id, { status: 'cancelled' });
  calendar.updateRequest(flexible.id, { startDate: slot.startDate, endDate: slot.endDate });
  assert.equal(calendar.departureIdForRequest(flexible.id), slot.id);
  assert.equal(calendar.adminDepartures().departures[0].confirmedParticipants, 1);
}));

test('simultaneous confirmations from separate SQLite connections cannot oversell the last places', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kyrgyz-booking-calendar-test-'));
  const databasePath = path.join(directory, 'calendar.sqlite');
  const f = fixture(databasePath);
  const workers = [];
  try {
    const slot = f.departure();
    const bookings = [f.request({ departureId: slot.id }), f.request({ departureId: slot.id })];
    const gate = new SharedArrayBuffer(4);
    const starts = [];
    const outcomes = [];
    for (const booking of bookings) {
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        (async () => {
          const { default: Database } = await import(workerData.databaseModule);
          const { createBookingCalendar } = await import(workerData.calendarModule);
          const db = new Database(workerData.databasePath);
          db.pragma('foreign_keys = ON');
          try {
            const calendar = createBookingCalendar(db, { clock: () => new Date('2026-09-09T12:00:00Z') });
            parentPort.postMessage({ ready: true });
            Atomics.wait(new Int32Array(workerData.gate), 0, 0);
            try {
              calendar.updateRequest(workerData.requestId, { status: 'approved' });
              parentPort.postMessage({ outcome: 'approved' });
            } catch (error) {
              parentPort.postMessage({ outcome: 'rejected', statusCode: error.statusCode });
            }
          } finally { db.close(); }
        })().catch((error) => { throw error; });
      `, { eval: true, workerData: {
        databasePath, requestId: booking.id, gate,
        databaseModule: import.meta.resolve('better-sqlite3'),
        calendarModule: new URL('./booking-calendar.mjs', import.meta.url).href,
      } });
      workers.push(worker);
      starts.push(new Promise((resolve, reject) => {
        worker.on('message', (message) => { if (message.ready) resolve(); });
        worker.once('error', reject);
      }));
      outcomes.push(new Promise((resolve, reject) => {
        worker.on('message', (message) => { if (message.outcome) resolve(message); });
        worker.once('error', reject);
      }));
    }
    await Promise.all(starts);
    Atomics.store(new Int32Array(gate), 0, 1);
    Atomics.notify(new Int32Array(gate), 0, 2);
    const result = await Promise.all(outcomes);
    assert.equal(result.filter((item) => item.outcome === 'approved').length, 1);
    assert.equal(result.filter((item) => item.statusCode === 409).length, 1);
    assert.equal(f.calendar.adminDepartures().departures[0].confirmedParticipants, 2);
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
    f.db.close();
    // The directory is freshly generated by this test and contains no user data.
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('legacy title-only confirmations count toward new departure capacity and can be moved', withFixture(({ departure, calendar, db }) => {
  db.prepare(`INSERT INTO guest_requests(id, type, payload_json, status) VALUES(?, ?, ?, ?)`)
    .run('legacy-title', 'booking', JSON.stringify({ tourId: 0, tourTitle: 'Private route', startDate: '2026-10-01', endDate: '2026-10-03', participants: 2 }), 'approved');
  assert.throws(() => departure({ tourId: 2, capacity: 1 }), /existing confirmed bookings/i);
  const first = departure({ tourId: 2, capacity: 2 });
  assert.equal(first.confirmedParticipants, 2);
  assert.deepEqual(calendar.departureForRequest('legacy-title'), { id: first.id, tourId: 2 });
  const second = departure({ tourId: 2, startDate: '2026-10-05', endDate: '2026-10-07', capacity: 2 });
  calendar.updateRequest('legacy-title', { departureId: second.id });
  assert.equal(calendar.departureIdForRequest('legacy-title'), second.id);
  assert.equal(calendar.adminDepartures().departures[0].confirmedParticipants, 0);
  assert.equal(calendar.adminDepartures().departures[1].confirmedParticipants, 2);
}));

test('ambiguous legacy titles cannot silently undercount confirmed bookings', withFixture(({ departure, request, calendar, db }) => {
  db.prepare(`INSERT INTO tours VALUES(3, 'Private route', '{"availabilityMode":"on-request"}', 1)`).run();
  assert.throws(() => request({ tourId: 0, tourTitle: 'Private route' }), /Tour ID/i);
  db.prepare(`INSERT INTO guest_requests(id, type, payload_json, status) VALUES(?, ?, ?, ?)`)
    .run('legacy-ambiguous', 'booking', JSON.stringify({ tourId: 0, tourTitle: 'Private route', startDate: '2026-10-01', endDate: '2026-10-03', participants: 2 }), 'approved');
  assert.throws(() => departure({ tourId: 2, capacity: 1 }), /ambiguous tour title/i);
  assert.equal(calendar.adminDepartures().departures.length, 0);
}));

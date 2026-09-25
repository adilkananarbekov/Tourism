import crypto from 'node:crypto';

export class BookingCalendarError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const requestStatuses = new Set(['pending', 'contacted', 'approved', 'completed', 'cancelled', 'rejected']);
const reservedStatuses = new Set(['approved', 'completed']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

export function calendarToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bishkek', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function validCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function integer(value, label, maximum = 100) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') {
    throw new BookingCalendarError(`${label} must be a whole number between 1 and ${maximum}.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
    throw new BookingCalendarError(`${label} must be a whole number between 1 and ${maximum}.`);
  }
  return number;
}

function parsePayload(row) {
  try { return JSON.parse(row.payload_json); } catch { return {}; }
}

export function createBookingCalendar(db, { clock = () => new Date() } = {}) {
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tour_departures (
      id TEXT PRIMARY KEY,
      tour_id INTEGER NOT NULL REFERENCES tours(id),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK(capacity BETWEEN 1 AND 100),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(tour_id, start_date, end_date)
    );
    CREATE INDEX IF NOT EXISTS idx_tour_departures_dates ON tour_departures(start_date, end_date);
    CREATE TABLE IF NOT EXISTS request_departures (
      request_id TEXT PRIMARY KEY REFERENCES guest_requests(id),
      departure_id TEXT NOT NULL REFERENCES tour_departures(id),
      participants INTEGER NOT NULL CHECK(participants BETWEEN 1 AND 100)
    );
    CREATE INDEX IF NOT EXISTS idx_request_departures_departure ON request_departures(departure_id);
  `);

  const getTourRow = db.prepare('SELECT * FROM tours WHERE id = ?');
  const getDepartureRow = db.prepare('SELECT * FROM tour_departures WHERE id = ?');
  const getRequest = db.prepare('SELECT * FROM guest_requests WHERE id = ?');
  const getBinding = db.prepare('SELECT * FROM request_departures WHERE request_id = ?');
  const getBoundDeparture = db.prepare(`SELECT d.id, d.tour_id AS tourId FROM request_departures a
    JOIN tour_departures d ON d.id = a.departure_id WHERE a.request_id = ?`);
  const bind = db.prepare(`
    INSERT INTO request_departures(request_id, departure_id, participants) VALUES (?, ?, ?)
    ON CONFLICT(request_id) DO UPDATE SET departure_id = excluded.departure_id, participants = excluded.participants
  `);
  const totals = db.prepare(`
    SELECT COALESCE(SUM(CASE WHEN r.status IN ('approved', 'completed') THEN a.participants ELSE 0 END), 0) AS confirmed,
      COALESCE(SUM(CASE WHEN r.status IN ('pending', 'contacted') THEN 1 ELSE 0 END), 0) AS pending,
      COUNT(*) AS requests
    FROM request_departures a JOIN guest_requests r ON r.id = a.request_id
    WHERE a.departure_id = ? AND a.request_id != ?
  `);
  const insertRequest = db.prepare(`
    INSERT INTO guest_requests(id, type, payload_json, source_ip, status, created_at, updated_at)
    VALUES (@id, @type, @payloadJson, @sourceIp, 'pending', @createdAt, @createdAt)
  `);
  const updateRequestRow = db.prepare(`
    UPDATE guest_requests SET payload_json = ?, status = ?, updated_at = ? WHERE id = ?
  `);
  const nowIso = () => clock().toISOString();
  const today = () => calendarToday(clock());

  function tourFor(id) {
    const tourId = integer(id, 'Tour ID', 2147483647);
    const row = getTourRow.get(tourId);
    if (!row || !row.is_active) throw new BookingCalendarError('Tour not found.', 404);
    const payload = parsePayload({ payload_json: row.tour_json });
    return { id: row.id, title: row.title, mode: payload.availabilityMode === 'scheduled' ? 'scheduled' : 'on-request' };
  }

  function resolveRequestTourId(payload) {
    const id = Number(payload.tourId);
    if (Number.isSafeInteger(id) && id > 0) return id;
    if (typeof payload.tourTitle !== 'string' || !payload.tourTitle) return 0;
    const matches = db.prepare('SELECT id FROM tours WHERE title = ? ORDER BY id LIMIT 2').all(payload.tourTitle);
    // A historical title is usable only when it identifies exactly one tour.
    return matches.length === 1 ? matches[0].id : 0;
  }

  function validateDates(payload, { required = false, allowPast = false } = {}) {
    const start = payload.startDate || '';
    const end = payload.endDate || '';
    if (required && (!start || !end)) throw new BookingCalendarError('Start and end dates are required.');
    if ((start && !validCalendarDate(start)) || (end && !validCalendarDate(end))) {
      throw new BookingCalendarError('Dates must be valid calendar dates in YYYY-MM-DD format.');
    }
    if (end && !start) throw new BookingCalendarError('Choose a start date before choosing the end date.');
    if (start && !end) throw new BookingCalendarError('Choose an end date, or clear both dates for a flexible request.');
    if (start && end && end < start) throw new BookingCalendarError('End date must be on or after the start date.');
    if (!allowPast && start && start < today()) throw new BookingCalendarError('The start date cannot be in the past.');
    return { startDate: start, endDate: end };
  }

  function mapDeparture(row, admin = false) {
    const used = totals.get(row.id, '');
    const result = {
      id: row.id, tourId: row.tour_id, startDate: row.start_date, endDate: row.end_date,
      capacity: row.capacity, remainingSeats: Math.max(0, row.capacity - used.confirmed), status: row.status,
    };
    if (admin) Object.assign(result, {
      tourTitle: getTourRow.get(row.tour_id)?.title || '', confirmedParticipants: used.confirmed,
      pendingRequests: used.pending, requestCount: used.requests, createdAt: row.created_at, updatedAt: row.updated_at,
    });
    return result;
  }

  function assertAvailable(row, participants, { excludeRequestId = '', allowHistoricalCompletion = false } = {}) {
    if (!row || (row.status !== 'open' && !allowHistoricalCompletion)) throw new BookingCalendarError('This departure is no longer available. Please choose another date.', 409);
    if (row.start_date < today() && !allowHistoricalCompletion) throw new BookingCalendarError('This departure has already started. Please choose another date.', 409);
    if (participants > row.capacity - totals.get(row.id, excludeRequestId).confirmed) {
      throw new BookingCalendarError('There are not enough places left on this departure. Please choose another date or a smaller group.', 409);
    }
  }

  function prepareRequest(type, payload) {
    const normalized = { ...payload, ...validateDates(payload) };
    let departure = null;
    if (type === 'booking') {
      normalized.participants = integer(payload.participants === undefined ? 1 : payload.participants, 'Participants');
      // Older integrations used the exact tour title without a numeric ID.
      const tour = tourFor(resolveRequestTourId(payload));
      normalized.tourId = tour.id;
      normalized.tourTitle = tour.title;
      if (payload.departureId) {
        departure = getDepartureRow.get(String(payload.departureId));
        if (!departure || departure.tour_id !== tour.id) throw new BookingCalendarError('Choose a departure belonging to this tour.');
        assertAvailable(departure, normalized.participants);
        if ((payload.startDate && payload.startDate !== departure.start_date) || (payload.endDate && payload.endDate !== departure.end_date)) {
          throw new BookingCalendarError('The selected departure dates have changed. Please select the departure again.', 409);
        }
        normalized.departureId = departure.id;
        normalized.startDate = departure.start_date;
        normalized.endDate = departure.end_date;
      } else if (tour.mode === 'scheduled') {
        throw new BookingCalendarError('Please choose an available departure from the calendar.');
      } else if (normalized.startDate && normalized.endDate) {
        departure = db.prepare('SELECT * FROM tour_departures WHERE tour_id = ? AND start_date = ? AND end_date = ?')
          .get(tour.id, normalized.startDate, normalized.endDate);
        if (departure) {
          assertAvailable(departure, normalized.participants);
          normalized.departureId = departure.id;
        }
      }
    }
    return { payload: normalized, departure };
  }

  const createRequest = db.transaction((input) => {
    const prepared = prepareRequest(input.type, input.payload);
    insertRequest.run({
      id: input.id, type: input.type, payloadJson: JSON.stringify(prepared.payload),
      sourceIp: input.sourceIp || '', createdAt: input.createdAt || nowIso(),
    });
    if (prepared.departure) bind.run(input.id, prepared.departure.id, prepared.payload.participants);
    return prepared.payload;
  });

  const updateRequest = db.transaction((id, patch) => {
    const row = getRequest.get(id);
    if (!row) throw new BookingCalendarError('Request not found.', 404);
    const status = own(patch, 'status') ? patch.status : row.status;
    if (!requestStatuses.has(status)) throw new BookingCalendarError('Invalid request status.');
    const payload = parsePayload(row);
    const resolvedTourId = resolveRequestTourId(payload);
    if (resolvedTourId) payload.tourId = resolvedTourId;
    const binding = getBinding.get(id);
    let departure = binding ? getDepartureRow.get(binding.departure_id) : null;
    const changesDeparture = own(patch, 'departureId') && patch.departureId !== (binding?.departure_id || payload.departureId || '');
    const changesDates = (own(patch, 'startDate') && patch.startDate !== (payload.startDate || '')) ||
      (own(patch, 'endDate') && patch.endDate !== (payload.endDate || ''));
    const newlyReserved = reservedStatuses.has(status) && !reservedStatuses.has(row.status);

    if (binding && own(patch, 'departureId') && !patch.departureId) {
      throw new BookingCalendarError('A scheduled request must be moved to another departure; its departure cannot be cleared.');
    }
    if ((binding || payload.departureId) && changesDates && !changesDeparture) {
      throw new BookingCalendarError('To change scheduled dates, select a different departure.');
    }
    if (changesDeparture) {
      if (row.type !== 'booking') throw new BookingCalendarError('Only tour booking requests can be assigned to a departure.');
      const tour = tourFor(payload.tourId);
      departure = patch.departureId ? getDepartureRow.get(String(patch.departureId)) : null;
      if (!departure || departure.tour_id !== tour.id) throw new BookingCalendarError('Choose a departure belonging to this tour.');
      const participants = integer(payload.participants ?? 1, 'Participants');
      assertAvailable(departure, participants, { excludeRequestId: id });
      payload.departureId = departure.id;
      payload.startDate = departure.start_date;
      payload.endDate = departure.end_date;
      bind.run(id, departure.id, participants);
    } else if (!departure && changesDates) {
      Object.assign(payload, validateDates({
        startDate: own(patch, 'startDate') ? patch.startDate : payload.startDate,
        endDate: own(patch, 'endDate') ? patch.endDate : payload.endDate,
      }));
    }

    if (newlyReserved || (reservedStatuses.has(status) && (changesDeparture || changesDates))) {
      if (departure) {
        if (status !== 'completed') tourFor(payload.tourId);
        assertAvailable(departure, integer(payload.participants ?? 1, 'Participants'), {
          excludeRequestId: id, allowHistoricalCompletion: status === 'completed' && !changesDeparture,
        });
      } else {
        if (status !== 'completed') validateDates(payload);
        if (status !== 'completed' && row.type === 'booking' && tourFor(payload.tourId).mode === 'scheduled') {
          throw new BookingCalendarError('Assign this request to an available departure before confirming it.');
        }
        if (row.type === 'booking' && payload.startDate && payload.endDate) {
          departure = db.prepare('SELECT * FROM tour_departures WHERE tour_id = ? AND start_date = ? AND end_date = ?')
            .get(payload.tourId, payload.startDate, payload.endDate);
          if (departure) {
            const participants = integer(payload.participants ?? 1, 'Participants');
            assertAvailable(departure, participants, { excludeRequestId: id, allowHistoricalCompletion: status === 'completed' });
            bind.run(id, departure.id, participants);
            payload.departureId = departure.id;
          }
        }
      }
    }
    updateRequestRow.run(JSON.stringify(payload), status, nowIso(), id);
    return getRequest.get(id);
  });

  function normalizedDeparture(input, existing = null) {
    const tour = tourFor(input.tourId ?? existing?.tour_id);
    const dates = validateDates({
      startDate: input.startDate ?? existing?.start_date,
      endDate: input.endDate ?? existing?.end_date,
    }, { required: true, allowPast: Boolean(existing && !own(input, 'startDate') && !own(input, 'endDate')) });
    const status = input.status ?? existing?.status ?? 'open';
    if (!['open', 'closed'].includes(status)) throw new BookingCalendarError('Departure status must be open or closed.');
    if (existing?.status === 'closed' && status === 'open' && dates.startDate < today()) {
      throw new BookingCalendarError('A past departure cannot be reopened.');
    }
    return { tourId: tour.id, ...dates, capacity: integer(input.capacity ?? existing?.capacity, 'Capacity'), status };
  }

  const createDeparture = db.transaction((input) => {
    const departure = normalizedDeparture(input);
    const id = crypto.randomUUID();
    const now = nowIso();
    try {
      db.prepare(`INSERT INTO tour_departures(id, tour_id, start_date, end_date, capacity, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, departure.tourId, departure.startDate, departure.endDate, departure.capacity, departure.status, now, now);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new BookingCalendarError('A departure with these dates already exists for this tour.', 409);
      throw error;
    }
    // Match existing requests with exactly these dates, without modifying their payloads.
    // This includes approved legacy bookings in capacity checks when adding a schedule.
    const legacy = db.prepare(`SELECT r.* FROM guest_requests r LEFT JOIN request_departures a ON a.request_id = r.id
      WHERE r.type = 'booking' AND a.request_id IS NULL`).all();
    for (const request of legacy) {
      const payload = parsePayload(request);
      if (payload.startDate !== departure.startDate || payload.endDate !== departure.endDate) continue;
      const resolvedTourId = resolveRequestTourId(payload);
      if (!resolvedTourId && payload.tourTitle === getTourRow.get(departure.tourId)?.title && reservedStatuses.has(request.status)) {
        throw new BookingCalendarError('A confirmed legacy request has an ambiguous tour title. Resolve its tour assignment before creating this departure.', 409);
      }
      if (resolvedTourId === departure.tourId) {
        bind.run(request.id, id, integer(payload.participants ?? 1, 'Participants'));
      }
    }
    if (totals.get(id, '').confirmed > departure.capacity) {
      throw new BookingCalendarError('Capacity is smaller than existing confirmed bookings on these dates.', 409);
    }
    return mapDeparture(getDepartureRow.get(id), true);
  });

  const updateDeparture = db.transaction((id, input) => {
    const existing = getDepartureRow.get(id);
    if (!existing) throw new BookingCalendarError('Departure not found.', 404);
    const updated = normalizedDeparture(input, existing);
    const used = totals.get(id, '');
    if (updated.capacity < used.confirmed) throw new BookingCalendarError('Capacity cannot be smaller than the number of confirmed participants.', 409);
    if (used.requests && (updated.tourId !== existing.tour_id || updated.startDate !== existing.start_date || updated.endDate !== existing.end_date)) {
      throw new BookingCalendarError('This departure has requests. Create a new departure and move requests individually before changing its dates.', 409);
    }
    try {
      db.prepare(`UPDATE tour_departures SET tour_id = ?, start_date = ?, end_date = ?, capacity = ?, status = ?, updated_at = ? WHERE id = ?`)
        .run(updated.tourId, updated.startDate, updated.endDate, updated.capacity, updated.status, nowIso(), id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new BookingCalendarError('A departure with these dates already exists for this tour.', 409);
      throw error;
    }
    return mapDeparture(getDepartureRow.get(id), true);
  });

  const deleteDeparture = db.transaction((id) => {
    if (!getDepartureRow.get(id)) throw new BookingCalendarError('Departure not found.', 404);
    if (totals.get(id, '').requests) throw new BookingCalendarError('This departure has requests and cannot be deleted. Close it instead.', 409);
    db.prepare('DELETE FROM tour_departures WHERE id = ?').run(id);
  });

  return {
    departureForRequest: (id) => getBoundDeparture.get(id) || null,
    departureIdForRequest: (id) => getBinding.get(id)?.departure_id || '',
    createRequest: (input) => createRequest.immediate(input),
    updateRequest: (id, patch) => updateRequest.immediate(id, patch),
    createDeparture: (input) => createDeparture.immediate(input),
    updateDeparture: (id, input) => updateDeparture.immediate(id, input),
    deleteDeparture: (id) => deleteDeparture.immediate(id),
    publicDepartures(id) {
      const tour = tourFor(id);
      const rows = db.prepare('SELECT * FROM tour_departures WHERE tour_id = ? AND start_date >= ? ORDER BY start_date, end_date').all(tour.id, today());
      return { mode: tour.mode, timezone: 'Asia/Bishkek', today: today(), departures: rows.map((row) => mapDeparture(row)) };
    },
    adminDepartures(filters = {}) {
      const clauses = [];
      const values = [];
      if (filters.from) {
        if (!validCalendarDate(filters.from)) throw new BookingCalendarError('Invalid calendar range start.');
        clauses.push('end_date >= ?'); values.push(filters.from);
      }
      if (filters.to) {
        if (!validCalendarDate(filters.to)) throw new BookingCalendarError('Invalid calendar range end.');
        clauses.push('start_date <= ?'); values.push(filters.to);
      }
      if (filters.from && filters.to && filters.to < filters.from) throw new BookingCalendarError('Calendar range end must be on or after its start.');
      if (filters.tourId) { clauses.push('tour_id = ?'); values.push(integer(filters.tourId, 'Tour ID', 2147483647)); }
      const rows = db.prepare(`SELECT * FROM tour_departures ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY start_date, tour_id`).all(...values);
      return { timezone: 'Asia/Bishkek', today: today(), departures: rows.map((row) => mapDeparture(row, true)) };
    },
  };
}

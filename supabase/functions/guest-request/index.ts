import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type GuestRequestType = 'booking' | 'custom_tour_request';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function requireText(value: unknown, label: string) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalText(value: unknown) {
  return String(value ?? '').trim();
}

function optionalDate(value: unknown) {
  const text = optionalText(value);
  return text || null;
}

function positiveInteger(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive number.`);
  }
  return parsed;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizeTelegramUsername(value: unknown) {
  const text = optionalText(value);
  if (!text) {
    return '';
  }
  return text.startsWith('@') ? text : `@${text}`;
}

function assertContact(telegramUsername: string, phone: string) {
  if (!telegramUsername && !phone) {
    throw new Error('Add a Telegram username or phone number.');
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'none';
  }
  return value ? String(value) : 'none';
}

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service credentials are not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

async function readAppSecrets(
  supabase: ReturnType<typeof createClient>,
  names: string[],
) {
  const { data, error } = await supabase
    .from('app_secrets')
    .select('name,value')
    .in('name', names);

  if (error) {
    throw new Error(error.message);
  }

  return Object.fromEntries((data || []).map((item) => [item.name, item.value])) as Record<
    string,
    string
  >;
}

async function sendTelegram(supabase: ReturnType<typeof createClient>, text: string) {
  const secrets = await readAppSecrets(supabase, ['telegram_bot_token', 'telegram_chat_id']);
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || secrets.telegram_bot_token;
  const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID') || secrets.telegram_chat_id;

  if (!telegramToken || !telegramChatId) {
    return { skipped: true };
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramChatId,
      parse_mode: 'HTML',
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return { skipped: false };
}

function formatBooking(row: Record<string, unknown>) {
  const contact = [
    row.telegram_username ? `Telegram: ${escapeHtml(row.telegram_username)}` : '',
    row.phone ? `Phone: ${escapeHtml(row.phone)}` : '',
    row.email ? `Email: ${escapeHtml(row.email)}` : '',
  ].filter(Boolean);
  const dates = row.start_date || row.end_date
    ? `${escapeHtml(row.start_date || 'flexible')} to ${escapeHtml(row.end_date || 'flexible')}`
    : 'Flexible';

  return [
    '<b>New website tour request</b>',
    `Tour: ${escapeHtml(row.tour_title)}`,
    `Guest: ${escapeHtml(row.name)}`,
    `Contact: ${contact.join(' | ')}`,
    `Dates: ${dates}`,
    `Timing: ${escapeHtml(row.date_flexibility || 'Flexible')}`,
    `Participants: ${escapeHtml(row.participants)}`,
    `Total: ${escapeHtml(row.total_price)}`,
    `Notes: ${escapeHtml(row.notes || 'none')}`,
    'Action: contact the guest personally to confirm details.',
  ].join('\n');
}

function formatCustomTour(row: Record<string, unknown>) {
  const contact = [
    row.telegram_username ? `Telegram: ${escapeHtml(row.telegram_username)}` : '',
    row.phone ? `Phone: ${escapeHtml(row.phone)}` : '',
    row.email ? `Email: ${escapeHtml(row.email)}` : '',
  ].filter(Boolean);
  const dates = row.start_date || row.end_date
    ? `${escapeHtml(row.start_date || 'flexible')} to ${escapeHtml(row.end_date || 'flexible')}`
    : 'Flexible';

  return [
    '<b>New website custom request</b>',
    `Guest: ${escapeHtml(row.name)}`,
    `Contact: ${contact.join(' | ')}`,
    `Group: ${escapeHtml(row.group_size)} people`,
    `Dates: ${dates}`,
    `Timing: ${escapeHtml(row.date_flexibility || 'Flexible')}`,
    `Route: ${escapeHtml(row.start_location)} to ${escapeHtml(row.end_location)}`,
    `Sights: ${escapeHtml(listValue(row.sights))}`,
    `Activities: ${escapeHtml(listValue(row.activities))}`,
    `Budget: ${escapeHtml(row.budget || 'not specified')}`,
    `Notes: ${escapeHtml(row.special_requests || 'none')}`,
    'Action: contact the guest personally to confirm details.',
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { type?: GuestRequestType; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const payload = body.payload || {};

  try {
    const supabase = createServiceClient();

    if (body.type === 'booking') {
      const telegramUsername = normalizeTelegramUsername(payload.telegramUsername);
      const phone = optionalText(payload.phone);
      assertContact(telegramUsername, phone);

      const booking = {
        tour_id: payload.tourId == null ? null : Number(payload.tourId),
        tour_title: requireText(payload.tourTitle, 'Tour title'),
        name: requireText(payload.name, 'Name'),
        email: optionalText(payload.email),
        telegram_username: telegramUsername,
        phone,
        participants: positiveInteger(payload.participants, 'Participants'),
        start_date: optionalDate(payload.startDate),
        end_date: optionalDate(payload.endDate),
        date_flexibility: optionalText(payload.dateFlexibility),
        notes: optionalText(payload.notes),
        price_per_person: optionalText(payload.pricePerPerson),
        total_price: optionalText(payload.totalPrice),
        user_id: optionalText(payload.userId) || null,
        status: 'pending',
      };

      const { data, error } = await supabase.from('bookings').insert(booking).select('*').single();
      if (error) {
        throw new Error(error.message);
      }

      await sendTelegram(supabase, formatBooking(data));
      return json({ ok: true, id: data.id });
    }

    if (body.type === 'custom_tour_request') {
      const telegramUsername = normalizeTelegramUsername(payload.telegramUsername);
      const phone = optionalText(payload.phone);
      assertContact(telegramUsername, phone);

      const request = {
        group_size: positiveInteger(payload.groupSize, 'Group size'),
        start_date: optionalDate(payload.startDate),
        end_date: optionalDate(payload.endDate),
        date_flexibility: optionalText(payload.dateFlexibility),
        start_location: requireText(payload.startLocation, 'Start location'),
        end_location: requireText(payload.endLocation, 'End location'),
        sights: arrayValue(payload.sights),
        activities: arrayValue(payload.activities),
        pace: requireText(payload.pace, 'Pace'),
        accommodation: requireText(payload.accommodation, 'Accommodation'),
        name: requireText(payload.name, 'Name'),
        email: optionalText(payload.email),
        telegram_username: telegramUsername,
        phone,
        budget: optionalText(payload.budget),
        special_requests: optionalText(payload.specialRequests),
        user_id: optionalText(payload.userId) || null,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('custom_tour_requests')
        .insert(request)
        .select('*')
        .single();
      if (error) {
        throw new Error(error.message);
      }

      await sendTelegram(supabase, formatCustomTour(data));
      return json({ ok: true, id: data.id });
    }

    return json({ error: 'Unknown request type' }, 400);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unable to submit request.' },
      400,
    );
  }
});

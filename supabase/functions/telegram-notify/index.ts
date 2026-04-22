import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type NotificationType = 'booking' | 'custom_tour_request';

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
    '<b>New tour booking</b>',
    `Tour: ${escapeHtml(row.tour_title)}`,
    `Guest: ${escapeHtml(row.name)}`,
    `Contact: ${contact.join(' | ')}`,
    `Dates: ${dates}`,
    `Timing: ${escapeHtml(row.date_flexibility || 'Flexible')}`,
    `Participants: ${escapeHtml(row.participants)}`,
    `Total: ${escapeHtml(row.total_price)}`,
    `Notes: ${escapeHtml(row.notes || 'none')}`,
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
    '<b>New custom tour request</b>',
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
  ].join('\n');
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let payload: { type?: NotificationType; id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (
    !payload.id ||
    (payload.type !== 'booking' && payload.type !== 'custom_tour_request')
  ) {
    return json({ error: 'Expected type and id' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Supabase service credentials are not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const secrets = await readAppSecrets(supabase, ['telegram_bot_token', 'telegram_chat_id']);
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || secrets.telegram_bot_token;
  const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID') || secrets.telegram_chat_id;

  if (!telegramToken || !telegramChatId) {
    return json({ ok: true, skipped: true, reason: 'Telegram secrets are not configured' }, 202);
  }

  const table = payload.type === 'booking' ? 'bookings' : 'custom_tour_requests';
  const { data, error } = await supabase.from(table).select('*').eq('id', payload.id).single();

  if (error || !data) {
    return json({ error: error?.message || 'Request not found' }, 404);
  }

  const text = payload.type === 'booking' ? formatBooking(data) : formatCustomTour(data);
  const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramChatId,
      parse_mode: 'HTML',
      text,
    }),
  });

  if (!telegramResponse.ok) {
    const details = await telegramResponse.text();
    return json({ error: 'Telegram send failed', details }, 502);
  }

  return json({ ok: true });
});

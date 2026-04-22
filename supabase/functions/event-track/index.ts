import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type EventPayload = {
  source?: string;
  eventName?: string;
  path?: string;
  label?: string;
  metadata?: Record<string, unknown>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service credentials are not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function cleanText(value: unknown, maxLength = 240) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function cleanEventName(value: unknown) {
  const text = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return /^[a-z0-9_]{2,80}$/.test(text) ? text : 'unknown_event';
}

function cleanSource(value: unknown) {
  return ['web', 'telegram', 'system'].includes(String(value)) ? String(value) : 'web';
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 20)
      .map(([key, item]) => [key.slice(0, 80), String(item ?? '').slice(0, 240)]),
  );
}

async function handleSummary() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('site_events')
    .select('source,event_name,path,label,created_at')
    .order('created_at', { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(error.message);
  }

  const events = data || [];
  const totals = events.reduce<Record<string, number>>((acc, item) => {
    const key = `${item.source}:${item.event_name}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return json({
    ok: true,
    totals,
    recent: events.slice(0, 40),
  });
}

async function handleTrack(req: Request) {
  const payload = (await req.json().catch(() => ({}))) as EventPayload;
  const supabase = createServiceClient();

  const event = {
    source: cleanSource(payload.source),
    event_name: cleanEventName(payload.eventName),
    path: cleanText(payload.path, 240),
    label: cleanText(payload.label, 160),
    metadata: cleanMetadata(payload.metadata),
    user_agent: cleanText(req.headers.get('user-agent'), 320),
    referrer: cleanText(req.headers.get('referer'), 320),
  };

  const { error } = await supabase.from('site_events').insert(event);
  if (error) {
    throw new Error(error.message);
  }

  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      return await handleSummary();
    }

    if (req.method === 'POST') {
      return await handleTrack(req);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to track event.' },
      400,
    );
  }
});

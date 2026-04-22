import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type TelegramChat = {
  id?: number | string;
  type?: string;
  title?: string;
  username?: string;
};

type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
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

async function readSecret(supabase: ReturnType<typeof createClient>, name: string) {
  const { data, error } = await supabase
    .from('app_secrets')
    .select('value')
    .eq('name', name)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.value as string | undefined;
}

async function writeSecret(supabase: ReturnType<typeof createClient>, name: string, value: string) {
  const { error } = await supabase.from('app_secrets').upsert(
    {
      name,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'name' },
  );

  if (error) {
    throw new Error(error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: true });
  }

  try {
    const supabase = createServiceClient();
    const expectedSecret = await readSecret(supabase, 'telegram_webhook_secret');
    const receivedSecret = req.headers.get('x-telegram-bot-api-secret-token');

    if (expectedSecret && receivedSecret !== expectedSecret) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const update = (await req.json()) as TelegramUpdate;
    const message = update.message || update.channel_post;
    const chat = message?.chat;
    const chatId = chat?.id == null ? '' : String(chat.id);
    const text = String(message?.text || '').trim();

    if (!chatId) {
      return json({ ok: true });
    }

    if (text.startsWith('/start')) {
      await writeSecret(supabase, 'telegram_chat_id', chatId);
      return json({
        method: 'sendMessage',
        chat_id: chatId,
        text: 'Supabase bot is connected. New tour bookings and custom tour requests will appear here.',
      });
    }

    if (text.startsWith('/chatid')) {
      return json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `Chat ID: ${chatId}`,
      });
    }

    return json({ ok: true });
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : 'Webhook failed' },
      500,
    );
  }
});

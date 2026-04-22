import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type TelegramUser = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id?: number | string;
  type?: string;
};

type TelegramMessage = {
  message_id?: number;
  text?: string;
  chat?: TelegramChat;
  from?: TelegramUser;
};

type TelegramCallbackQuery = {
  id?: string;
  data?: string;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

const botCommandsVersion = 'website-leads-admin-v1';
const siteUrl = 'https://adilkan.com/Tourism/';

const botCommands = [
  { command: 'start', description: 'Website lead notifications' },
  { command: 'help', description: 'How this admin bot works' },
  { command: 'chatid', description: 'Show this chat id' },
];

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

async function readTelegramToken(supabase: ReturnType<typeof createClient>) {
  return Deno.env.get('TELEGRAM_BOT_TOKEN') || (await readSecret(supabase, 'telegram_bot_token'));
}

async function telegramApi(
  token: string,
  method: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function ensureBotCommands(supabase: ReturnType<typeof createClient>, token: string) {
  const currentVersion = await readSecret(supabase, 'telegram_bot_commands_version');
  if (currentVersion === botCommandsVersion) {
    return;
  }

  await telegramApi(token, 'setMyCommands', {
    commands: botCommands,
  });
  await writeSecret(supabase, 'telegram_bot_commands_version', botCommandsVersion);
}

async function sendMessage(
  token: string,
  chatId: string,
  text: string,
  replyMarkup?: Record<string, unknown>,
) {
  return telegramApi(token, 'sendMessage', {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallback(token: string, callbackId: string) {
  return telegramApi(token, 'answerCallbackQuery', {
    callback_query_id: callbackId,
    text: 'This bot now receives website leads only.',
  });
}

async function trackBotEvent(
  supabase: ReturnType<typeof createClient>,
  eventName: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabase.from('site_events').insert({
      source: 'telegram',
      event_name: eventName,
      path: 'telegram',
      label: String(metadata.command || metadata.label || ''),
      metadata,
    });
  } catch (error) {
    console.error('Unable to track Telegram event', error);
  }
}

function websiteKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Open website request form', url: `${siteUrl}feedback` }],
      [{ text: 'View tours', url: `${siteUrl}tours` }],
    ],
  };
}

function adminHelpText(chatId: string, ownerChatId?: string) {
  const isConnected = ownerChatId === chatId;
  return [
    'Kyrgyz Riders admin bot',
    '',
    'This bot is now only for website lead notifications.',
    'Guests should submit requests on the website. When they send a request, this chat receives their name, contact details, selected tour, dates, and message.',
    '',
    `This chat id: ${chatId}`,
    `Admin chat connected: ${isConnected ? 'yes' : 'no'}`,
    '',
    'Useful commands:',
    '/chatid - show this chat id',
    '/help - show this message',
  ].join('\n');
}

function publicHelpText() {
  return [
    'Please send your tour request through the website.',
    '',
    'There you can choose a tour, leave your Telegram username or phone number, and write your message. The request goes directly to the admin chat.',
  ].join('\n');
}

async function handleTextMessage(
  supabase: ReturnType<typeof createClient>,
  token: string,
  message: TelegramMessage,
) {
  const chatId = message.chat?.id == null ? '' : String(message.chat.id);
  const text = String(message.text || '').trim();

  if (!chatId) {
    return;
  }

  const ownerChatId = await readSecret(supabase, 'telegram_chat_id');
  const isOwnerChat = ownerChatId === chatId;
  const command = text.split(/\s+/)[0]?.replace('/', '') || 'message';

  await trackBotEvent(supabase, 'telegram_admin_bot_message', {
    command,
    isOwnerChat,
    hasUsername: Boolean(message.from?.username),
  });

  if (text.startsWith('/chatid')) {
    await sendMessage(token, chatId, `Chat ID: ${chatId}`);
    return;
  }

  if (text.startsWith('/start') || text.startsWith('/help')) {
    await sendMessage(
      token,
      chatId,
      isOwnerChat ? adminHelpText(chatId, ownerChatId) : publicHelpText(),
      isOwnerChat ? undefined : websiteKeyboard(),
    );
    return;
  }

  await sendMessage(
    token,
    chatId,
    isOwnerChat
      ? 'Lead notification bot is active. Website requests will appear here automatically.'
      : publicHelpText(),
    isOwnerChat ? undefined : websiteKeyboard(),
  );
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

    const telegramToken = await readTelegramToken(supabase);
    if (!telegramToken) {
      throw new Error('Telegram bot token is not configured.');
    }

    try {
      await ensureBotCommands(supabase, telegramToken);
    } catch (error) {
      console.error('Unable to sync Telegram command menu', error);
    }

    const update = (await req.json()) as TelegramUpdate;

    if (update.callback_query) {
      if (update.callback_query.id) {
        await answerCallback(telegramToken, update.callback_query.id);
      }
      await trackBotEvent(supabase, 'telegram_admin_bot_callback', {
        data: update.callback_query.data || '',
      });
      return json({ ok: true });
    }

    const message = update.message || update.channel_post;
    if (message) {
      await handleTextMessage(supabase, telegramToken, message);
    }

    return json({ ok: true });
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : 'Webhook failed' },
      500,
    );
  }
});

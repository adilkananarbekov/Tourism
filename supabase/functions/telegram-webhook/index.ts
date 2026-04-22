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
  title?: string;
  username?: string;
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
  from?: TelegramUser;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type SurveyOption = {
  label: string;
  value: string;
};

type SurveyQuestion = {
  key: string;
  text: string;
  options: SurveyOption[];
};

type SurveySession = {
  chat_id: string;
  current_step: number;
  answers: Record<string, string>;
  completed: boolean;
};

const botCommandsVersion = 'telegram-menu-v3';
const botCommands = [
  { command: 'start', description: 'Начать мини-опрос' },
  { command: 'survey', description: 'Пройти опрос заново' },
  { command: 'tours', description: 'Открыть туры на сайте' },
  { command: 'photos', description: 'Показать фото туров' },
  { command: 'contact', description: 'Связаться с гидом' },
  { command: 'help', description: 'Помощь и команды' },
  { command: 'chatid', description: 'Показать chat id' },
];

const siteUrl = 'https://adilkan.com/Tourism/';

const tourPhotos = [
  {
    url: 'https://adilkan.com/Tourism/images/tour-songkul.jpg',
    caption: 'Song-Kul Lake Expedition',
  },
  {
    url: 'https://adilkan.com/Tourism/images/tour-ala-archa.jpg',
    caption: 'Ala-Archa Gorge Adventure',
  },
  {
    url: 'https://adilkan.com/Tourism/images/tour-horseback.jpg',
    caption: 'Horseback Riding Expedition',
  },
  {
    url: 'https://adilkan.com/Tourism/images/tour-issyk-kul.jpg',
    caption: 'Issyk-Kul Circuit',
  },
];

const surveyQuestions: SurveyQuestion[] = [
  {
    key: 'tour_interest',
    text: '1/3 Какой формат тура вам интересен?',
    options: [
      { label: 'Треккинг', value: 'trekking' },
      { label: 'Конные туры', value: 'horseback' },
      { label: 'Культура', value: 'culture' },
      { label: 'Свой маршрут', value: 'custom' },
    ],
  },
  {
    key: 'group_size',
    text: '2/3 Сколько человек примерно будет в поездке?',
    options: [
      { label: '1 человек', value: '1' },
      { label: '2-3 человека', value: '2-3' },
      { label: '4+ человека', value: '4+' },
      { label: 'Пока не знаю', value: 'unknown' },
    ],
  },
  {
    key: 'travel_time',
    text: '3/3 Когда хотите поехать?',
    options: [
      { label: 'Май - Июнь', value: 'may_june' },
      { label: 'Июль - Август', value: 'july_august' },
      { label: 'Сентябрь', value: 'september' },
      { label: 'Даты гибкие', value: 'flexible' },
    ],
  },
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

async function readTelegramToken(supabase: ReturnType<typeof createClient>) {
  return Deno.env.get('TELEGRAM_BOT_TOKEN') || (await readSecret(supabase, 'telegram_bot_token'));
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

function getOptionLabel(question: SurveyQuestion, value: string) {
  return question.options.find((option) => option.value === value)?.label || value;
}

function keyboardForStep(step: number) {
  const question = surveyQuestions[step];
  return {
    inline_keyboard: question.options.map((option) => [
      {
        text: option.label,
        callback_data: `survey|${step}|${option.value}`,
      },
    ]),
  };
}

function introText() {
  return [
    'Привет! Я бот Kyrgyz Riders.',
    'Я помогу выбрать тур и передам заявку владельцу.',
    'Оставьте короткие ответы, а затем владелец или менеджер свяжется с вами лично.',
    'Начнем короткий опрос.',
  ].join('\n');
}

function helpText() {
  return [
    'Команды бота:',
    '/start - начать мини-опрос',
    '/survey - пройти опрос заново',
    '/tours - открыть туры на сайте',
    '/photos - получить несколько фото туров',
    '/contact - как связаться с гидом',
    '/help - показать помощь',
    '',
    'Также можно написать обычное сообщение. Я сохраню контекст, а менеджер сможет связаться с вами по Telegram.',
  ].join('\n');
}

function siteKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'Смотреть туры', url: `${siteUrl}tours` },
        { text: 'Создать маршрут', url: `${siteUrl}custom-tour` },
      ],
      [
        { text: 'Галерея', url: `${siteUrl}gallery` },
        { text: 'Контакты', url: `${siteUrl}feedback` },
      ],
    ],
  };
}

function contactText() {
  return [
    'Можно оставить заявку через этот бот или через сайт.',
    '',
    'Заявка уходит владельцу Kyrgyz Riders. Дальше он или менеджер свяжется с вами лично.',
    '',
    'Для быстрого старта укажите:',
    '- примерные даты',
    '- сколько человек',
    '- что хотите увидеть',
    '',
    'Если удобнее, нажмите кнопку и заполните короткую форму.',
  ].join('\n');
}

function summaryText(answers: Record<string, string>) {
  const rows = surveyQuestions.map((question) => {
    const answer = answers[question.key] || 'not answered';
    return `- ${question.text.replace(/^\d\/3\s*/, '')}: ${getOptionLabel(question, answer)}`;
  });

  return [
    'Спасибо! Заявка принята.',
    '',
    'Ваши ответы:',
    ...rows,
    '',
    'Я передал ответы владельцу. Он или менеджер свяжется с вами лично.',
  ].join('\n');
}

function ownerSummaryText(
  chatId: string,
  user: TelegramUser | undefined,
  answers: Record<string, string>,
) {
  const username = user?.username ? `@${user.username}` : 'not provided';
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'not provided';
  const rows = surveyQuestions.map((question) => {
    const answer = answers[question.key] || 'not answered';
    return `- ${question.text.replace(/^\d\/3\s*/, '')}: ${getOptionLabel(question, answer)}`;
  });

  return [
    'New Telegram tour lead',
    `Name: ${name}`,
    `Username: ${username}`,
    `Chat ID: ${chatId}`,
    '',
    'Answers:',
    ...rows,
  ].join('\n');
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

async function sendTourPhotos(token: string, chatId: string) {
  await telegramApi(token, 'sendMediaGroup', {
    chat_id: chatId,
    media: tourPhotos.map((photo, index) => ({
      type: 'photo',
      media: photo.url,
      caption: index === 0
        ? `Фото туров Kyrgyz Riders\n${tourPhotos.map((item) => `- ${item.caption}`).join('\n')}`
        : undefined,
    })),
  });
}

async function notifyOwner(
  supabase: ReturnType<typeof createClient>,
  token: string,
  guestChatId: string,
  text: string,
) {
  const ownerChatId = await readSecret(supabase, 'telegram_chat_id');
  if (!ownerChatId || ownerChatId === guestChatId) {
    return;
  }
  await sendMessage(token, ownerChatId, text);
}

async function answerCallback(token: string, callbackId: string, text = 'Ответ сохранен') {
  return telegramApi(token, 'answerCallbackQuery', {
    callback_query_id: callbackId,
    text,
  });
}

async function upsertSession(
  supabase: ReturnType<typeof createClient>,
  chatId: string,
  user?: TelegramUser,
  values?: Partial<SurveySession>,
) {
  const { error } = await supabase.from('telegram_survey_sessions').upsert(
    {
      chat_id: chatId,
      telegram_user_id: user?.id == null ? null : String(user.id),
      username: user?.username || null,
      first_name: user?.first_name || null,
      last_name: user?.last_name || null,
      ...(values || {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'chat_id' },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function getSession(
  supabase: ReturnType<typeof createClient>,
  chatId: string,
): Promise<SurveySession | null> {
  const { data, error } = await supabase
    .from('telegram_survey_sessions')
    .select('chat_id,current_step,answers,completed')
    .eq('chat_id', chatId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as SurveySession | null;
}

async function startSurvey(
  supabase: ReturnType<typeof createClient>,
  token: string,
  chatId: string,
  user?: TelegramUser,
) {
  await upsertSession(supabase, chatId, user, {
    current_step: 0,
    answers: {},
    completed: false,
  });

  await sendMessage(token, chatId, introText());
  await sendMessage(token, chatId, surveyQuestions[0].text, keyboardForStep(0));
}

async function processSurveyAnswer(
  supabase: ReturnType<typeof createClient>,
  token: string,
  chatId: string,
  step: number,
  value: string,
  user?: TelegramUser,
) {
  const question = surveyQuestions[step];
  if (!question || !question.options.some((option) => option.value === value)) {
    await sendMessage(token, chatId, 'Не понял этот вариант. Напишите /start, чтобы начать заново.');
    return;
  }

  const session = await getSession(supabase, chatId);
  const answers = {
    ...(session?.answers || {}),
    [question.key]: value,
  };
  const nextStep = step + 1;

  if (nextStep >= surveyQuestions.length) {
    await upsertSession(supabase, chatId, user, {
      current_step: nextStep,
      answers,
      completed: true,
    });
    await sendMessage(token, chatId, summaryText(answers));
    try {
      await notifyOwner(supabase, token, chatId, ownerSummaryText(chatId, user, answers));
    } catch (error) {
      console.error('Unable to notify owner about survey lead', error);
    }
    return;
  }

  await upsertSession(supabase, chatId, user, {
    current_step: nextStep,
    answers,
    completed: false,
  });
  await sendMessage(token, chatId, surveyQuestions[nextStep].text, keyboardForStep(nextStep));
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

  if (text.startsWith('/start') || text.startsWith('/survey')) {
    await startSurvey(supabase, token, chatId, message.from);
    return;
  }

  if (text.startsWith('/help')) {
    await sendMessage(token, chatId, helpText());
    return;
  }

  if (text.startsWith('/tours')) {
    await sendMessage(
      token,
      chatId,
      'Выберите готовый тур или оставьте custom-заявку на сайте Kyrgyz Riders.',
      siteKeyboard(),
    );
    return;
  }

  if (text.startsWith('/photos')) {
    await sendMessage(token, chatId, 'Отправляю несколько фото туров.');
    await sendTourPhotos(token, chatId);
    return;
  }

  if (text.startsWith('/contact')) {
    await sendMessage(token, chatId, contactText(), siteKeyboard());
    return;
  }

  if (text.startsWith('/chatid')) {
    await sendMessage(token, chatId, `Chat ID: ${chatId}`);
    return;
  }

  if (!text) {
    return;
  }

  const session = await getSession(supabase, chatId);
  if (session && !session.completed) {
    const step = Math.max(0, Math.min(session.current_step, surveyQuestions.length - 1));
    await sendMessage(
      token,
      chatId,
      'Пожалуйста, выберите один из вариантов кнопками ниже.',
      keyboardForStep(step),
    );
    return;
  }

  await upsertSession(supabase, chatId, message.from, {});
  await sendMessage(
    token,
    chatId,
    [
      'Сообщение получил.',
      'Если хотите оставить заявку, отправьте /survey или откройте форму на сайте через /tours.',
    ].join('\n'),
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
      const callback = update.callback_query;
      let chatId = '';
      if (callback.message?.chat?.id != null) {
        chatId = String(callback.message.chat.id);
      } else if (callback.from?.id != null) {
        chatId = String(callback.from.id);
      }
      const [scope, stepText, value] = String(callback.data || '').split('|');

      if (callback.id) {
        await answerCallback(telegramToken, callback.id);
      }

      if (chatId && scope === 'survey') {
        await processSurveyAnswer(
          supabase,
          telegramToken,
          chatId,
          Number(stepText),
          value,
          callback.from,
        );
      }

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

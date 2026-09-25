import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileCheck2, ShieldCheck } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Button } from '../components/ui/button';
import { openCookieSettings } from '../lib/cookieConsent';
import { localizedPath, localeAlternates, useSiteLocale, type SiteLocale } from '../lib/locale';
import { breadcrumbJsonLd } from '../lib/seo';

type LegalPageKind = 'privacy' | 'terms';

type LegalSection = {
  id?: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalCopy = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  back: string;
  contact: string;
  manageCookies?: string;
  cookieTable?: {
    title: string;
    columns: [string, string, string, string];
    rows: Array<[string, string, string, string]>;
  };
  sections: LegalSection[];
};

const copy: Record<SiteLocale, Record<LegalPageKind, LegalCopy>> = {
  en: {
    privacy: {
      eyebrow: 'Privacy & cookies',
      title: 'Privacy Policy and Cookie Policy',
      description: 'How Go Kyrgyzstan Travel handles trip requests, accounts, first-party analytics, cookies, and privacy choices.',
      updated: 'Last updated: 13 August 2026',
      back: 'Back to tours',
      contact: 'Contact us about privacy',
      manageCookies: 'Manage cookie choices',
      sections: [
        {
          title: 'Who is responsible for this site',
          paragraphs: [
            'Go Kyrgyzstan Travel is operated by Jakypbekov Insan in Bishkek, Kyrgyzstan. For privacy questions or requests, use the trip request form and write “Privacy request” in the message.',
          ],
        },
        {
          title: 'Information we collect',
          paragraphs: [
            'When you send a tour request, we collect the details you choose to provide: name, country of residence, preferred contact channel, contact details, travel dates, group size, route interests, and message. The server also receives your network address for security and rate limiting and stores the source IP with the request.',
            'If you create an account, we process your name, email address, selected buyer or seller role, account identifier, and a securely hashed version of your password. We do not store the readable password on the server.',
            'A review contains the name, rating, and comments you submit and may be published after moderation. A seller proposal can contain contact details, tour descriptions, itineraries, prices, and uploaded images; approved material may become public tour content.',
            'If you opt in to analytics, we collect limited activity data: pages viewed, clicks on tour cards and contact actions, scroll depth, request-flow outcomes, device category (mobile, tablet, or desktop), the first landing pathname, external referrer hostname, UTM source, medium, and campaign, and a random first-party session identifier. We do not collect the full referring URL or its query. Analytics does not receive the values typed into request fields, email addresses, phone numbers, Telegram usernames, advertising identifiers, or precise location.',
          ],
        },
        {
          title: 'Why we use information',
          paragraphs: ['We use request details to communicate with you, prepare an itinerary or quotation, manage a booking if you choose to proceed, protect the site from misuse, and meet applicable legal obligations. Account, review, and seller-submission data supports the relevant dashboard and moderation features. Consented analytics helps us understand which routes and pages are useful and improve the site.'],
        },
        {
          title: 'Browser storage',
          paragraphs: [
            'In addition to cookies, local storage may remember the selected theme and, for signed-in users, an authentication token, session state, basic profile details, and dashboard convenience data. These items remain on that browser until they are replaced, you sign out where applicable, or you clear site data; authentication tokens also have a server-controlled expiry. After analytics consent, session storage temporarily keeps limited visit attribution until the tab is closed or consent is withdrawn.',
            'Production requests are stored on the site server and do not need a full browser copy. A local or offline demonstration fallback may keep local dashboard copies when the server mode is unavailable. Clearing browser site data removes those local copies but does not delete information already received by the server.',
          ],
        },
        {
          title: 'Analytics choices',
          paragraphs: [
            'Analytics is optional. It starts only after you actively choose “Accept analytics” or enable it in cookie settings. Choosing “Essential only” does not limit access to tours, photos, guides, or the request form. We respect a browser Do Not Track setting by keeping analytics off.',
            'We do not sell analytics data, build advertising audiences, use cross-site advertising pixels, fingerprint devices, record sessions, or make automated decisions about you.',
          ],
        },
        {
          title: 'Sharing and service providers',
          paragraphs: [
            'Website hosting and the site backend process information to operate the site. When you submit a trip request, the team may receive an internal Telegram notification so it can respond promptly. If you choose WhatsApp, Telegram, email, Instagram, or another external contact channel, that provider processes the conversation under its own terms. Route maps use OpenStreetMap tiles when the map section is loaded.',
            'We share information only when needed to operate the requested service, work with a trip supplier after you decide to proceed, comply with law, or protect the site and travelers. We do not sell personal information.',
          ],
        },
        {
          title: 'Retention and security',
          paragraphs: [
            'Recent session-level analytics events are retained for up to 7 days. Compact daily totals without the session identifier may be retained for up to 13 months. This reduces storage while preserving trend information.',
            'Tour requests, accounts, reviews, seller proposals, and uploaded files are kept for as long as reasonably needed to provide the feature, answer or document a request, moderate content, prevent misuse, or meet legal obligations. We use access controls and reasonable technical safeguards, but no internet service can guarantee absolute security.',
          ],
        },
        {
          title: 'Your choices and rights',
          paragraphs: [
            'You can withdraw analytics consent at any time through cookie settings; this stops future analytics and removes the analytics session cookie and temporary attribution storage. You can clear local storage through your browser controls. Depending on applicable law, you may request access, correction, deletion, restriction, or objection to processing of your personal information, including an account, request, review, or seller proposal.',
          ],
        },
        {
          title: 'Changes to this policy',
          paragraphs: ['We may update this policy when site features or legal requirements change. The date above shows the latest version.'],
        },
      ],
      cookieTable: {
        title: 'Cookies and browser storage',
        columns: ['Name', 'Type', 'Purpose', 'Duration'],
        rows: [
          ['gkt_cookie_consent', 'Essential, first-party', 'Remembers your analytics choice.', 'Up to 13 months'],
          ['gkt_analytics_session', 'Analytics, first-party', 'Groups consented events from one visit.', '30 minutes, renewed while active'],
          ['gkt_analytics_attribution_v1', 'Analytics, session storage', 'Temporarily remembers landing pathname, external referrer host, and limited UTM attribution after consent.', 'Until the tab closes or analytics consent is withdrawn'],
          ['go-kyrgyzstan-travel-theme', 'Functional, local storage', 'Remembers the selected display theme.', 'Until changed or browser data is cleared'],
          ['Account session and token', 'Essential account local storage', 'Keeps a signed-in account session on this browser.', 'Until sign-out, expiry, or browser data is cleared'],
          ['Profile and dashboard data', 'Functional local storage', 'Prefills account details and supports dashboard convenience or local fallback features.', 'Until updated or browser data is cleared'],
        ],
      },
    },
    terms: {
      eyebrow: 'Website terms',
      title: 'Terms of Use',
      description: 'How enquiries, written quotations and booking confirmation work, plus the rules for using Kyrgyz.tours — Go Kyrgyzstan Travel.',
      updated: 'Last updated: 9 September 2026',
      back: 'Browse tours',
      contact: 'Ask a trip question',
      sections: [
        {
          title: 'Using this website',
          paragraphs: ['You may use this website to explore Kyrgyzstan travel information and ask about private or small-group trips. Do not misuse the site, interfere with its operation, attempt unauthorized access, or submit false, harmful, or unlawful content.'],
        },
        {
          id: 'booking',
          title: 'Requests are not bookings',
          paragraphs: ['A website request is an enquiry only. It does not confirm a tour, transport, accommodation, price, payment, or availability. A booking is confirmed only after the itinerary, price, terms, and payment arrangements have been agreed with the team in writing.'],
        },
        {
          title: 'What happens after your enquiry',
          paragraphs: ['The team replies through the WhatsApp number, Telegram username or email address you selected. We discuss your dates, group size, experience and accommodation preferences before preparing a proposal. This website does not collect trip payments.'],
          bullets: ['First: discuss the route and check availability for your dates.', 'Next: review a written itinerary and itemised quotation, including inclusions, exclusions, currency, group size and the trip organiser.', 'Before paying: agree the deposit, balance deadline, cancellation conditions and payment recipient in writing.', 'Finally: obtain written booking confirmation. Sending the form or selecting a calendar date alone does not reserve places.'],
        },
        {
          id: 'changes-and-cancellation',
          title: 'Changes, cancellations and refunds',
          paragraphs: ['There is no single deposit amount or cancellation schedule published for every route on this website. The conditions depend on the agreed trip and its suppliers; do not assume that a deposit or payment is refundable.', 'Before committing, ask for the applicable cancellation deadlines, charges and any refundable amounts in your written proposal. Also clarify what happens if the organiser cancels, a road closes, or weather prevents an activity, and how any agreed refund would be paid and within what timeframe.', 'To request a change or cancellation, write to the team through your existing trip conversation and include your request or booking reference. Ask for written acknowledgement and the effect on your itinerary and price before accepting a replacement. These planning notes do not replace the terms of your individual booking or any mandatory rights.'],
        },
        {
          title: 'Prices, routes, and availability',
          paragraphs: ['Displayed prices, durations, photos, route ideas, and seasonal notes are informational and may change. Weather, road conditions, permits, suppliers, group size, and safety considerations can require a route, timing, service, or price change. We will discuss material changes before confirmation where reasonably possible.'],
        },
        {
          title: 'Traveler responsibilities',
          paragraphs: ['You are responsible for providing accurate travel details and for checking passport, visa, health, insurance, and safety requirements that apply to you. Mountain travel can involve changing weather, altitude, road delays, riding, hiking, and other inherent risks. Tell the team about relevant accessibility, health, dietary, or experience requirements before booking.'],
        },
        {
          title: 'Third-party services',
          paragraphs: ['Transport, accommodation, guides, and other services may be provided by independent local suppliers. Their service conditions can apply in addition to the written trip agreement. External websites and messaging platforms are governed by their own terms and privacy policies.'],
        },
        {
          title: 'Content and liability',
          paragraphs: ['The site content is provided in good faith for general travel planning. To the extent permitted by applicable law, Go Kyrgyzstan Travel is not responsible for indirect loss arising solely from use of the website or reliance on preliminary information. Nothing in these terms limits rights that cannot legally be limited.'],
        },
        {
          title: 'Applicable law and updates',
          paragraphs: ['These terms are governed by the laws applicable to the site operator in the Kyrgyz Republic, unless mandatory law in your country provides otherwise. We may update these terms when the website or services change; the date above shows the latest version.'],
        },
      ],
    },
  },
  ru: {
    privacy: {
      eyebrow: 'Конфиденциальность и cookies',
      title: 'Политика конфиденциальности и cookies',
      description: 'Как Go Kyrgyzstan Travel обрабатывает заявки, аккаунты, first-party аналитику, cookies и настройки приватности.',
      updated: 'Обновлено: 13 августа 2026 года',
      back: 'К турам',
      contact: 'Написать по вопросу конфиденциальности',
      manageCookies: 'Управлять cookies',
      sections: [
        {
          title: 'Кто отвечает за сайт',
          paragraphs: ['Сайт Go Kyrgyzstan Travel ведёт Jakypbekov Insan в Бишкеке, Кыргызстан. По вопросам конфиденциальности используйте форму заявки и укажите в сообщении «Вопрос конфиденциальности».'],
        },
        {
          title: 'Какие данные мы собираем',
          paragraphs: [
            'Когда вы отправляете заявку, мы получаем указанные вами данные: имя, страну проживания, предпочтительный способ связи, контакты, даты поездки, размер группы, интересующие маршруты и сообщение. Сервер также получает сетевой адрес для защиты и ограничения злоупотреблений и сохраняет исходный IP вместе с заявкой.',
            'При создании аккаунта обрабатываются имя, email, выбранная роль покупателя или продавца, идентификатор аккаунта и защищённый хеш пароля. Пароль в читаемом виде на сервере не хранится.',
            'Отзыв содержит указанное имя, оценку и комментарий и может быть опубликован после модерации. Предложение продавца может содержать контакты, описание тура, маршрут, цену и загруженные изображения; одобренные материалы могут стать публичным контентом тура.',
            'После согласия собираются ограниченные аналитические данные: просмотренные страницы, клики по карточкам и контактам, глубина чтения, результаты этапов отправки заявки, категория устройства (mobile, tablet или desktop), первый посадочный pathname, hostname внешнего источника, UTM source, medium и campaign, а также случайный first-party идентификатор сессии. Полный URL источника и его query не собираются. Значения полей заявки, email, телефон, Telegram username, рекламные идентификаторы и точная геолокация в аналитику не передаются.',
          ],
        },
        {
          title: 'Зачем мы используем данные',
          paragraphs: ['Детали заявки используются для общения, подготовки маршрута или расчёта, организации бронирования при вашем дальнейшем решении, защиты сайта от злоупотреблений и выполнения требований закона. Данные аккаунтов, отзывов и предложений продавцов обеспечивают работу кабинета и модерации. Аналитика по согласию помогает понять интерес к страницам и турам.'],
        },
        {
          title: 'Хранение данных в браузере',
          paragraphs: [
            'Кроме cookies, local storage может запоминать выбранную тему, а для авторизованных пользователей — токен, состояние сессии, основные данные профиля и вспомогательные данные кабинета. Они остаются в этом браузере, пока не будут заменены, пока вы не выйдете из аккаунта там, где это применимо, или не очистите данные сайта; срок токена также ограничивается сервером. После согласия на аналитику session storage временно хранит ограниченную атрибуцию визита до закрытия вкладки или отзыва согласия.',
            'В рабочей версии заявки хранятся на сервере, и полная копия заявки в браузере не требуется. Локальный или offline-режим для демонстрации может хранить копии кабинета, когда серверный режим недоступен. Очистка данных браузера удаляет локальные копии, но не удаляет сведения, уже полученные сервером.',
          ],
        },
        {
          title: 'Выбор аналитики',
          paragraphs: [
            'Аналитика необязательна. Она включается только после выбора «Принять аналитику» или включения в настройках cookies. Выбор «Только обязательные» не ограничивает доступ к турам, фото, статьям и форме заявки. Мы соблюдаем настройку браузера Do Not Track и не включаем аналитику при её наличии.',
            'Мы не продаём аналитические данные, не создаём рекламные аудитории, не используем рекламные пиксели других сайтов, fingerprinting, запись экрана или автоматические решения о вас.',
          ],
        },
        {
          title: 'Передача данных и сервисы',
          paragraphs: [
            'Хостинг и сервер сайта обрабатывают данные для его работы. После отправки заявки команда может получить внутреннее уведомление в Telegram, чтобы быстрее ответить. Если вы выбираете WhatsApp, Telegram, email, Instagram или другой внешний канал, переписка обрабатывается по правилам соответствующего сервиса. При загрузке карты маршрута используются тайлы OpenStreetMap.',
            'Мы передаём данные только когда это нужно для оказания запрошенной услуги, работы с поставщиком после вашего решения продолжить бронирование, исполнения закона или защиты сайта и путешественников. Мы не продаём персональные данные.',
          ],
        },
        {
          title: 'Срок хранения и безопасность',
          paragraphs: [
            'Недавние аналитические события на уровне сессии хранятся до 7 дней. Компактные дневные итоги без идентификатора сессии могут храниться до 13 месяцев. Это уменьшает объём хранилища, сохраняя данные о тенденциях.',
            'Заявки, аккаунты, отзывы, предложения продавцов и загруженные файлы хранятся столько, сколько разумно необходимо для работы функции, ответа или документирования заявки, модерации, защиты от злоупотреблений либо выполнения требований закона. Мы используем контроль доступа и разумные технические меры защиты, но абсолютную безопасность в интернете гарантировать нельзя.',
          ],
        },
        {
          title: 'Ваши права и выбор',
          paragraphs: ['Вы можете в любой момент отозвать согласие на аналитику в настройках cookies: новые аналитические события остановятся, cookie сессии и временная атрибуция будут удалены. Local storage можно очистить через настройки браузера. В зависимости от применимого законодательства вы можете запросить доступ, исправление, удаление, ограничение или возражение против обработки персональных данных, включая аккаунт, заявку, отзыв или предложение продавца.'],
        },
        {
          title: 'Изменения политики',
          paragraphs: ['Мы можем обновлять эту политику при изменении сайта или требований закона. Дата выше показывает актуальную версию.'],
        },
      ],
      cookieTable: {
        title: 'Cookies и хранилище браузера',
        columns: ['Название', 'Тип', 'Назначение', 'Срок'],
        rows: [
          ['gkt_cookie_consent', 'Обязательный, first-party', 'Запоминает выбор аналитики.', 'До 13 месяцев'],
          ['gkt_analytics_session', 'Аналитический, first-party', 'Связывает разрешённые события одной сессии.', '30 минут, продлевается при активности'],
          ['gkt_analytics_attribution_v1', 'Аналитический, session storage', 'После согласия временно запоминает посадочный pathname, hostname внешнего источника и ограниченную UTM-атрибуцию.', 'До закрытия вкладки или отзыва согласия на аналитику'],
          ['go-kyrgyzstan-travel-theme', 'Функциональный, local storage', 'Запоминает выбранную тему оформления.', 'До изменения или очистки данных браузера'],
          ['Сессия и токен аккаунта', 'Обязательный local storage аккаунта', 'Сохраняет вход в аккаунт на этом браузере.', 'До выхода, истечения срока или очистки данных браузера'],
          ['Профиль и данные кабинета', 'Функциональный local storage', 'Подставляет данные профиля и поддерживает удобство кабинета или локальный резервный режим.', 'До обновления или очистки данных браузера'],
        ],
      },
    },
    terms: {
      eyebrow: 'Правила сайта',
      title: 'Условия использования',
      description: 'Как проходят заявка, письменный расчёт и подтверждение поездки, а также правила использования Kyrgyz.tours — Go Kyrgyzstan Travel.',
      updated: 'Обновлено: 9 сентября 2026 года',
      back: 'Смотреть туры',
      contact: 'Задать вопрос о поездке',
      sections: [
        {
          title: 'Использование сайта',
          paragraphs: ['Сайт можно использовать для изучения путешествий по Кыргызстану и отправки запросов о частных или небольших групповых поездках. Нельзя нарушать работу сайта, пытаться получить несанкционированный доступ или отправлять ложный, вредоносный либо незаконный контент.'],
        },
        {
          id: 'booking',
          title: 'Заявка не является бронированием',
          paragraphs: ['Заявка с сайта — это только запрос. Она не подтверждает тур, транспорт, размещение, цену, оплату или наличие мест. Бронирование подтверждается только после письменного согласования маршрута, стоимости, условий и оплаты с командой.'],
        },
        {
          title: 'Что происходит после заявки',
          paragraphs: ['Команда отвечает по выбранному вами WhatsApp, Telegram или email. До подготовки предложения мы обсуждаем даты, число гостей, опыт и пожелания к размещению. На этом сайте оплата поездок не принимается.'],
          bullets: ['Сначала обсуждаем маршрут и проверяем доступность на ваши даты.', 'Затем вы рассматриваете письменную программу и подробный расчёт: состав услуг, исключения, валюту, размер группы и организатора поездки.', 'До оплаты согласуйте письменно предоплату, срок внесения остатка, условия отмены и получателя платежа.', 'Получите письменное подтверждение бронирования. Отправка формы или выбор даты в календаре сами по себе не резервируют места.'],
        },
        {
          id: 'changes-and-cancellation',
          title: 'Изменения, отмена и возврат',
          paragraphs: ['На сайте не опубликован единый размер предоплаты или график отмены для всех маршрутов. Условия зависят от согласованной поездки и поставщиков; не считайте предоплату или платёж автоматически возвратными.', 'До принятия обязательств запросите в письменном предложении сроки отмены, удержания и возвращаемые суммы. Также уточните порядок действий при отмене организатором, закрытии дороги или невозможности провести активность из-за погоды, способ и срок любого согласованного возврата.', 'Для изменения или отмены напишите команде в существующей переписке о поездке и укажите номер заявки или бронирования. Попросите письменное подтверждение получения запроса и влияния изменений на программу и стоимость, прежде чем принимать замену. Эти пояснения не заменяют условия конкретного бронирования и обязательные права по закону.'],
        },
        {
          title: 'Цены, маршруты и доступность',
          paragraphs: ['Цены, длительность, фотографии, идеи маршрутов и сезонные рекомендации имеют справочный характер и могут меняться. Погода, состояние дорог, разрешения, поставщики, размер группы и требования безопасности могут повлиять на маршрут, сроки, услуги или стоимость. Существенные изменения по возможности согласуются до подтверждения.'],
        },
        {
          title: 'Ответственность путешественника',
          paragraphs: ['Вы отвечаете за точность данных о поездке и проверку требований к паспорту, визе, здоровью и страховке. Горные поездки связаны с изменением погоды, высотой, задержками на дорогах, верховой ездой, треккингом и другими естественными рисками. До бронирования сообщите команде о важных требованиях к здоровью, питанию, доступности и опыте.'],
        },
        {
          title: 'Сторонние услуги',
          paragraphs: ['Транспорт, размещение, гиды и другие услуги могут предоставляться независимыми местными поставщиками. Их условия могут применяться дополнительно к письменному соглашению о поездке. Внешние сайты и мессенджеры регулируются собственными условиями и политиками конфиденциальности.'],
        },
        {
          title: 'Контент и ответственность',
          paragraphs: ['Материалы сайта предоставляются добросовестно для общего планирования путешествия. В пределах, разрешённых законом, Go Kyrgyzstan Travel не отвечает за косвенный ущерб, возникший только из-за использования сайта или опоры на предварительную информацию. Это не ограничивает права, которые нельзя ограничить по закону.'],
        },
        {
          title: 'Применимое право и обновления',
          paragraphs: ['Эти условия регулируются правом, применимым к оператору сайта в Кыргызской Республике, если обязательное право вашей страны не устанавливает иное. Мы можем обновлять условия при изменении сайта или услуг; дата выше показывает актуальную версию.'],
        },
      ],
    },
  },
};

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const { hash } = useLocation();
  const locale = useSiteLocale();
  const text = copy[locale][kind];
  const isPrivacy = kind === 'privacy';
  const basePath = isPrivacy ? '/privacy-policy' : '/terms-of-use';
  const path = localizedPath(basePath, locale);
  const toursPath = localizedPath('/tours', locale);
  const feedbackPath = localizedPath('/feedback', locale);
  const Icon = isPrivacy ? ShieldCheck : FileCheck2;

  useEffect(() => {
    if (!['#booking', '#changes-and-cancellation', '#cookies'].includes(hash)) return;
    // This route is lazy-loaded; the router's global top reset runs before its
    // section exists. Resolve the target after this page has mounted.
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, kind, locale]);

  return (
    <section className="editorial-content-page bg-background">
      <SEO
        title={text.title}
        description={text.description}
        path={path}
        language={locale}
        alternates={localeAlternates(basePath)}
        jsonLd={breadcrumbJsonLd([
          { name: locale === 'ru' ? 'Главная' : 'Home', path: localizedPath('/', locale) },
          { name: text.title, path },
        ])}
      />

      <div className="page-editorial-hero border-b border-border bg-muted/60 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 text-secondary">
            <Icon className="h-6 w-6" aria-hidden="true" />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">{text.eyebrow}</p>
          </div>
          <h1 className="mt-4 text-4xl text-foreground sm:text-5xl">{text.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{text.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">{text.updated}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {isPrivacy && text.manageCookies && (
              <Button type="button" className="btn-micro btn-action" onClick={openCookieSettings}>
                {text.manageCookies}
              </Button>
            )}
            <Button asChild type="button" variant="outline" className="btn-micro">
              <Link to={toursPath}>{text.back}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
        {text.sections.slice(0, 4).map((section) => (
          <PolicySection key={section.title} section={section} />
        ))}

        {isPrivacy && text.cookieTable && (
          <section id="cookies" className="scroll-mt-24 rounded-md border border-border bg-card p-6 sm:p-8">
            <h2 className="text-2xl text-foreground">{text.cookieTable.title}</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {text.cookieTable.columns.map((column) => <th key={column} className="px-3 py-3 font-medium">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {text.cookieTable.rows.map((row) => (
                    <tr key={row[0]} className="border-b border-border/70 align-top last:border-0">
                      {row.map((value, index) => <td key={`${row[0]}-${index}`} className="px-3 py-4 text-muted-foreground">{value}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {text.sections.slice(4).map((section) => (
          <PolicySection key={section.title} section={section} />
        ))}

        <section className="rounded-md border border-border bg-muted/50 p-6 sm:p-8">
          <h2 className="text-2xl text-foreground">{text.contact}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{locale === 'ru' ? 'Напишите нам через форму: команда ответит по удобному каналу связи.' : 'Use the request form and the team will reply through your preferred contact channel.'}</p>
          <Button asChild className="mt-5 btn-micro">
            <Link to={feedbackPath}>{locale === 'ru' ? 'Открыть форму' : 'Open request form'}</Link>
          </Button>
        </section>
      </div>
    </section>
  );
}

function PolicySection({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="text-2xl text-foreground">{section.title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-muted-foreground">
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.bullets && (
          <ul className="list-disc space-y-2 pl-5">
            {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}

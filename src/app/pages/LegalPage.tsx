import { Link } from 'react-router-dom';
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
      description: 'How Go Kyrgyzstan Travel handles trip requests, anonymous analytics, cookies, and privacy choices.',
      updated: 'Last updated: 9 August 2026',
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
            'When you send a tour request, we collect the details you choose to provide: name, country of residence, preferred contact channel, contact details, travel dates, group size, route interests, and message. We use this information to answer your request and plan a possible trip.',
            'If you opt in to analytics, we collect anonymous activity data: pages viewed, clicks on tour cards and contact actions, scroll depth, technical screen size, selected site theme, and a random first-party session identifier. The analytics stream does not include form answers, email addresses, phone numbers, Telegram usernames, advertising identifiers, or precise location.',
          ],
        },
        {
          title: 'Why we use information',
          paragraphs: ['We use request details to communicate with you, prepare an itinerary or quotation, manage a booking if you choose to proceed, protect the site from misuse, and meet applicable legal obligations. We use consented anonymous analytics to understand which routes and pages are useful and to improve the site.'],
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
            'Anonymous analytics events are retained for up to 13 months. Tour requests are kept for as long as reasonably needed to answer, plan, manage, or document the request, unless a longer period is required by law. We use access controls and reasonable technical safeguards, but no internet service can guarantee absolute security.',
          ],
        },
        {
          title: 'Your choices and rights',
          paragraphs: [
            'You can withdraw analytics consent at any time through cookie settings; this stops future analytics and removes the analytics session cookie. Depending on applicable law, you may request access, correction, deletion, restriction, or objection to processing of your personal information. You may also ask for information about how your request data is handled.',
          ],
        },
        {
          title: 'Changes to this policy',
          paragraphs: ['We may update this policy when site features or legal requirements change. The date above shows the latest version.'],
        },
      ],
      cookieTable: {
        title: 'Cookies and similar storage',
        columns: ['Name', 'Type', 'Purpose', 'Duration'],
        rows: [
          ['gkt_cookie_consent', 'Essential, first-party', 'Remembers your analytics choice.', 'Up to 13 months'],
          ['gkt_analytics_session', 'Analytics, first-party', 'Groups anonymous events from one visit after consent.', '30 minutes, renewed while active'],
          ['sidebar_state', 'Functional, first-party', 'Remembers the sidebar state for signed-in dashboard users.', 'Up to 7 days'],
        ],
      },
    },
    terms: {
      eyebrow: 'Website terms',
      title: 'Terms of Use',
      description: 'Rules for using the Go Kyrgyzstan Travel website and requesting travel information.',
      updated: 'Last updated: 9 August 2026',
      back: 'Browse tours',
      contact: 'Ask a trip question',
      sections: [
        {
          title: 'Using this website',
          paragraphs: ['You may use this website to explore Kyrgyzstan travel information and ask about private or small-group trips. Do not misuse the site, interfere with its operation, attempt unauthorized access, or submit false, harmful, or unlawful content.'],
        },
        {
          title: 'Requests are not bookings',
          paragraphs: ['A website request is an enquiry only. It does not confirm a tour, transport, accommodation, price, payment, or availability. A booking is confirmed only after the itinerary, price, terms, and payment arrangements have been agreed with the team in writing.'],
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
      description: 'Как Go Kyrgyzstan Travel обрабатывает заявки, анонимную аналитику, cookies и настройки приватности.',
      updated: 'Обновлено: 9 августа 2026 года',
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
            'Когда вы отправляете заявку, мы получаем только указанные вами данные: имя, страну проживания, предпочтительный способ связи, контакты, даты поездки, размер группы, интересующие маршруты и сообщение. Эти данные нужны, чтобы ответить и предложить поездку.',
            'После согласия на аналитику собираются анонимные данные: просмотренные страницы, клики по карточкам туров и контактам, глубина чтения, технический размер экрана, выбранная тема и случайный first-party идентификатор сессии. В аналитику не попадают ответы формы, email, номер телефона, Telegram username, рекламные идентификаторы и точная геолокация.',
          ],
        },
        {
          title: 'Зачем мы используем данные',
          paragraphs: ['Детали заявки используются для общения, подготовки маршрута или расчёта, организации бронирования при вашем дальнейшем решении, защиты сайта от злоупотреблений и выполнения требований закона. Анонимная аналитика по согласию помогает понять интерес к страницам и турам.'],
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
          paragraphs: ['Анонимные аналитические события хранятся до 13 месяцев. Заявки на тур хранятся столько, сколько разумно необходимо для ответа, планирования, ведения заявки или документации, если закон не требует большего срока. Мы используем контроль доступа и разумные технические меры защиты, но абсолютную безопасность в интернете гарантировать нельзя.'],
        },
        {
          title: 'Ваши права и выбор',
          paragraphs: ['Вы можете в любой момент отозвать согласие на аналитику в настройках cookies: новые аналитические события остановятся, а cookie сессии будет удалён. В зависимости от применимого законодательства вы можете запросить доступ, исправление, удаление, ограничение или возражение против обработки персональных данных.'],
        },
        {
          title: 'Изменения политики',
          paragraphs: ['Мы можем обновлять эту политику при изменении сайта или требований закона. Дата выше показывает актуальную версию.'],
        },
      ],
      cookieTable: {
        title: 'Cookies и похожие технологии хранения',
        columns: ['Название', 'Тип', 'Назначение', 'Срок'],
        rows: [
          ['gkt_cookie_consent', 'Обязательный, first-party', 'Запоминает выбор аналитики.', 'До 13 месяцев'],
          ['gkt_analytics_session', 'Аналитический, first-party', 'Связывает анонимные события одной сессии после согласия.', '30 минут, продлевается при активности'],
          ['sidebar_state', 'Функциональный, first-party', 'Запоминает состояние панели у авторизованных пользователей.', 'До 7 дней'],
        ],
      },
    },
    terms: {
      eyebrow: 'Правила сайта',
      title: 'Условия использования',
      description: 'Правила использования сайта Go Kyrgyzstan Travel и отправки запросов на путешествия.',
      updated: 'Обновлено: 9 августа 2026 года',
      back: 'Смотреть туры',
      contact: 'Задать вопрос о поездке',
      sections: [
        {
          title: 'Использование сайта',
          paragraphs: ['Сайт можно использовать для изучения путешествий по Кыргызстану и отправки запросов о частных или небольших групповых поездках. Нельзя нарушать работу сайта, пытаться получить несанкционированный доступ или отправлять ложный, вредоносный либо незаконный контент.'],
        },
        {
          title: 'Заявка не является бронированием',
          paragraphs: ['Заявка с сайта — это только запрос. Она не подтверждает тур, транспорт, размещение, цену, оплату или наличие мест. Бронирование подтверждается только после письменного согласования маршрута, стоимости, условий и оплаты с командой.'],
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
  const locale = useSiteLocale();
  const text = copy[locale][kind];
  const isPrivacy = kind === 'privacy';
  const basePath = isPrivacy ? '/privacy-policy' : '/terms-of-use';
  const path = localizedPath(basePath, locale);
  const toursPath = localizedPath('/tours', locale);
  const feedbackPath = localizedPath('/feedback', locale);
  const Icon = isPrivacy ? ShieldCheck : FileCheck2;

  return (
    <section className="bg-background">
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

      <div className="border-b border-border bg-muted/60 px-4 py-14 sm:px-6 lg:px-8">
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
          <section id="cookies" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8">
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

        <section className="rounded-2xl border border-border bg-muted/50 p-6 sm:p-8">
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

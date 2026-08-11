import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentFilePath);
const rootDir = path.resolve(scriptsDir, '..');

// Verified against https://kyrgyzriders.com/tours/ on 2026-07-30.
// The wording and visual identity below are original for kyrgyz.tours.
const catalog = [
  ['Song-Köl & Altyn-Arashan Adventure', 'Приключение: Сон-Куль и Алтын-Арашан', 7, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Issyk-Kol', 'Altyn-Arashan'], 10],
  ['Kyzart to Song-Köl Horseback Escape', 'Конный маршрут Кызарт — Сон-Куль', 3, 'horse', 'May to October', ['Kyzart', 'Kilemche Valley', 'Song-Kol Lake'], 32],
  ['Kyrgyzstan Highlights in a Week', 'Главные места Кыргызстана за неделю', 7, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol'], 44],
  ['Song-Köl Overnight Horseback Ride', 'Конная поездка к Сон-Кулю с ночёвкой', 2, 'horse', 'May to October', ['Kyzart', 'Song-Kol Lake'], 52],
  ['Issyk-Köl & Song-Köl Road Journey', 'Автопутешествие: Иссык-Куль и Сон-Куль', 3, 'road', 'May to October', ['Bishkek', 'Issyk-Kol', 'Song-Kol Lake'], 71],
  ['Winter Ride to Frozen Song-Köl', 'Зимний конный маршрут к замёрзшему Сон-Кулю', 3, 'winter', 'November to April', ['Kyzart', 'Song-Kol Lake'], 15],
  ['Issyk-Köl Scenic Circuit', 'Панорамный маршрут вокруг Иссык-Куля', 3, 'road', 'All year round', ['Bishkek', 'Issyk-Kol', 'Karakol'], 8],
  ['Easygoing Kyrgyzstan Family Journey', 'Семейное путешествие по Кыргызстану', 4, 'road', 'May to October', ['Bishkek', 'Chon-Kemin', 'Issyk-Kol', 'Song-Kol Lake'], 31],
  ['Kilemche and Song-Köl Horse Trek', 'Конный поход Килемче и Сон-Куль', 4, 'horse', 'May to October', ['Kyzart', 'Kilemche Valley', 'Song-Kol Lake'], 51],
  ['Issyk-Köl Gorges & Hot Springs', 'Иссык-Куль: ущелья и горячие источники', 4, 'road', 'April to November', ['Bishkek', 'Issyk-Kol', 'Skazka Canyon', 'Karakol', 'Altyn-Arashan'], 1],
  ['Song-Köl & Kel-Suu Express', 'Экспресс: Сон-Куль и Кель-Суу', 4, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol'], 54],
  ['Lakes and Highlands of Kyrgyzstan', 'Озёра и высокогорья Кыргызстана', 5, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Issyk-Kol', 'Altyn-Arashan'], 37],
  ['Song-Köl Horse Ride & South Shore', 'Конный маршрут Сон-Куль и южный берег Иссык-Куля', 5, 'horse', 'May to October', ['Kyzart', 'Song-Kol Lake', 'Issyk-Kol South Shore'], 47],
  ['Nomad Trails Horseback Journey', 'Конное путешествие по кочевым тропам', 5, 'horse', 'June to September', ['Kyzart', 'Remote Valleys', 'Song-Kol Lake'], 50],
  ['Kel-Suu & Song-Köl Explorer', 'Исследовательский маршрут: Кель-Суу и Сон-Куль', 5, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol'], 60],
  ['Active Song-Köl and Altyn-Arashan', 'Активный маршрут: Сон-Куль и Алтын-Арашан', 5, 'active', 'May to October', ['Kyzart', 'Song-Kol Lake', 'Issyk-Kol', 'Altyn-Arashan'], 26],
  ['Four Days to Song-Köl on Horseback', 'Четыре дня верхом к Сон-Кулю', 6, 'horse', 'May to October', ['Kyzart', 'Kilemche Valley', 'Song-Kol Lake', 'Issyk-Kol'], 53],
  ['Active Highlands: Song-Köl & Altyn-Arashan', 'Активное высокогорье: Сон-Куль и Алтын-Арашан', 6, 'active', 'May to October', ['Kyzart', 'Song-Kol Lake', 'Issyk-Kol', 'Altyn-Arashan'], 55],
  ['Remote Valleys Horseback Expedition', 'Конная экспедиция по удалённым долинам', 6, 'horse', 'May to September', ['Kyzart', 'Remote Valleys', 'Song-Kol Lake'], 56],
  ['Quiet Valleys of Kyrgyzstan Road Trip', 'Автопутешествие по тихим долинам Кыргызстана', 7, 'road', 'June to September', ['Bishkek', 'Kochkor', 'Song-Kol Lake', 'Issyk-Kol', 'Village Stays'], 70],
  ['Comfortable Kyrgyzstan Discovery', 'Комфортное знакомство с Кыргызстаном', 7, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Issyk-Kol', 'Altyn-Arashan'], 9],
  ['Song-Köl Horseback & Ala-Köl Trek', 'Конный Сон-Куль и трек к Ала-Кулю', 7, 'active', 'June to September', ['Kyzart', 'Song-Kol Lake', 'Ala-Kol Lake', 'Altyn-Arashan'], 25],
  ['Grand Song-Köl Horseback Route', 'Большой конный маршрут к Сон-Кулю', 7, 'horse', 'May to October', ['Kyzart', 'Kilemche Valley', 'Song-Kol Lake', 'Issyk-Kol'], 45],
  ['Kyrgyzstan Lakes & Passes Road Trip', 'Автопутешествие по озёрам и перевалам Кыргызстана', 7, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Altyn-Arashan'], 24],
  ['Song-Köl to Kol-Ukok Horse Trails', 'Конные тропы от Сон-Куля к Коль-Укоку', 7, 'horse', 'June to September', ['Song-Kol Lake', 'Kol-Ukok Lake', 'Remote Valleys'], 62],
  ['Eight Days of Active Kyrgyzstan', 'Восемь дней активного Кыргызстана', 8, 'active', 'May to October', ['Kyzart', 'Song-Kol Lake', 'Issyk-Kol', 'Altyn-Arashan'], 43],
  ['Kyrgyzstan Adventure Essentials', 'Главные приключения Кыргызстана', 8, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Altyn-Arashan'], 61],
  ['Village Roads and Nomad Stays', 'Деревенские дороги и кочевые ночёвки', 8, 'road', 'May to October', ['Bishkek', 'Kochkor', 'Song-Kol Lake', 'Issyk-Kol', 'Village Stays'], 74],
  ['Kyrgyzstan Ultimate Lakes Route', 'Большой маршрут по озёрам Кыргызстана', 8, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Altyn-Arashan'], 69],
  ['Kyrgyzstan Lakes & Hot Springs', 'Озёра Кыргызстана и горячие источники', 9, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Altyn-Arashan'], 28],
  ['Best of Kyrgyzstan Active Journey', 'Лучшее в Кыргызстане: активный маршрут', 9, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Altyn-Arashan'], 16],
  ['Kyrgyzstan Road Trip at an Easy Pace', 'Неторопливое автопутешествие по Кыргызстану', 10, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Altyn-Arashan'], 57],
  ['Song-Köl & Ala-Köl Active Expedition', 'Активная экспедиция: Сон-Куль и Ала-Куль', 10, 'active', 'May to October', ['Kyzart', 'Song-Kol Lake', 'Ala-Kol Lake', 'Altyn-Arashan'], 67],
  ['Kyrgyzstan Horseback Adventure Extended', 'Большое конное путешествие по Кыргызстану', 10, 'horse', 'June to September', ['Kyzart', 'Song-Kol Lake', 'Issyk-Kol', 'Ala-Kol Lake', 'Altyn-Arashan'], 65],
  ['Kyrgyzstan Adventure Grand Tour', 'Большое приключение по Кыргызстану', 10, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Ala-Kol Lake'], 76],
  ['Kyrgyzstan Active Explorer', 'Активное исследование Кыргызстана', 11, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Ala-Kol Lake'], 29],
  ['Kyrgyzstan Road Trip Without Rush', 'Неторопливый большой road trip по Кыргызстану', 11, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Altyn-Arashan'], 75],
  ['Grand Kyrgyzstan Road Journey', 'Большое автопутешествие по Кыргызстану', 12, 'road', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Altyn-Arashan'], 63],
  ['Complete Kyrgyzstan Active Expedition', 'Полная активная экспедиция по Кыргызстану', 12, 'active', 'May to October', ['Bishkek', 'Song-Kol Lake', 'Kel-Suu Lake', 'Issyk-Kol', 'Ala-Kol Lake'], 27],
].map(([title, titleRu, days, kind, season, stops, imageIndex]) => ({
  title,
  titleRu,
  days,
  kind,
  season,
  stops,
  imageIndex,
}));

const stopTranslations = {
  Bishkek: 'Бишкек',
  Kyzart: 'Кызарт',
  Kochkor: 'Кочкор',
  'Song-Kol Lake': 'озеро Сон-Куль',
  'Kilemche Valley': 'долина Килемче',
  'Kel-Suu Lake': 'озеро Кель-Суу',
  'Issyk-Kol': 'Иссык-Куль',
  'Issyk-Kol South Shore': 'южный берег Иссык-Куля',
  Karakol: 'Каракол',
  'Chon-Kemin': 'Чон-Кемин',
  'Skazka Canyon': 'каньон Сказка',
  'Altyn-Arashan': 'Алтын-Арашан',
  'Remote Valleys': 'удалённые долины',
  'Village Stays': 'гостевые дома в сёлах',
  'Ala-Kol Lake': 'озеро Ала-Куль',
  'Kol-Ukok Lake': 'озеро Коль-Укок',
};

const coordinates = {
  Bishkek: [42.8746, 74.5698],
  Kyzart: [41.916, 75.615],
  Kochkor: [42.215, 75.756],
  'Song-Kol Lake': [41.807, 75.297],
  'Kel-Suu Lake': [40.938, 76.276],
  'Issyk-Kol': [42.454, 77.185],
  Karakol: [42.49, 78.397],
  'Chon-Kemin': [42.823, 75.72],
  'Skazka Canyon': [41.753, 77.859],
  'Altyn-Arashan': [42.313, 78.526],
  'Ala-Kol Lake': [42.278, 78.517],
  'Kol-Ukok Lake': [42.16, 75.69],
};

const kindCopy = {
  horse: {
    type: 'Horseback Riding', typeRu: 'Конный тур', difficulty: 'Moderate — riding experience is helpful', difficultyRu: 'Средняя — опыт верховой езды будет преимуществом',
    description: 'A private riding journey across high pastures and mountain trails, with the pace adapted to the group and local conditions.',
    descriptionRu: 'Частный конный маршрут по высокогорным пастбищам и горным тропам с темпом, подобранным под группу и условия на месте.',
    highlights: ['Guided horseback riding matched to the route', 'High pastures, passes, and wide mountain views', 'Yurt or family stays where the route allows', 'A local, flexible approach to mountain weather'],
    highlightsRu: ['Конные переходы с местным проводником', 'Высокогорные пастбища, перевалы и панорамы', 'Юрты или семейные гостевые дома по маршруту', 'Гибкий план с учётом погоды в горах'],
  },
  winter: {
    type: 'Winter Horseback Riding', typeRu: 'Зимний конный тур', difficulty: 'Challenging — winter mountain experience required', difficultyRu: 'Сложная — необходим опыт зимних горных поездок',
    description: 'A winter highland journey for prepared riders, built around snow conditions, safety checks, and the frozen landscapes of Song-Köl.',
    descriptionRu: 'Зимнее высокогорное путешествие для подготовленных всадников: маршрут строится с учётом снежных условий, безопасности и пейзажей замёрзшего Сон-Куля.',
    highlights: ['Winter riding planned around snow and safety conditions', 'Frozen highland scenery and quiet yurt stays', 'Local route assessment before each departure', 'A small private format for flexible decisions'],
    highlightsRu: ['Зимние конные переходы с учётом снега и безопасности', 'Замёрзшие высокогорные пейзажи и тёплые юрты', 'Проверка маршрута местной командой перед выездом', 'Небольшой частный формат для гибких решений'],
  },
  road: {
    type: 'Road Trip', typeRu: 'Автопутешествие', difficulty: 'Easy — suitable for most travelers', difficultyRu: 'Лёгкая — подходит большинству путешественников',
    description: 'A private overland route combining scenic drives, mountain lakes, short walks, and local stops at a comfortable, realistic pace.',
    descriptionRu: 'Частный автомобильный маршрут с панорамными дорогами, горными озёрами, короткими прогулками и местными остановками в комфортном, реалистичном темпе.',
    highlights: ['Private transport across Kyrgyzstan’s changing landscapes', 'Mountain lakes, canyons, and panoramic road sections', 'Flexible photo and cultural stops', 'Accommodation planned around sensible driving times'],
    highlightsRu: ['Частный транспорт по меняющимся ландшафтам Кыргызстана', 'Горные озёра, каньоны и панорамные дороги', 'Гибкие фотостопы и культурные остановки', 'Ночёвки с учётом разумного времени в дороге'],
  },
  active: {
    type: 'Active Adventure', typeRu: 'Активное приключение', difficulty: 'Moderate — active days with flexible pacing', difficultyRu: 'Средняя — активные дни с гибким темпом',
    description: 'A varied private adventure that combines road travel with riding or hiking, linking Kyrgyzstan’s best-known mountain regions in one route.',
    descriptionRu: 'Разнообразное частное приключение, в котором автопереезды сочетаются с верховой ездой или треккингом и связывают главные горные регионы Кыргызстана.',
    highlights: ['A balanced mix of driving, riding, and walking', 'Nomadic highlands and alpine lake landscapes', 'Route pacing adapted to the group', 'Local guidance for mountain sections'],
    highlightsRu: ['Сбалансированное сочетание автопереездов, верховой езды и прогулок', 'Кочевые высокогорья и альпийские озёра', 'Темп, адаптированный под вашу группу', 'Местное сопровождение на горных участках'],
  },
};

function joinPlaces(places, language = 'en') {
  const values = language === 'ru' ? places.map((place) => stopTranslations[place] || place) : places;
  if (values.length <= 1) return values[0] || '';
  return `${values.slice(0, -1).join(', ')} ${language === 'ru' ? 'и' : 'and'} ${values.at(-1)}`;
}

function travelImage(index) {
  return `/images/travel-gallery-2026/travel-${String(index).padStart(3, '0')}.jpg`;
}

function itineraryFor(tour, language = 'en') {
  const labels = language === 'ru'
    ? { arrival: 'Старт и знакомство с маршрутом', return: 'Завершение маршрута', travel: 'Переезд к', activity: 'День в', arrivalText: 'Встреча с командой, проверка деталей и выезд в горы. Точный тайминг подтверждаем перед началом поездки.', activityText: 'День проходит в соответствии с погодой, дорожной обстановкой и темпом группы.', returnText: 'Возвращение к финальной точке маршрута или трансфер, согласованный в вашем подтверждённом плане.' }
    : { arrival: 'Arrival and route briefing', return: 'Route completion', travel: 'Travel to', activity: 'Time in', arrivalText: 'Meet the local team, confirm practical details, and begin the journey. The final timing is confirmed before departure.', activityText: 'Today is paced around weather, road conditions, and the group’s comfort.', returnText: 'Return to the final route point or take the transfer agreed in your confirmed plan.' };
  const stops = language === 'ru' ? tour.stops.map((stop) => stopTranslations[stop] || stop) : tour.stops;
  return Array.from({ length: tour.days }, (_, offset) => {
    const day = offset + 1;
    if (day === 1) return { day, title: labels.arrival, description: labels.arrivalText };
    if (day === tour.days) return { day, title: labels.return, description: labels.returnText };
    const stop = stops[Math.min(stops.length - 1, Math.max(1, Math.round((offset / (tour.days - 1)) * (stops.length - 1))))] || stops.at(-1);
    return { day, title: `${labels.travel} ${stop}`, description: `${labels.activity} ${stop}. ${labels.activityText}` };
  });
}

function seasonRu(value) {
  return ({ 'May to October': 'С мая по октябрь', 'April to November': 'С апреля по ноябрь', 'June to September': 'С июня по сентябрь', 'May to September': 'С мая по сентябрь', 'November to April': 'С ноября по апрель', 'All year round': 'Круглый год' })[value] || value;
}

function packingList(kind, language = 'en') {
  const ru = language === 'ru';
  const common = ru ? ['Многослойная одежда для переменчивой погоды', 'Солнцезащита и многоразовая бутылка', 'Удобная закрытая обувь', 'Небольшая аптечка и личные лекарства'] : ['Layered clothing for changing mountain weather', 'Sun protection and a reusable water bottle', 'Comfortable closed footwear', 'A small first-aid kit and personal medication'];
  if (kind === 'horse' || kind === 'winter') return [ru ? 'Удобные брюки для верховой езды' : 'Comfortable riding trousers', ru ? 'Обувь с надёжной фиксацией в стремени' : 'Footwear that stays secure in the stirrup', ...common];
  if (kind === 'active') return [ru ? 'Небольшой рюкзак для активных дней' : 'A small daypack for active days', ru ? 'Куртка от ветра и дождя' : 'A windproof and waterproof layer', ...common];
  return [ru ? 'Лёгкая куртка для прохладных вечеров' : 'A light jacket for cool evenings', ru ? 'Купальник, если в маршруте есть горячие источники' : 'Swimwear if your confirmed route includes hot springs', ...common];
}

function practicalInfo(tour, language = 'en') {
  const ru = language === 'ru';
  const copy = kindCopy[tour.kind];
  return {
    accommodation: ru ? 'Юрты, гостевые дома или отели — по подтверждённому плану' : 'Yurts, guesthouses, or hotels according to the confirmed route',
    meals: ru ? 'Питание и его формат подтверждаются в индивидуальном предложении' : 'Meals and their format are confirmed in your individual quotation',
    difficulty: ru ? copy.difficultyRu : copy.difficulty,
    groupSize: ru ? 'Частный выезд или небольшая группа' : 'Private departure or small group',
    included: ru ? ['Планирование маршрута под вашу группу', 'Местная команда и транспорт согласно подтверждённой программе', 'Проживание согласно бронированию'] : ['Route planning for your group', 'Local team and transport as confirmed in the itinerary', 'Accommodation as confirmed in the booking'],
    notIncluded: ru ? ['Международные перелёты', 'Страховка путешественника', 'Личные расходы и услуги, не указанные в предложении'] : ['International flights', 'Travel insurance', 'Personal costs and services not listed in your quotation'],
  };
}

// These six pages are deliberately more specific than the rest of the catalogue.
// They match book-now searches without inventing routes that are not offered.
const priorityTourContent = {
  2: {
    title: '3-Day Song-Köl Horseback Riding Tour from Kyzart',
    titleRu: 'Конный тур на Сон-Куль из Кызарта — 3 дня',
    description: 'This 3-day Song-Köl horseback riding tour starts in Kyzart and follows the Kilemche Valley into Kyrgyzstan’s high pastures. It is a private or small-group route for travelers who want a real horse trek, a yurt night, and time beside Song-Köl rather than a rushed roadside visit.',
    descriptionRu: 'Этот трёхдневный конный тур на Сон-Куль начинается в Кызарте и проходит через долину Килемче к высокогорным пастбищам Кыргызстана. Это частный маршрут или небольшая группа для тех, кто хочет настоящий конный переход, ночёвку в юрте и время у озера, а не короткую остановку у дороги.',
    highlights: ['Horseback route from Kyzart through the Kilemche Valley', 'One or more nights near Song-Köl in a yurt camp, subject to the confirmed plan', 'A local horseman and a pace adjusted for the group', 'High-pasture views, mountain weather, and nomadic summer landscapes'],
    highlightsRu: ['Конный маршрут из Кызарта через долину Килемче', 'Ночёвка у Сон-Куля в юрточном лагере по подтверждённому плану', 'Местный коневод и темп, подобранный для группы', 'Высокогорные пастбища, переменчивая горная погода и кочевые летние стоянки'],
    itinerary: [
      { day: 1, title: 'Meet in Kyzart and ride toward Kilemche', description: 'Meet the local team in Kyzart, review riding experience and weather, then begin the route toward the Kilemche Valley. The day is paced for the group and the condition of the trail.' },
      { day: 2, title: 'Kilemche Valley to Song-Köl', description: 'Continue on horseback across alpine pasture toward Song-Köl. The exact track and riding time are confirmed locally because mountain weather and ground conditions can change.' },
      { day: 3, title: 'Song-Köl morning and return', description: 'Enjoy a calm morning by the lake before riding back toward Kyzart or taking the return transfer agreed in the confirmed programme.' },
    ],
    itineraryRu: [
      { day: 1, title: 'Встреча в Кызарте и путь к Килемче', description: 'Встреча с местной командой в Кызарте, обсуждение опыта верховой езды и погоды, затем начало пути к долине Килемче. Темп подбирается под группу и состояние тропы.' },
      { day: 2, title: 'Долина Килемче — Сон-Куль', description: 'Продолжение конного перехода по альпийским пастбищам к Сон-Кулю. Точный трек и время в седле подтверждаются на месте: погода и состояние грунта в горах меняются.' },
      { day: 3, title: 'Утро на Сон-Куле и возвращение', description: 'Спокойное утро у озера, затем возвращение верхом к Кызарту или трансфер, указанный в подтверждённой программе.' },
    ],
    seoContent: {
      heading: 'Song-Köl horseback riding from Kyzart: route notes',
      paragraphs: ['Kyzart is a practical trailhead for a Song-Köl horse trek. It gives the group time to meet the horseman and match a horse to each rider before moving into the Kilemche Valley.', 'Song-Köl sits at high altitude, so warm layers, sun protection, closed footwear, and realistic expectations about simple yurt-camp facilities matter. We confirm the camp, road access, and final riding plan before departure rather than promising conditions that depend on the mountains.'],
      faq: [
        { question: 'Do I need previous riding experience?', answer: 'Experience is helpful, but the route can be discussed around the least experienced rider. Tell us honestly how recently and how confidently you have ridden.' },
        { question: 'When is this Song-Köl horse tour available?', answer: 'The normal highland season is May to October, with the exact opening and closing dates dependent on trail, pass, and camp conditions.' },
      ],
    },
    seoContentRu: {
      heading: 'Конный маршрут на Сон-Куль из Кызарта: важные детали',
      paragraphs: ['Кызарт — удобная точка старта для конного похода на Сон-Куль. Здесь группа знакомится с коневодом и подбирает лошадь до выхода в долину Килемче.', 'Сон-Куль находится высоко в горах, поэтому важны тёплые слои одежды, защита от солнца, закрытая обувь и реалистичные ожидания от условий в юрточном лагере. Лагерь, подъезд и финальный план подтверждаются перед выездом.'],
      faq: [
        { question: 'Нужен ли опыт верховой езды?', answer: 'Опыт желателен, но маршрут обсуждаем с учётом самого неопытного участника. Важно честно рассказать, как давно и насколько уверенно вы ездили верхом.' },
        { question: 'Когда проходит конный тур на Сон-Куль?', answer: 'Обычный высокогорный сезон — с мая по октябрь. Точные даты зависят от состояния троп, перевалов и юрточных лагерей.' },
      ],
    },
    relatedTourIds: [4, 9, 13],
  },
  4: {
    title: '2-Day Song-Köl Horseback Riding Tour from Kyzart',
    titleRu: 'Конный тур на Сон-Куль с ночёвкой — 2 дня',
    description: 'A compact 2-day Song-Köl horseback riding tour for travelers short on time who still want to reach the lake on horseback from Kyzart. The route focuses on one overnight highland experience and is planned around actual trail, weather, and rider conditions.',
    descriptionRu: 'Компактный двухдневный конный тур на Сон-Куль для путешественников с ограниченным временем, которые всё равно хотят добраться до озера верхом из Кызарта. Маршрут включает одну высокогорную ночёвку и планируется с учётом реальной погоды, троп и уровня группы.',
    highlights: ['Short Song-Köl horse trek from Kyzart', 'Overnight in the highlands according to the confirmed route', 'A focused option for a private couple, friends, or small group', 'Local route decisions based on weather and riding ability'],
    highlightsRu: ['Короткий конный переход на Сон-Куль из Кызарта', 'Высокогорная ночёвка по подтверждённому маршруту', 'Удобный формат для пары, друзей или небольшой частной группы', 'Решения по маршруту с учётом погоды и уровня верховой езды'],
    itinerary: [
      { day: 1, title: 'Kyzart to the Song-Köl highlands', description: 'After the riding briefing in Kyzart, begin the ascent on the route selected for current conditions. Reach the agreed yurt camp or highland overnight point.' },
      { day: 2, title: 'Morning ride and return to Kyzart', description: 'Take time for the lake and mountain views, then ride back by the route confirmed with the local team. Return timing depends on trail and weather conditions.' },
    ],
    itineraryRu: [
      { day: 1, title: 'Кызарт — высокогорья Сон-Куля', description: 'После инструктажа по верховой езде в Кызарте начинается подъём по маршруту, выбранному по текущим условиям. Ночёвка в согласованном юрточном лагере или высокогорной точке.' },
      { day: 2, title: 'Утренняя прогулка и возвращение в Кызарт', description: 'Время у озера и в горах, затем возвращение верхом по маршруту, подтверждённому с местной командой. Время возвращения зависит от тропы и погоды.' },
    ],
    seoContent: {
      heading: 'A two-day horse trip to Song-Köl: is it the right format?',
      paragraphs: ['This is the shortest horseback option in the catalogue for seeing Song-Köl from the Kyzart side. It works best for guests who accept an active schedule and simple highland accommodation.', 'For more time in the saddle and a slower adjustment to the altitude, the three- or four-day Kyzart routes are a better choice. We will recommend the safer option once we know your riding experience and dates.'],
      faq: [
        { question: 'Can this be done as a private tour?', answer: 'Yes. Send the preferred dates and group size so the local team can confirm horses, camp space, and transport options.' },
        { question: 'What should I bring?', answer: 'Bring layered clothing, rain and sun protection, secure closed shoes, water, and any personal medicine. Even summer evenings can be cold at Song-Köl.' },
      ],
    },
    seoContentRu: {
      heading: 'Двухдневная конная поездка на Сон-Куль: кому подходит',
      paragraphs: ['Это самый короткий конный вариант в каталоге для поездки к Сон-Кулю со стороны Кызарта. Он подходит тем, кто готов к активному графику и простому высокогорному размещению.', 'Если хочется больше времени в седле и более плавно адаптироваться к высоте, лучше выбрать трёх- или четырёхдневный маршрут из Кызарта. После уточнения дат и опыта верховой езды порекомендуем более безопасный вариант.'],
      faq: [
        { question: 'Можно ли провести тур в частном формате?', answer: 'Да. Пришлите даты и размер группы, чтобы местная команда подтвердила лошадей, места в лагере и варианты трансфера.' },
        { question: 'Что взять с собой?', answer: 'Нужны многослойная одежда, защита от дождя и солнца, надёжная закрытая обувь, вода и личные лекарства. Даже летом вечера на Сон-Куле бывают холодными.' },
      ],
    },
    relatedTourIds: [2, 9, 11],
  },
  11: {
    title: '4-Day Kel-Suu and Song-Köl Tour from Bishkek',
    titleRu: 'Тур на Кель-Суу и Сон-Куль из Бишкека — 4 дня',
    description: 'A four-day private Kyrgyzstan road tour linking Kel-Suu and Song-Köl for travelers who want two remote mountain lakes in one itinerary. It is an active road route: final driving times, access, and overnight stops are confirmed around current road and border-zone requirements.',
    descriptionRu: 'Четырёхдневный частный автотур по Кыргызстану, соединяющий Кель-Суу и Сон-Куль для тех, кто хочет увидеть два удалённых горных озера в одной поездке. Это активный маршрут: время в дороге, подъезды и ночёвки подтверждаются с учётом состояния дорог и требований погранзоны.',
    highlights: ['Two signature Naryn-region lakes in one private itinerary', 'Route planning around Kel-Suu access and current road conditions', 'Song-Köl highland scenery and a realistic overnight pace', 'Flexible photo stops and local advice before departure'],
    highlightsRu: ['Два знаковых озера Нарынской области в одном частном маршруте', 'Планирование с учётом подъезда к Кель-Суу и состояния дорог', 'Высокогорные пейзажи Сон-Куля и реалистичный темп с ночёвками', 'Гибкие фотостопы и рекомендации местной команды перед выездом'],
    itinerary: [
      { day: 1, title: 'Bishkek to the Naryn region', description: 'Leave Bishkek for the Naryn region, with the first overnight point arranged around the confirmed route and sensible driving time.' },
      { day: 2, title: 'Kel-Suu access day', description: 'Travel toward Kel-Suu using the access plan confirmed for your date. The lake approach may involve a local transfer, walking, or horse support depending on conditions.' },
      { day: 3, title: 'Song-Köl highlands', description: 'Continue toward Song-Köl for highland scenery and the planned overnight. The route order may change when conditions require a safer or more realistic plan.' },
      { day: 4, title: 'Return toward Bishkek', description: 'Return to Bishkek with breaks planned around road conditions and the group’s pace.' },
    ],
    itineraryRu: [
      { day: 1, title: 'Бишкек — Нарынская область', description: 'Выезд из Бишкека в Нарынскую область. Первая ночёвка планируется с учётом подтверждённого маршрута и разумного времени в дороге.' },
      { day: 2, title: 'День подъезда к Кель-Суу', description: 'Поездка к Кель-Суу по согласованной на ваши даты схеме. Подход к озеру может включать местный трансфер, пеший участок или лошадей — это зависит от условий.' },
      { day: 3, title: 'Высокогорья Сон-Куля', description: 'Переезд к Сон-Кулю ради высокогорных пейзажей и запланированной ночёвки. Порядок точек может измениться, если так безопаснее и реалистичнее.' },
      { day: 4, title: 'Возвращение в Бишкек', description: 'Возвращение в Бишкек с остановками, рассчитанными по дорогам и темпу группы.' },
    ],
    seoContent: {
      heading: 'Kel-Suu and Song-Köl in four days: practical planning',
      paragraphs: ['Kel-Suu is remote and its approach is not a standard city transfer. We check the access route, local rules, and whether any permit or support service is needed for the confirmed dates before accepting a booking.', 'Combining Kel-Suu with Song-Köl makes the journey varied, but it also means long mountain-road days. This route is for travelers who prefer big landscapes and flexible logistics over a resort-style schedule.'],
      faq: [
        { question: 'Is a permit needed for Kel-Suu?', answer: 'Rules and processes can change, so we verify the current requirement for your nationality and dates before the route is confirmed.' },
        { question: 'Is this tour suitable for children?', answer: 'It depends on the children’s age, comfort with long drives, and the selected access plan. Share these details before booking so we can advise honestly.' },
      ],
    },
    seoContentRu: {
      heading: 'Кель-Суу и Сон-Куль за четыре дня: как планировать маршрут',
      paragraphs: ['Кель-Суу находится далеко от крупных городов, и подъезд к нему нельзя считать обычным трансфером. Перед подтверждением заявки мы проверяем дорогу, местные правила и необходимость пропуска или дополнительной поддержки.', 'Сочетание Кель-Суу и Сон-Куля делает поездку насыщенной, но предполагает длинные дни на горных дорогах. Этот маршрут для тех, кто выбирает масштабные пейзажи и гибкую логистику, а не курортный отдых.'],
      faq: [
        { question: 'Нужен ли пропуск на Кель-Суу?', answer: 'Правила могут меняться, поэтому перед подтверждением маршрута проверяем актуальные требования для вашего гражданства и дат.' },
        { question: 'Подходит ли маршрут детям?', answer: 'Это зависит от возраста детей, их отношения к долгим переездам и выбранного способа подъезда. Сообщите детали заранее — честно подскажем, подходит ли формат.' },
      ],
    },
    relatedTourIds: [3, 15, 29],
  },
  10: {
    title: '4-Day Issyk-Köl Tour: Gorges and Hot Springs',
    titleRu: 'Тур на Иссык-Куль: ущелья и горячие источники — 4 дня',
    description: 'This four-day Issyk-Köl tour from Bishkek combines lake scenery with the gorges, canyons, and hot-spring areas of the eastern shore. It is a private road trip with a practical pace, leaving room for photo stops and choosing the best mountain section for the weather.',
    descriptionRu: 'Этот четырёхдневный тур на Иссык-Куль из Бишкека объединяет озёрные пейзажи с ущельями, каньонами и районами горячих источников восточного берега. Это частное автопутешествие в реалистичном темпе, с местом для фотостопов и выбором лучшего горного участка по погоде.',
    highlights: ['Issyk-Köl lake views with a flexible road-trip pace', 'Gorge and canyon stops selected around the confirmed route', 'Karakol-area mountain options and hot-spring planning', 'Private transport for a couple, family, or small group'],
    highlightsRu: ['Виды Иссык-Куля в спокойном темпе автопутешествия', 'Ущелья и каньоны, выбранные под подтверждённый маршрут', 'Горные варианты в районе Каракола и планирование горячих источников', 'Частный транспорт для пары, семьи или небольшой группы'],
    itinerary: [
      { day: 1, title: 'Bishkek to Issyk-Köl', description: 'Travel from Bishkek toward Issyk-Köl, with stops selected for the group and the confirmed shore itinerary.' },
      { day: 2, title: 'Lake shore, canyon, and gorge day', description: 'Explore the selected lakeside and canyon landscapes without rushing every stop. Final timing follows weather and road conditions.' },
      { day: 3, title: 'Karakol-side mountain options', description: 'Choose a Karakol-area valley, gorge, or hot-spring option that suits the group and is safely accessible on the day.' },
      { day: 4, title: 'Return to Bishkek', description: 'Return to Bishkek by the route agreed in the final plan, with time for a last scenic stop where possible.' },
    ],
    itineraryRu: [
      { day: 1, title: 'Бишкек — Иссык-Куль', description: 'Переезд из Бишкека к Иссык-Кулю с остановками, подобранными для группы и подтверждённого маршрута по берегу.' },
      { day: 2, title: 'Берег озера, каньоны и ущелья', description: 'Знакомство с выбранными озёрными и каньонными пейзажами без попытки успеть всё. Финальный тайминг зависит от погоды и дорог.' },
      { day: 3, title: 'Горные варианты у Каракола', description: 'Выбор долины, ущелья или горячих источников в районе Каракола, которые подходят группе и безопасно доступны в этот день.' },
      { day: 4, title: 'Возвращение в Бишкек', description: 'Возвращение в Бишкек по маршруту, утверждённому в финальном плане, с возможностью сделать последнюю панорамную остановку.' },
    ],
    seoContent: {
      heading: 'Issyk-Köl gorges and hot springs: choosing the right route',
      paragraphs: ['The Issyk-Köl region is large, so a good four-day trip does not try to circle every shore and enter every gorge. We build the route around the places that are open, the group’s interests, and sensible drive times.', 'Hot springs and mountain valleys need a separate access check, particularly outside the core summer season. Tell us if swimming, short walks, photography, or an easy family pace is the priority.'],
      faq: [
        { question: 'Does the trip start in Bishkek?', answer: 'The usual plan starts and ends in Bishkek, but airport or Karakol connections can be discussed when you send the dates.' },
        { question: 'Can we include Skazka Canyon?', answer: 'Yes, it can be considered as part of the south-shore plan when the route, weather, and time allow it.' },
      ],
    },
    seoContentRu: {
      heading: 'Ущелья и горячие источники Иссык-Куля: как выбрать маршрут',
      paragraphs: ['Иссык-Кульский регион большой, поэтому хороший четырёхдневный маршрут не пытается объехать каждый берег и зайти во все ущелья. План строится вокруг доступных точек, интересов группы и реального времени в дороге.', 'Горячие источники и горные долины требуют отдельной проверки подъезда, особенно вне основного летнего сезона. Скажите, что для вас важнее: купание, короткие прогулки, фотографии или лёгкий семейный темп.'],
      faq: [
        { question: 'Стартует ли тур в Бишкеке?', answer: 'Обычно маршрут начинается и заканчивается в Бишкеке, но при сообщении дат можно обсудить аэропортовые стыковки или Каракол.' },
        { question: 'Можно включить каньон Сказка?', answer: 'Да, его можно добавить в план южного берега, если позволяют маршрут, погода и время.' },
      ],
    },
    relatedTourIds: [7, 1, 29],
  },
  7: {
    title: '3-Day Issyk-Köl Tour from Bishkek',
    titleRu: 'Тур вокруг Иссык-Куля из Бишкека — 3 дня',
    description: 'A three-day Issyk-Köl tour from Bishkek for travelers who want a scenic private introduction to Kyrgyzstan’s largest lake without a long multi-week itinerary. The final circuit is adjusted for the chosen shore, the season, and how much time the group wants for Karakol, short walks, and lake views.',
    descriptionRu: 'Трёхдневный тур на Иссык-Куль из Бишкека для тех, кто хочет увидеть крупнейшее озеро Кыргызстана в частном формате без длинного многонедельного маршрута. Финальный круг корректируется под выбранный берег, сезон и желаемое время на Каракол, короткие прогулки и виды на озеро.',
    highlights: ['A concise private Issyk-Köl trip from Bishkek', 'Lake, mountain, and town stops chosen for the available time', 'Options for Karakol and either shore of the lake', 'A realistic route for a short Kyrgyzstan stay'],
    highlightsRu: ['Короткое частное путешествие на Иссык-Куль из Бишкека', 'Озеро, горы и городские остановки в рамках доступного времени', 'Варианты с Караколом и одним из берегов озера', 'Реалистичный маршрут для короткой поездки по Кыргызстану'],
    itinerary: [
      { day: 1, title: 'Bishkek to Issyk-Köl', description: 'Leave Bishkek for Issyk-Köl with route stops selected around the confirmed shore and the group’s interests.' },
      { day: 2, title: 'Issyk-Köl exploration', description: 'Spend the day on the selected lake, gorge, village, or Karakol-side experiences at a comfortable pace.' },
      { day: 3, title: 'Scenic return to Bishkek', description: 'Return to Bishkek with the route and final stops chosen around the season and driving conditions.' },
    ],
    itineraryRu: [
      { day: 1, title: 'Бишкек — Иссык-Куль', description: 'Выезд из Бишкека к Иссык-Кулю с остановками, подобранными под подтверждённый берег и интересы группы.' },
      { day: 2, title: 'Исследование Иссык-Куля', description: 'День у выбранного берега, в ущелье, селе или районе Каракола в комфортном для группы темпе.' },
      { day: 3, title: 'Панорамное возвращение в Бишкек', description: 'Возвращение в Бишкек по маршруту и с финальными остановками, выбранными под сезон и состояние дорог.' },
    ],
    seoContent: {
      heading: 'Three days at Issyk-Köl: what fits comfortably',
      paragraphs: ['Three days is enough for a meaningful Issyk-Köl trip when the route is focused. Rather than treating the lake as one quick photo stop, we choose one shore and a small number of places that match your pace.', 'The north shore generally has more established resort services, while the south shore is often preferred for road-trip scenery and quieter stops. We recommend the better fit once we know the season and travel style.'],
      faq: [
        { question: 'Is three days enough for Issyk-Köl?', answer: 'It is enough for a focused lake trip from Bishkek. For both shores, more mountain valleys, and a slower pace, choose the four-day route or a longer Kyrgyzstan itinerary.' },
        { question: 'Can this be a family tour?', answer: 'Yes. Share children’s ages, the preferred accommodation level, and whether you want short walks or mostly scenic driving.' },
      ],
    },
    seoContentRu: {
      heading: 'Три дня на Иссык-Куле: что можно успеть без спешки',
      paragraphs: ['Трёх дней достаточно для содержательной поездки на Иссык-Куль, если не пытаться охватить всё сразу. Вместо одной быстрой остановки у озера мы выбираем один берег и небольшое количество точек под ваш темп.', 'На северном берегу обычно больше развитых курортных сервисов, а южный часто выбирают ради дорожных пейзажей и спокойных остановок. После уточнения сезона и формата посоветуем подходящий вариант.'],
      faq: [
        { question: 'Достаточно ли трёх дней для Иссык-Куля?', answer: 'Да, для сфокусированной поездки из Бишкека. Для двух берегов, большего числа горных долин и более медленного темпа лучше взять четыре дня или длинный маршрут по стране.' },
        { question: 'Подходит ли тур для семьи?', answer: 'Да. Сообщите возраст детей, желаемый уровень размещения и предпочтение между короткими прогулками и преимущественно панорамными переездами.' },
      ],
    },
    relatedTourIds: [10, 1, 3],
  },
  3: {
    title: '7-Day Kyrgyzstan Tour: Song-Köl, Kel-Suu and Issyk-Köl',
    titleRu: 'Тур по Кыргызстану: Сон-Куль, Кель-Суу и Иссык-Куль — 7 дней',
    description: 'A seven-day Kyrgyzstan tour for guests who want the country’s central mountain lakes and Issyk-Köl in one private route. It combines Song-Köl, Kel-Suu, and Issyk-Köl with a pace that is planned around genuine mountain-drive distances rather than an overfilled checklist.',
    descriptionRu: 'Семидневный тур по Кыргызстану для гостей, которые хотят увидеть центральные горные озёра и Иссык-Куль в одной частной поездке. Маршрут объединяет Сон-Куль, Кель-Суу и Иссык-Куль в темпе, рассчитанном по настоящим горным переездам, а не по переполненному списку точек.',
    highlights: ['A one-week private Kyrgyzstan route linking three major lake regions', 'Song-Köl highlands, Kel-Suu access planning, and Issyk-Köl scenery', 'Flexible balance of driving, short walks, culture, and photo stops', 'A better fit than a rushed two- or three-day cross-country circuit'],
    highlightsRu: ['Недельный частный маршрут по Кыргызстану через три главных озёрных региона', 'Высокогорья Сон-Куля, планирование подъезда к Кель-Суу и пейзажи Иссык-Куля', 'Гибкий баланс переездов, коротких прогулок, культуры и фотостопов', 'Более разумный формат, чем попытка объехать страну за два-три дня'],
    itinerary: [
      { day: 1, title: 'Arrival and Bishkek route briefing', description: 'Meet the local team, confirm travel details, and prepare for the mountain section of the journey.' },
      { day: 2, title: 'Toward the Song-Köl region', description: 'Travel toward the Song-Köl highlands with stops planned around the road, weather, and confirmed overnight location.' },
      { day: 3, title: 'Song-Köl highland day', description: 'Spend time around Song-Köl at a pace suited to the group, with optional short walks or horse-related activities discussed in advance.' },
      { day: 4, title: 'Naryn route and Kel-Suu planning', description: 'Continue through the Naryn region and prepare the next day’s Kel-Suu access around current requirements and local conditions.' },
      { day: 5, title: 'Kel-Suu access day', description: 'Visit the Kel-Suu area using the access plan confirmed for your dates, then continue to the planned overnight point.' },
      { day: 6, title: 'Toward Issyk-Köl', description: 'Travel toward Issyk-Köl, allowing time for a scenic stop instead of treating the day as only a transfer.' },
      { day: 7, title: 'Issyk-Köl and return connection', description: 'Use the final day for the selected lakeside stop and the return or onward transfer stated in the confirmed programme.' },
    ],
    itineraryRu: [
      { day: 1, title: 'Прибытие и обсуждение маршрута в Бишкеке', description: 'Встреча с местной командой, уточнение деталей поездки и подготовка к горной части маршрута.' },
      { day: 2, title: 'Путь к району Сон-Куля', description: 'Переезд к высокогорьям Сон-Куля с остановками, запланированными по дорогам, погоде и подтверждённой ночёвке.' },
      { day: 3, title: 'День в высокогорьях Сон-Куля', description: 'Время в районе Сон-Куля в темпе группы; короткие прогулки или активности с лошадьми обсуждаются заранее.' },
      { day: 4, title: 'Нарынский маршрут и планирование Кель-Суу', description: 'Продолжение пути через Нарынскую область и подготовка подъезда к Кель-Суу с учётом актуальных требований и местных условий.' },
      { day: 5, title: 'День подъезда к Кель-Суу', description: 'Посещение района Кель-Суу по схеме, подтверждённой на ваши даты, затем переезд к запланированной ночёвке.' },
      { day: 6, title: 'Путь к Иссык-Кулю', description: 'Переезд к Иссык-Кулю с местом для панорамной остановки, а не только как обычный трансфер.' },
      { day: 7, title: 'Иссык-Куль и возвращение', description: 'Финальный день для выбранной остановки у озера и возвращения или дальнейшего трансфера по подтверждённой программе.' },
    ],
    seoContent: {
      heading: 'A seven-day Kyrgyzstan itinerary without an unrealistic pace',
      paragraphs: ['Song-Köl, Kel-Suu, and Issyk-Köl belong to different parts of the country, so the useful question is not only what can fit on a map but what will remain enjoyable after real mountain driving. This route leaves the order flexible until road access and your arrival details are confirmed.', 'It suits first-time visitors who want lakes, highland landscapes, yurt stays, and a road-trip feel in one week. If trekking, longer horse riding, or a relaxed beach stay is the main goal, we can adapt the route or suggest a more focused option.'],
      faq: [
        { question: 'Can the order of Song-Köl, Kel-Suu, and Issyk-Köl change?', answer: 'Yes. The confirmed order follows your flights, current access, weather, and the safest realistic driving plan.' },
        { question: 'Is this a group departure?', answer: 'It can be arranged privately or for a small group. Send the dates and group size for actual availability and a quote.' },
      ],
    },
    seoContentRu: {
      heading: 'Семь дней по Кыргызстану без нереалистичного темпа',
      paragraphs: ['Сон-Куль, Кель-Суу и Иссык-Куль находятся в разных частях страны, поэтому важно не только отметить точки на карте, но и сохранить удовольствие после реальных горных переездов. Порядок маршрута остаётся гибким до подтверждения дорог и деталей прилёта.', 'Маршрут подходит для первого знакомства со страной: озёра, высокогорные пейзажи, юрты и ощущение автопутешествия за неделю. Если главная цель — треккинг, долгие конные переходы или спокойный отдых у воды, маршрут можно адаптировать или выбрать более сфокусированный вариант.'],
      faq: [
        { question: 'Можно поменять порядок Сон-Куля, Кель-Суу и Иссык-Куля?', answer: 'Да. Финальный порядок зависит от перелётов, текущего подъезда, погоды и самого безопасного реалистичного плана движения.' },
        { question: 'Это групповой выезд?', answer: 'Можно организовать в частном формате или для небольшой группы. Пришлите даты и число гостей — подтвердим реальную доступность и стоимость.' },
      ],
    },
    relatedTourIds: [11, 29, 1],
  },
};

function buildTour(item, id) {
  const copy = kindCopy[item.kind];
  const priority = priorityTourContent[id];
  return {
    id,
    title: priority?.title || item.title,
    isHot: [2, 11, 3].includes(id),
    duration: `${item.days} days`,
    tourType: copy.type,
    season: item.season,
    description: priority?.description || `${copy.description} This ${item.days}-day route connects ${joinPlaces(item.stops)}.`,
    image: travelImage(item.imageIndex),
    price: 'Price on request',
    locations: item.stops
      .filter((name) => coordinates[name])
      .map((name) => ({ name, lat: coordinates[name][0], lng: coordinates[name][1] })),
    highlights: priority?.highlights || [...copy.highlights.slice(0, 3), `Route highlights: ${joinPlaces(item.stops)}`],
    itinerary: priority?.itinerary || itineraryFor(item),
    packingList: packingList(item.kind),
    practicalInfo: practicalInfo(item),
    seoContent: priority?.seoContent,
    relatedTourIds: priority?.relatedTourIds,
  };
}

function buildRussianCopy(item, id) {
  const copy = kindCopy[item.kind];
  const priority = priorityTourContent[id];
  return {
    title: priority?.titleRu || item.titleRu,
    duration: `${item.days} ${item.days === 1 ? 'день' : item.days < 5 ? 'дня' : 'дней'}`,
    tourType: copy.typeRu,
    season: seasonRu(item.season),
    description: priority?.descriptionRu || `${copy.descriptionRu} Маршрут на ${item.days} ${item.days < 5 ? 'дня' : 'дней'} связывает ${joinPlaces(item.stops, 'ru')}.`,
    highlights: priority?.highlightsRu || [...copy.highlightsRu.slice(0, 3), `Ключевые точки маршрута: ${joinPlaces(item.stops, 'ru')}`],
    itinerary: priority?.itineraryRu || itineraryFor(item, 'ru'),
    packingList: packingList(item.kind, 'ru'),
    practicalInfo: practicalInfo(item, 'ru'),
    difficulty: copy.difficultyRu,
    seoContent: priority?.seoContentRu,
  };
}

const tours = catalog.map((item, index) => buildTour(item, index + 1));
const russianTranslations = Object.fromEntries(catalog.map((item, index) => [String(index + 1), buildRussianCopy(item, index + 1)]));

fs.writeFileSync(path.join(rootDir, 'data', 'seed_tours.json'), `${JSON.stringify(tours, null, 2)}\n`);
fs.writeFileSync(path.join(rootDir, 'data', 'tour_translations_ru.json'), `${JSON.stringify(russianTranslations, null, 2)}\n`);
console.log(`Generated ${tours.length} current tours and ${Object.keys(russianTranslations).length} Russian translations.`);

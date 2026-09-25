import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { enGB, ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useDayPicker, useDayRender, type DayProps } from 'react-day-picker';
import { apiEnabled, fetchApiTourDepartures, type TourDeparture, type TourDepartureAvailability } from '../lib/api';
import type { SiteLocale } from '../lib/locale';
import { localizedPath } from '../lib/locale';
import { Calendar } from './ui/calendar';
import '../../styles/tour-booking-calendar.css';

export function bookingDateValue(date: Date | undefined) {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function bookingDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return bookingDateValue(date) === value ? date : undefined;
}

export function bookingToday() {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bishkek', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map((part) => parts.find((item) => item.type === part)?.value).join('-');
}

export function useTourDepartureAvailability(tourId: number) {
  const [availability, setAvailability] = useState<TourDepartureAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    if (!apiEnabled) {
      setLoading(false);
      setError(true);
      return;
    }
    let requestTimeout: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      requestTimeout = setTimeout(() => reject(new Error('Availability request timed out')), 12000);
    });
    Promise.race([fetchApiTourDepartures(tourId), timeout])
      .then((result) => { if (active) setAvailability(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { clearTimeout(requestTimeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(requestTimeout); };
  }, [tourId, revision]);

  return { availability, loading, error, refresh };
}

type Props = {
  availability: TourDepartureAvailability | null;
  loading: boolean;
  error: boolean;
  participants: number;
  selectedId: string;
  locale: SiteLocale;
  onSelect: (departure: TourDeparture) => void;
  onRetry: () => void;
};

// DayPicker v8 exposes labelDay but does not attach it to its default day button.
// Keep its keyboard/selection behavior while giving each date a complete name.
function ScheduledCalendarDay({ date, displayMonth }: DayProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const day = useDayRender(date, displayMonth, ref);
  const { labels, locale } = useDayPicker();
  if (day.isHidden) return <div role="gridcell" />;
  if (!day.isButton) return <div {...day.divProps} />;
  return <button {...day.buttonProps} ref={ref} type="button" name="day" aria-label={labels.labelDay(date, day.activeModifiers, { locale })} />;
}

export function TourBookingCalendar({ availability, loading, error, participants, selectedId, locale, onSelect, onRetry }: Props) {
  const isRu = locale === 'ru';
  const todayValue = availability?.today || bookingToday();
  const today = bookingDate(todayValue)!;
  const departures = useMemo(() => (availability?.departures || [])
    .filter((item) => item.startDate >= todayValue && bookingDate(item.startDate) && bookingDate(item.endDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate)), [availability, todayValue]);
  const canSelect = (departure: TourDeparture) => departure.status === 'open' && departure.remainingSeats >= participants;
  const available = departures.filter(canSelect);
  const selected = departures.find((item) => item.id === selectedId && canSelect(item));
  const [viewingMonth, setViewingMonth] = useState<Date>();
  const [showAll, setShowAll] = useState(false);
  const month = viewingMonth || bookingDate(available[0]?.startDate || departures[0]?.startDate) || today;
  const monthKey = bookingDateValue(month).slice(0, 7);
  const monthDepartures = departures.filter((item) => item.startDate.startsWith(monthKey));
  const visibleDepartures = showAll ? monthDepartures : monthDepartures.slice(0, 4);
  const formatter = new Intl.DateTimeFormat(isRu ? 'ru' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDate = (value: string) => formatter.format(bookingDate(value));
  const dateLabel = (departure: TourDeparture) => departure.startDate === departure.endDate
    ? formatDate(departure.startDate)
    : `${formatDate(departure.startDate)} — ${formatDate(departure.endDate)}`;
  const statusLabel = (departure: TourDeparture) => departure.status === 'closed'
    ? (isRu ? 'Выезд закрыт' : 'Departure closed')
    : departure.remainingSeats < 1
      ? (isRu ? 'Мест нет' : 'Full')
      : !canSelect(departure)
        ? (isRu ? `Только ${departure.remainingSeats} мест — недостаточно для вашей группы` : `Only ${departure.remainingSeats} seats — not enough for your group`)
        : (isRu ? `Доступно мест: ${departure.remainingSeats}` : `${departure.remainingSeats} seats available`);

  if (loading) return <div className="tour-booking-calendar tour-booking-calendar__notice" role="status"><RefreshCw size={18} aria-hidden="true" />{isRu ? 'Проверяем даты и свободные места…' : 'Checking dates and available seats…'}</div>;
  if (error || !availability) return (
    <div className="tour-booking-calendar tour-booking-calendar__notice" role="alert">
      <p>{isRu ? 'Не удалось загрузить расписание. Обновите его, чтобы выбрать доступный выезд.' : 'We could not load the schedule. Try again to choose an available departure.'}</p>
      <button type="button" className="tour-booking-calendar__text-button" onClick={onRetry}><RefreshCw size={15} aria-hidden="true" />{isRu ? 'Обновить расписание' : 'Retry schedule'}</button>
    </div>
  );
  if (!departures.length) return (
    <div className="tour-booking-calendar tour-booking-calendar__notice">
      <CalendarDays size={22} aria-hidden="true" />
      <p>{isRu ? 'Новые даты этого тура пока не опубликованы. Напишите нам, чтобы узнать о следующих выездах.' : 'New dates for this tour have not been published yet. Contact us to ask about upcoming departures.'}</p>
      <Link className="tour-booking-calendar__text-button" to={localizedPath('/feedback', locale)}>{isRu ? 'Уточнить будущие даты' : 'Ask about future dates'} →</Link>
    </div>
  );

  return (
    <div className="tour-booking-calendar">
      <p className="tour-booking-calendar__intro">{isRu ? `Выберите день выезда. Показываем даты для вашей группы: ${participants} чел.` : `Choose a departure day. Showing dates for your group of ${participants}.`}</p>
      <Calendar
        mode="single"
        selected={bookingDate(selected?.startDate)}
        month={month}
        onMonthChange={(value) => { setViewingMonth(value); setShowAll(false); }}
        fromMonth={today}
        toMonth={bookingDate(departures[departures.length - 1]?.startDate)}
        locale={isRu ? ru : enGB}
        weekStartsOn={1}
        showOutsideDays={false}
        fixedWeeks
        disabled={(day) => !available.some((item) => item.startDate === bookingDateValue(day))}
        modifiers={{ available: available.map((item) => bookingDate(item.startDate)!) }}
        modifiersClassNames={{ available: 'tour-booking-calendar__day--available' }}
        onSelect={(day) => {
          const departure = available.find((item) => item.id === selectedId && item.startDate === bookingDateValue(day))
            || available.find((item) => item.startDate === bookingDateValue(day));
          if (departure) onSelect(departure);
        }}
        labels={{
          labelNext: () => isRu ? 'Следующий месяц' : 'Next month',
          labelPrevious: () => isRu ? 'Предыдущий месяц' : 'Previous month',
          labelDay: (day) => {
            const departure = available.find((item) => item.startDate === bookingDateValue(day));
            return `${formatter.format(day)}: ${departure ? statusLabel(departure) : (isRu ? 'нет доступного выезда для вашей группы' : 'no available departure for your group')}`;
          },
        }}
        className="tour-booking-calendar__picker"
        components={{
          Day: ScheduledCalendarDay,
          IconLeft: () => <ChevronLeft size={16} aria-hidden="true" />,
          IconRight: () => <ChevronRight size={16} aria-hidden="true" />,
        }}
        classNames={{
          months: 'tour-booking-calendar__months', month: 'tour-booking-calendar__month',
          caption: 'tour-booking-calendar__caption', caption_label: 'tour-booking-calendar__caption-label',
          nav: 'tour-booking-calendar__nav', nav_button: 'tour-booking-calendar__nav-button',
          nav_button_previous: 'tour-booking-calendar__nav-button--previous', nav_button_next: 'tour-booking-calendar__nav-button--next',
          table: 'tour-booking-calendar__table', head_row: 'tour-booking-calendar__week', head_cell: 'tour-booking-calendar__weekday',
          row: 'tour-booking-calendar__week', cell: 'tour-booking-calendar__cell', day: 'tour-booking-calendar__day',
          day_selected: 'tour-booking-calendar__day--selected', day_today: 'tour-booking-calendar__day--today',
          day_disabled: 'tour-booking-calendar__day--disabled', day_hidden: 'tour-booking-calendar__day--hidden',
        }}
      />
      <div className="tour-booking-calendar__legend" aria-label={isRu ? 'Обозначения календаря' : 'Calendar legend'}>
        <span><i className="tour-booking-calendar__dot" />{isRu ? 'Доступный выезд' : 'Available departure'}</span>
        <span><i className="tour-booking-calendar__dot tour-booking-calendar__dot--unavailable" />{isRu ? 'Недоступно' : 'Unavailable'}</span>
      </div>
      <div className="tour-booking-calendar__departures">
        <h4>{isRu ? 'Выезды в этом месяце' : 'Departures this month'}</h4>
        {visibleDepartures.length ? visibleDepartures.map((departure) => (
          <button
            key={departure.id}
            type="button"
            className="tour-booking-calendar__departure"
            disabled={!canSelect(departure)}
            aria-pressed={selected?.id === departure.id}
            onClick={() => onSelect(departure)}
          >
            <span><strong>{dateLabel(departure)}</strong><small>{statusLabel(departure)}</small></span>
            {selected?.id === departure.id ? <Check size={18} aria-hidden="true" /> : <CalendarDays size={18} aria-hidden="true" />}
          </button>
        )) : <p className="tour-booking-calendar__intro">{isRu ? 'В этом месяце выездов пока нет.' : 'No departures are published for this month.'}</p>}
        {monthDepartures.length > 4 && <button type="button" className="tour-booking-calendar__text-button" onClick={() => setShowAll((value) => !value)}>{showAll ? (isRu ? 'Свернуть список' : 'Show fewer') : (isRu ? `Все выезды (${monthDepartures.length})` : `All departures (${monthDepartures.length})`)}</button>}
        {!monthDepartures.some(canSelect) && available.length > 0 && <button type="button" className="tour-booking-calendar__text-button" onClick={() => { setViewingMonth(bookingDate(available[0].startDate)); setShowAll(false); }}>{isRu ? 'К ближайшей доступной дате' : 'Go to next available date'} →</button>}
        {available.length === 0 && <p className="tour-booking-calendar__intro" role="status">{isRu ? 'Нет выездов с достаточным количеством мест для вашей группы. Уточните другие варианты через страницу контактов.' : 'No departure has enough seats for your group. Contact us to discuss other options.'}</p>}
      </div>
      <p className="tour-booking-calendar__confirmation" role="status">{selected && <strong>{isRu ? 'Вы выбрали: ' : 'Selected: '}{dateLabel(selected)}. </strong>}{isRu ? 'Даты указаны по времени Кыргызстана. Заявка не резервирует места: мы подтвердим поездку лично.' : 'Dates are shown in Kyrgyzstan time. Sending a request does not reserve seats; we will confirm your trip personally.'}</p>
    </div>
  );
}

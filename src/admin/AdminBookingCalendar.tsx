import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import type { Tour } from '../app/components/tour-data';
import type { BookingRequest, CustomTourRequest } from '../app/lib/dataStore';
import {
  apiEnabled, createApiDeparture, fetchApiAdminDepartures, updateApiBookingDates,
  updateApiDeparture, updateApiTour, type AdminTourDeparture, type DepartureInput,
} from '../app/lib/api';

type Booking = BookingRequest & { id: string };
type CustomRequest = CustomTourRequest & { id: string };
type Props = { tours: Tour[]; bookings: Booking[]; customRequests: CustomRequest[]; onChanged: () => Promise<void> };
const statuses: Record<string, string> = {
  pending: 'Новая', contacted: 'Связались', approved: 'Подтверждена',
  completed: 'Завершена', cancelled: 'Отменена', rejected: 'Отклонена',
};
const inactiveStatuses = new Set(['cancelled', 'rejected']);
const iso = (date: Date) => format(date, 'yyyy-MM-dd');
const isDate = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)));
const dateLabel = (value: string) => isDate(value) ? format(new Date(`${value}T12:00:00`), 'd MMM yyyy', { locale: ru }) : 'Без даты';
const todayInBishkek = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bishkek', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const selectClass = 'min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground';

export function AdminBookingCalendar({ tours, bookings, customRequests, onChanged }: Props) {
  const [today, setToday] = useState(todayInBishkek);
  const [month, setMonth] = useState(() => startOfMonth(new Date(`${todayInBishkek()}T12:00:00`)));
  const [day, setDay] = useState(today);
  const [tourFilter, setTourFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [departures, setDepartures] = useState<AdminTourDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ tourId: '', startDate: today, endDate: today, capacity: '8', status: 'open' as 'open' | 'closed' });
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveDates, setMoveDates] = useState({ startDate: '', endDate: '', departureId: '' });

  const reload = useCallback(async () => {
    if (!apiEnabled) { setError('Для управления расписанием подключите API сайта.'); setLoading(false); return; }
    try {
      const result = await fetchApiAdminDepartures();
      setDepartures(result);
      setError('');
      setToday(todayInBishkek());
    } catch (err) { setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void reload(); }, 30000);
    return () => window.clearInterval(timer);
  }, [reload]);

  const tourNames = useMemo(() => new Map(tours.map(tour => [tour.id, tour.title])), [tours]);
  const filteredBookings = bookings.filter(booking =>
    (tourFilter === 'all' || String(booking.tourId) === tourFilter) &&
    (statusFilter === 'all' || (statusFilter === 'active' ? !inactiveStatuses.has(booking.status || 'pending') : booking.status === statusFilter)),
  );
  const filteredCustom = customRequests.filter(request => tourFilter === 'all' &&
    (statusFilter === 'all' || (statusFilter === 'active' ? !inactiveStatuses.has(request.status || 'pending') : request.status === statusFilter)),
  );
  const filteredDepartures = departures.filter(departure => tourFilter === 'all' || String(departure.tourId) === tourFilter);
  const dates = useMemo(() => Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), index)), [month]);
  const onDay = (start: string, end: string, target: string) => isDate(start) && start <= target && (isDate(end) ? end : start) >= target;
  const selectedBookings = filteredBookings.filter(booking => onDay(booking.startDate, booking.endDate, day));
  const selectedCustom = filteredCustom.filter(request => onDay(request.startDate, request.endDate, day));
  const selectedDepartures = filteredDepartures.filter(departure => onDay(departure.startDate, departure.endDate, day));
  const undated = filteredBookings.filter(booking => !isDate(booking.startDate));
  const undatedCustom = filteredCustom.filter(request => !isDate(request.startDate));
  const upcoming = filteredDepartures.filter(departure => departure.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const formTour = tours.find(tour => String(tour.id) === form.tourId);
  const selectedEdit = departures.find(departure => departure.id === editId);

  async function runMutation(action: () => Promise<unknown>, success: string) {
    setSaving(true);
    try {
      await action();
      toast.success(success);
      try { await Promise.all([reload(), onChanged()]); }
      catch { toast.error('Изменения сохранены, но список не обновился. Нажмите «Обновить».'); }
      return true;
    }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Не удалось сохранить изменения.'); return false; }
    finally { setSaving(false); }
  }

  async function saveDeparture(event: React.FormEvent) {
    event.preventDefault();
    const payload: DepartureInput = { ...form, tourId: Number(form.tourId), capacity: Number(form.capacity) };
    if (!payload.tourId || !isDate(payload.startDate) || !isDate(payload.endDate) || payload.endDate < payload.startDate || !Number.isInteger(payload.capacity) || payload.capacity < 1) {
      toast.error('Выберите тур, корректные даты и число мест.'); return;
    }
    const changes = selectedEdit ? Object.fromEntries(Object.entries(payload).filter(([key, value]) => value !== selectedEdit[key as keyof AdminTourDeparture])) as Partial<DepartureInput> : payload;
    const ok = await runMutation(() => editId ? updateApiDeparture(editId, changes) : createApiDeparture(payload), editId ? 'Выезд обновлён.' : 'Выезд добавлен.');
    if (ok) setEditId(null);
  }

  function editDeparture(departure: AdminTourDeparture) {
    setEditId(departure.id);
    setForm({ tourId: String(departure.tourId), startDate: departure.startDate, endDate: departure.endDate, capacity: String(departure.capacity), status: departure.status });
    document.getElementById('departure-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveBookingDates(booking: Booking) {
    const scheduled = Boolean(booking.departureId) || tours.find(tour => tour.id === booking.tourId)?.availabilityMode === 'scheduled';
    if (scheduled ? !moveDates.departureId : !isDate(moveDates.startDate) || !isDate(moveDates.endDate) || moveDates.endDate < moveDates.startDate) {
      toast.error('Выберите новый выезд или обе даты поездки.'); return;
    }
    const ok = await runMutation(() => updateApiBookingDates(booking.id, scheduled ? { departureId: moveDates.departureId } : { startDate: moveDates.startDate, endDate: moveDates.endDate }), 'Даты заявки обновлены. Сообщите об изменении туристу.');
    if (ok) setMovingId(null);
  }

  function bookingCard(booking: Booking) {
    const scheduled = Boolean(booking.departureId) || tours.find(tour => tour.id === booking.tourId)?.availabilityMode === 'scheduled';
    return <article key={booking.id} className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{booking.name}</p>
        <span className={`rounded-full px-2 py-1 text-xs ${booking.status === 'approved' || booking.status === 'completed' ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground'}`}>{statuses[booking.status || 'pending'] || booking.status}</span>
      </div>
      <p className="mt-1 text-sm">{booking.tourTitle}</p>
      <p className="mt-2 text-sm text-muted-foreground">{dateLabel(booking.startDate)} — {dateLabel(booking.endDate)} · {booking.participants} чел.</p>
      {!isDate(booking.startDate) && <p className="mt-1 text-sm text-muted-foreground">{booking.dateFlexibility || 'Даты нужно согласовать'}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {booking.email && <a href={`mailto:${booking.email}`} className="text-primary underline">Email</a>}
        {booking.phone && <a href={`https://wa.me/${booking.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-primary underline">WhatsApp</a>}
        {booking.telegramUsername && <a href={`https://t.me/${booking.telegramUsername.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="text-primary underline">Telegram</a>}
        <button type="button" className="text-primary underline" disabled={saving} onClick={() => { setMovingId(movingId === booking.id ? null : booking.id); setMoveDates({ startDate: booking.startDate, endDate: booking.endDate, departureId: booking.departureId || '' }); }}>Изменить даты</button>
        <Link to="/admin/dashboard?tab=bookings" className="text-primary underline">Статус и детали</Link>
      </div>
      {movingId === booking.id && <div className="mt-3 space-y-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Переносите даты после согласования с туристом. Подтверждённые места будут пересчитаны.</p>
        {scheduled ? <select aria-label="Новый выезд" className={selectClass} value={moveDates.departureId} onChange={event => setMoveDates({ ...moveDates, departureId: event.target.value })}>
          <option value="">Выберите выезд</option>
          {departures.filter(departure => departure.tourId === booking.tourId && (departure.startDate >= today && departure.status === 'open' || departure.id === booking.departureId)).map(departure => <option key={departure.id} value={departure.id} disabled={departure.id !== booking.departureId && departure.remainingSeats < booking.participants}>{dateLabel(departure.startDate)} — {dateLabel(departure.endDate)} · свободно {departure.remainingSeats}</option>)}
        </select> : <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs">Начало<Input type="date" min={today} value={moveDates.startDate} onChange={event => setMoveDates({ ...moveDates, startDate: event.target.value })} /></label>
          <label className="text-xs">Окончание<Input type="date" min={moveDates.startDate || today} value={moveDates.endDate} onChange={event => setMoveDates({ ...moveDates, endDate: event.target.value })} /></label>
        </div>}
        <Button type="button" disabled={saving || !apiEnabled} onClick={() => void saveBookingDates(booking)}>Сохранить даты</Button>
      </div>}
    </article>;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Календарь броней и выездов</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Выберите день, чтобы увидеть поездки. Заявка занимает места после статуса «approved» (подтверждена). Все даты — по Кыргызстану.</p></div>
      <Button variant="outline" disabled={loading || saving} onClick={() => void reload()}><RefreshCw className="h-4 w-4" /> Обновить</Button>
    </div>
    {error && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">{error} {departures.length > 0 && 'Показано последнее загруженное расписание.'}</div>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">Тур<select className={selectClass} value={tourFilter} onChange={event => setTourFilter(event.target.value)}><option value="all">Все туры и индивидуальные заявки</option>{tours.map(tour => <option key={tour.id} value={tour.id}>{tour.title}</option>)}</select></label>
      <label className="space-y-1 text-sm">Статус заявки<select className={selectClass} value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="active">Без отменённых и отклонённых</option><option value="all">Все статусы</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        ['Ближайшие выезды', upcoming.filter(item => item.status === 'open').length],
        ['Подтверждённые заявки', filteredBookings.filter(item => item.status === 'approved' && item.endDate >= today).length],
        ['Без точных дат', undated.length + undatedCustom.length],
        ['Ждут ответа', filteredBookings.filter(item => (item.status || 'pending') === 'pending').length + filteredCustom.filter(item => (item.status || 'pending') === 'pending').length],
      ].map(([label, value]) => <div key={label} className="rounded-md border border-border bg-background p-3"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
    </div>
    <section className="rounded-lg border border-border bg-background p-2 sm:p-4" aria-label="Календарь поездок">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 aria-live="polite" className="text-lg font-medium capitalize">{format(month, 'LLLL yyyy', { locale: ru })}</h2>
        <div className="flex gap-1"><Button variant="outline" size="icon" aria-label="Предыдущий месяц" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft /></Button><Button variant="outline" onClick={() => { setMonth(startOfMonth(new Date(`${today}T12:00:00`))); setDay(today); }}>Сегодня</Button><Button variant="outline" size="icon" aria-label="Следующий месяц" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></Button></div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(label => <div key={label} className="py-2">{label}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {dates.map(date => {
          const key = iso(date);
          const tripCount = filteredBookings.filter(booking => onDay(booking.startDate, booking.endDate, key)).length + filteredCustom.filter(request => onDay(request.startDate, request.endDate, key)).length;
          const starts = filteredDepartures.filter(departure => departure.startDate === key).length;
          return <button key={key} type="button" aria-pressed={day === key} aria-label={`${dateLabel(key)}: ${tripCount} заявок, ${starts} выездов`} onClick={() => setDay(key)} className={`relative flex min-h-20 min-w-0 flex-col items-center rounded-md border px-1 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:min-h-24 ${day === key ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:bg-muted'} ${date.getMonth() !== month.getMonth() ? 'text-muted-foreground' : 'text-foreground'}`}>
            <span className={key === today ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground' : 'h-6'}>{date.getDate()}</span>
            {tripCount > 0 && <span className="mt-1 flex items-center gap-1 text-[10px] text-primary sm:text-xs"><Users className="h-3 w-3" />{tripCount}<span className="hidden sm:inline">заяв.</span></span>}
            {starts > 0 && <span className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs"><CalendarDays className="h-3 w-3" />{starts}<span className="hidden sm:inline">старт</span></span>}
          </button>;
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Заявки отмечены на всех днях поездки; выезды — в день старта. Несколько заявок на одном выезде не означают, что он переполнен.</p>
    </section>
    <section aria-labelledby="calendar-day-title" className="space-y-3">
      <h2 id="calendar-day-title" className="text-xl font-medium">{dateLabel(day)}</h2>
      {selectedDepartures.map(departure => <div key={departure.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm"><div><p className="font-medium">{tourNames.get(departure.tourId) || departure.tourTitle || `Тур ${departure.tourId}`}</p><p className="mt-1 text-muted-foreground">{dateLabel(departure.startDate)} — {dateLabel(departure.endDate)} · {departure.status === 'closed' ? 'Приём закрыт' : `Свободно ${departure.remainingSeats} из ${departure.capacity}`} · ждут ответа: {departure.pendingRequests}</p></div><Button size="sm" variant="outline" onClick={() => editDeparture(departure)}>Изменить выезд</Button></div>)}
      <div className="grid gap-3 xl:grid-cols-2">{selectedBookings.map(bookingCard)}{selectedCustom.map(request => <article key={request.id} className="rounded-md border border-border p-4 text-sm"><p className="font-semibold">{request.name} · индивидуальная поездка</p><p className="mt-1">{dateLabel(request.startDate)} — {dateLabel(request.endDate)} · {request.groupSize} чел.</p><p className="mt-1 text-muted-foreground">{statuses[request.status || 'pending'] || request.status}</p><Link to="/admin/dashboard?tab=requests" className="mt-2 inline-block text-primary underline">Открыть индивидуальные заявки</Link></article>)}</div>
      {!selectedBookings.length && !selectedCustom.length && !selectedDepartures.length && <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">На выбранную дату поездок пока нет.</p>}
    </section>
    {(undated.length > 0 || undatedCustom.length > 0) && <details className="rounded-md border border-border p-4"><summary className="cursor-pointer font-medium">Нужно согласовать даты: {undated.length + undatedCustom.length}</summary><div className="mt-4 grid gap-3 xl:grid-cols-2">{undated.map(bookingCard)}</div>{undatedCustom.length > 0 && <Link to="/admin/dashboard?tab=requests" className="mt-3 inline-block text-sm text-primary underline">Индивидуальных заявок без дат: {undatedCustom.length}</Link>}</details>}
    <section id="departure-editor" className="scroll-mt-24 rounded-lg border border-border p-4 sm:p-5" aria-labelledby="departure-editor-title">
      <h2 id="departure-editor-title" className="text-xl font-medium">{editId ? 'Изменить выезд' : 'Добавить доступные даты'}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Добавляйте реальные выезды, затем включите у тура «По расписанию». Для частных поездок можно оставить «По запросу».</p>
      <form onSubmit={saveDeparture} className="mt-4 space-y-4">
        <div><Label htmlFor="departure-tour">Тур</Label><select id="departure-tour" required disabled={Boolean(editId) || saving} className={`${selectClass} mt-1`} value={form.tourId} onChange={event => setForm({ ...form, tourId: event.target.value })}><option value="">Выберите тур</option>{tours.map(tour => <option key={tour.id} value={tour.id}>{tour.title}</option>)}</select></div>
        {formTour && <div className="rounded-md bg-muted p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><p>Сейчас: <strong>{formTour.availabilityMode === 'scheduled' ? 'По расписанию' : 'По запросу'}</strong></p><Button type="button" variant="outline" size="sm" disabled={saving || !apiEnabled} onClick={() => void runMutation(() => updateApiTour(formTour.id, { availabilityMode: formTour.availabilityMode === 'scheduled' ? 'on-request' : 'scheduled' }), 'Режим тура обновлён.')}>{formTour.availabilityMode === 'scheduled' ? 'Принимать гибкие даты' : 'Включить расписание'}</Button></div>{formTour.availabilityMode !== 'scheduled' && <p className="mt-2 text-xs text-muted-foreground">Выезды сохраняются, но выбор туристом конкретного выезда появится после включения расписания.</p>}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="departure-start">Дата начала</Label><Input id="departure-start" type="date" required min={editId ? undefined : today} value={form.startDate} disabled={saving} onChange={event => setForm({ ...form, startDate: event.target.value, endDate: form.endDate < event.target.value ? event.target.value : form.endDate })} /></div>
          <div><Label htmlFor="departure-end">Дата окончания (включительно)</Label><Input id="departure-end" type="date" required min={form.startDate} value={form.endDate} disabled={saving} onChange={event => setForm({ ...form, endDate: event.target.value })} /></div>
          <div><Label htmlFor="departure-capacity">Всего мест</Label><Input id="departure-capacity" type="number" required min="1" max="100" step="1" value={form.capacity} disabled={saving} onChange={event => setForm({ ...form, capacity: event.target.value })} /></div>
          <div><Label htmlFor="departure-status">Приём заявок</Label><select id="departure-status" className={selectClass} disabled={saving} value={form.status} onChange={event => setForm({ ...form, status: event.target.value as 'open' | 'closed' })}><option value="open">Открыт</option><option value="closed">Закрыт</option></select></div>
        </div>
        {selectedEdit && (selectedEdit.confirmedParticipants > 0 || selectedEdit.pendingRequests > 0) && <p className="text-xs text-muted-foreground">У выезда есть заявки. Для переноса туристов создайте новый выезд и измените даты каждой заявки; это сохраняет историю и проверку мест.</p>}
        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving || !apiEnabled}>{saving ? 'Сохраняем…' : editId ? 'Сохранить выезд' : 'Добавить выезд'}</Button>{editId && <Button type="button" variant="outline" disabled={saving} onClick={() => { setEditId(null); setForm({ ...form, startDate: today, endDate: today }); }}>Отменить редактирование</Button>}</div>
      </form>
    </section>
    <section className="space-y-3" aria-labelledby="upcoming-departures-title"><h2 id="upcoming-departures-title" className="text-xl font-medium">Ближайшие выезды</h2>{loading && <p role="status" className="text-sm text-muted-foreground">Загружаем расписание…</p>}{!loading && upcoming.length === 0 && <p className="text-sm text-muted-foreground">Выездов пока нет. Добавьте даты выше, когда расписание подтверждено.</p>}{upcoming.map(departure => <article key={departure.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"><div className="min-w-0"><p className="font-medium">{tourNames.get(departure.tourId) || `Тур ${departure.tourId}`}</p><p className="mt-1 text-sm">{dateLabel(departure.startDate)} — {dateLabel(departure.endDate)}</p><p className="mt-1 text-xs text-muted-foreground">{departure.status === 'open' ? 'Открыт' : 'Закрыт'} · свободно {departure.remainingSeats} из {departure.capacity} · подтверждено {departure.confirmedParticipants} · заявок ждут ответа {departure.pendingRequests}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={saving} onClick={() => editDeparture(departure)}>Изменить</Button><Button variant="outline" size="sm" disabled={saving} onClick={() => void runMutation(() => updateApiDeparture(departure.id, { status: departure.status === 'open' ? 'closed' : 'open' }), 'Приём заявок обновлён.')}>{departure.status === 'open' ? 'Закрыть' : 'Открыть'}</Button></div></article>)}</section>
  </div>;
}

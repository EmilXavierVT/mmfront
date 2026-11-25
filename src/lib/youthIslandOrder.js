import { getServingDateTime, isSpecialServing } from './youthIsland.js';

function formatDate(value, year = false) {
  const date = String(value || '').slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}.${match[2]}${year ? `.${match[1]}` : ''}` : 'Ikke angivet';
}

function dateRange(form) {
  const start = String(form.startDateTime || form.eventDate || '').slice(0, 10);
  const end = String(form.endDateTime || start).slice(0, 10);
  if (!start) return 'Ikke angivet';
  if (start === end) return formatDate(start, true);
  return `${formatDate(start, start.slice(0, 4) !== end.slice(0, 4))}-${formatDate(end, true)}`;
}

export function buildYouthCalendarSchedule(booking) {
  const customerName = booking.customerName?.trim() || 'Ungdomsøen booking';
  const servings = (booking.items || [])
    .map(item => ({ ...item, dateTime: getServingDateTime(item, booking) }))
    .filter(item => item.dateTime)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const lines = [];
  let previousDay = '';

  for (const serving of servings) {
    const day = serving.dateTime.slice(0, 10);
    if (day !== previousDay) {
      if (previousDay) lines.push('', formatDate(day));
      else lines.push(`${customerName}, ${formatDate(day)}`);
      previousDay = day;
    }
    const name = serving.productName?.trim() || 'Servering';
    lines.push(`${serving.dateTime.slice(11, 16)} ${name}`);
    const menu = serving.menu?.trim();
    if (menu && menu !== name) lines.push(`  ${menu}`);
    lines.push(`  ${Number(serving.guestCount) || 0} personer`);
    const room = serving.room?.trim();
    if (room && room !== booking.location?.trim()) lines.push(`  ${room}`);
  }

  return lines.join('\n');
}

export function buildYouthOrderSheet(form, user) {
  const items = form.items || [];
  const counts = [...new Set(items.map(item => Number(item.guestCount)).filter(count => count > 0))].sort((a, b) => a - b);
  const guests = !counts.length ? 'Ikke angivet' : counts.length === 1 ? String(counts[0]) : `${counts[0]}-${counts.at(-1)} (pr. servering)`;
  const groups = new Map();
  const sortedItems = items.map(item => ({ ...item, dateTime: getServingDateTime(item, form) }))
    .sort((a, b) => (a.dateTime || '9999').localeCompare(b.dateTime || '9999'));

  for (const item of sortedItems) {
    const date = item.dateTime.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    const details = [];
    if (counts.length > 1 && Number(item.guestCount) > 0) details.push(`${item.guestCount} personer`);
    if (item.room?.trim() && item.room.trim() !== form.location?.trim()) details.push(item.room.trim());
    if (isSpecialServing(item) && item.unitPriceOverride !== '' && item.unitPriceOverride != null) {
      const price = Number(item.unitPriceOverride);
      if (Number.isFinite(price)) details.push(`${price.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr. pr. person, ekskl. moms`);
    }
    const name = item.productName?.trim() || item.menu?.trim() || 'Servering';
    const menu = item.menu?.trim();
    groups.get(date).push([
      `${item.dateTime ? item.dateTime.slice(11, 16) : '--:--'} ${name}`,
      ...(menu && menu !== name ? [`  ${menu}`] : []),
      ...(details.length ? [`  ${details.join(' · ')}`] : []),
    ].join('\n'));
  }

  const servings = [...groups].map(([date, lines]) => `${formatDate(date)}\n${lines.join('\n')}`).join('\n\n');
  const orderedBy = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Ikke angivet';
  return {
    title: 'BESTILLINGSFORMULAR:',
    customerName: form.customerName?.trim() || 'Ny bestilling',
    rows: [
      ['Kunde', form.customerName?.trim() || 'Ikke angivet'],
      ['Dato', dateRange(form)],
      ['Antal', guests],
      ['Allergener', form.allergies?.trim() || 'Ingen angivet'],
      ['Forplejning', servings || 'Ingen serveringer'],
      ['Lokale', form.location?.trim() || 'Ikke angivet'],
      ['Spectra reservationsnummer', form.spectraReservationNumber?.trim() || 'Ikke angivet'],
      ['Andet', form.notes?.trim() || ''],
      ['Hvis der bestilles sunde & sprøde snacks, så skriv hvor mange fade der skal laves til', String(Number(form.snackTrayCount) || 0)],
    ],
    orderDate: formatDate(form.orderDate, true),
    orderedBy,
  };
}

export function youthOrderFilename(form) {
  const name = `${String(form.startDateTime || form.eventDate || '').slice(0, 10)}-${form.customerName || 'ungdomsoen-bestilling'}`
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ø/gi, 'o').replace(/æ/gi, 'ae')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${name || 'ungdomsoen-bestilling'}.pdf`;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { productApi } from '../../api/products.js';
import { getProductYear, normalizeProduct } from '../../lib/products.js';
import { youthIslandBookingApi } from '../../api/youthIslandBookings.js';
import { Icon } from '../Shared/Icon.jsx';
import './YouthIsland.css';

const emptyItem = () => ({
  guestCount: '',
  servingTime: '',
  productNumber: '',
  productName: '',
  menu: '',
  room: '',
});

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = () => ({
  customerName: '',
  eventDate: '',
  startDateTime: '',
  endDateTime: '',
  allergies: '',
  location: '',
  spectraReservationNumber: '',
  notes: '',
  snackTrayCount: '0',
  orderDate: today(),
  items: [emptyItem()],
});

const PAGE_TABS = {
  create: 'create',
  coming: 'coming',
  earlier: 'earlier',
  schedule: 'schedule',
};

function formatDate(value) {
  if (!value) return 'Ingen dato';
  const normalizedValue = String(value).includes('T') ? value : `${value}T12:00:00`;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium' }).format(date);
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : 'Ingen tid';
}

function normalizeTime(value) {
  return value?.length === 5 ? `${value}:00` : value;
}

function normalizeDateTime(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return 'Ikke registreret';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('da-DK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDuration(startValue, endValue) {
  if (!startValue || !endValue) return 'Ikke angivet';
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 'Ikke angivet';

  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min.`;
  if (remainingMinutes === 0) return `${hours} t.`;
  return `${hours} t. ${remainingMinutes} min.`;
}

function getBookingStartDateTime(booking) {
  if (booking?.startDateTime) return booking.startDateTime;
  if (!booking?.eventDate) return '';

  const firstServingTime = (booking.items || [])
    .map(item => String(item.servingTime || '').slice(0, 5))
    .find(Boolean);
  return `${booking.eventDate}T${firstServingTime || '09:00'}:00`;
}

function getBookingEndDateTime(booking) {
  if (booking?.endDateTime) return booking.endDateTime;
  if (!booking?.eventDate) return '';

  const servingTimes = (booking.items || [])
    .map(item => String(item.servingTime || '').slice(0, 5))
    .filter(Boolean)
    .sort();
  const lastServingTime = servingTimes.at(-1);
  return lastServingTime ? `${booking.eventDate}T${lastServingTime}:00` : '';
}

function getBookingDate(booking) {
  return String(getBookingStartDateTime(booking) || booking?.eventDate || '').slice(0, 10);
}

function bookingToForm(booking) {
  const startDateTime = getBookingStartDateTime(booking);

  return {
    customerName: booking.customerName || '',
    eventDate: getBookingDate(booking),
    startDateTime: toDateTimeInput(startDateTime),
    endDateTime: toDateTimeInput(getBookingEndDateTime(booking)),
    allergies: booking.allergies || '',
    location: booking.location || '',
    spectraReservationNumber: booking.spectraReservationNumber || '',
    notes: booking.notes || '',
    snackTrayCount: String(booking.snackTrayCount || 0),
    orderDate: booking.orderDate || today(),
    items: (booking.items || []).length > 0
      ? booking.items.map(item => ({
        id: item.id,
        guestCount: String(item.guestCount || ''),
        servingTime: String(item.servingTime || '').slice(0, 5),
        productNumber: item.productNumber || '',
        productName: item.productName || '',
        menu: item.menu || '',
        room: item.room || '',
      }))
      : [emptyItem()],
  };
}

function productOptionLabel(product) {
  return product.name;
}

function buildBookingDocument(form, user) {
  const lines = [
    'UNGDOMSOEN BESTILLING',
    '',
    `Arrangement: ${form.customerName || 'Ikke angivet'}`,
    `Start: ${formatDateTime(form.startDateTime)}`,
    `Slut: ${formatDateTime(form.endDateTime)}`,
    `Varighed: ${formatDuration(form.startDateTime, form.endDateTime)}`,
    `Bestillingsdato: ${formatDate(form.orderDate)}`,
    `Spectra reservationsnummer: ${form.spectraReservationNumber || 'Ikke angivet'}`,
    `Lokale eller omraade: ${form.location || 'Ikke angivet'}`,
    `Bestilles af: ${user?.email || 'Ikke angivet'}`,
    `Snackfade: ${Number(form.snackTrayCount) || 0}`,
    '',
    'FORPLEJNING',
    ...form.items.flatMap((item, index) => [
      '',
      `${index + 1}. ${item.productName || item.menu || 'Servering'}`,
      `   Antal: ${item.guestCount || 0}`,
      `   Tid: ${formatTime(item.servingTime)}`,
      `   Lokale: ${item.room || 'Ikke angivet'}`,
      `   Menu: ${item.menu || 'Ikke angivet'}`,
    ]),
    '',
    'ALLERGENER',
    form.allergies || 'Ingen angivet',
    '',
    'ANDET',
    form.notes || 'Intet angivet',
  ];

  return lines.join('\n');
}

function buildDownloadName(form) {
  const rawName = [
    form.startDateTime?.slice(0, 10) || form.eventDate || today(),
    form.customerName || 'ungdomsoen-bestilling',
  ].join('-');
  const safeName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeName || 'ungdomsoen-bestilling'}.txt`;
}

export function YouthIsland({ user }) {
  const [form, setForm] = useState(initialForm);
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePageTab, setActivePageTab] = useState(PAGE_TABS.create);

  const productOptions = useMemo(
    () => products
      .map(normalizeProduct)
      .filter(product => product.economicProductNumber)
      .filter(product => getProductYear(product) === 2026)
      .sort((a, b) => a.name.localeCompare(b.name, 'da')),
    [products],
  );

  const bookingDocumentText = useMemo(
    () => buildBookingDocument(form, user),
    [form, user],
  );

  const earlierBookings = useMemo(
    () => bookings
      .filter(booking => !getBookingDate(booking) || getBookingDate(booking) < today())
      .sort((a, b) => (
        String(getBookingStartDateTime(b) || '').localeCompare(String(getBookingStartDateTime(a) || ''))
        || Number(b.id || 0) - Number(a.id || 0)
      )),
    [bookings],
  );

  const scheduleBookings = useMemo(
    () => bookings
      .filter(booking => getBookingDate(booking) && getBookingDate(booking) >= today())
      .sort((a, b) => (
        String(getBookingStartDateTime(a) || '').localeCompare(String(getBookingStartDateTime(b) || ''))
        || Number(a.id || 0) - Number(b.id || 0)
      )),
    [bookings],
  );

  const upcomingOverviewBookings = useMemo(
    () => scheduleBookings.slice(0, 8),
    [scheduleBookings],
  );

  const pageTabs = useMemo(() => [
    { id: PAGE_TABS.create, label: editingId ? `Rediger #${editingId}` : 'Ny bestilling' },
    { id: PAGE_TABS.coming, label: `Kommende (${scheduleBookings.length})` },
    { id: PAGE_TABS.earlier, label: `Tidligere (${earlierBookings.length})` },
    { id: PAGE_TABS.schedule, label: 'Plan' },
  ], [editingId, earlierBookings.length, scheduleBookings.length]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await youthIslandBookingApi.getAll();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Bestillingerne kunne ikke hentes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const data = await productApi.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setProductsError(err.message || 'Produkterne kunne ikke hentes fra e-conomic.');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    youthIslandBookingApi.getAll()
      .then(data => {
        if (!ignore) setBookings(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!ignore) setError(err.message || 'Bestillingerne kunne ikke hentes.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    productApi.getAll()
      .then(data => {
        if (!ignore) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!ignore) setProductsError(err.message || 'Produkterne kunne ikke hentes fra e-conomic.');
      })
      .finally(() => {
        if (!ignore) setProductsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const updateStartDateTime = (value) => {
    setForm(current => ({
      ...current,
      startDateTime: value,
      eventDate: value ? value.slice(0, 10) : '',
    }));
  };

  const updateItem = (index, field, value) => {
    setForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const updateItemProduct = (index, productNumber) => {
    const product = productOptions.find(option => option.economicProductNumber === productNumber);
    setForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index
          ? {
            ...item,
            productNumber,
            productName: product?.name || '',
            menu: product?.name || item.menu,
          }
          : item
      )),
    }));
  };

  const addItem = () => {
    setForm(current => ({ ...current, items: [...current.items, emptyItem()] }));
  };

  const removeItem = (index) => {
    setForm(current => ({
      ...current,
      items: current.items.length === 1
        ? current.items
        : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const startEdit = (booking) => {
    setEditingId(booking.id);
    setForm(bookingToForm(booking));
    setActivePageTab(PAGE_TABS.create);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setSuccess('');
  };

  const downloadBookingDocument = () => {
    const blob = new Blob([bookingDocumentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildDownloadName(form);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const selectPageTab = (tab) => {
    setActivePageTab(tab);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const invalidItem = form.items.some(item => (
      !Number.isInteger(Number(item.guestCount))
      || Number(item.guestCount) < 1
      || !item.servingTime
      || !item.productNumber
      || !item.productName
      || !item.menu.trim()
      || !item.room.trim()
    ));

    if (!form.customerName.trim() || !form.startDateTime || !form.endDateTime || !form.spectraReservationNumber.trim()) {
      setError('Udfyld kunde, start, slut og Spectra reservationsnummer.');
      return;
    }

    const start = new Date(form.startDateTime);
    const end = new Date(form.endDateTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('Sluttidspunktet skal være efter starttidspunktet.');
      return;
    }

    if (invalidItem) {
      setError('Hver servering skal have antal, tidspunkt, e-conomic produkt, menu og lokale.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        customerName: form.customerName.trim(),
        eventDate: form.startDateTime.slice(0, 10),
        startDateTime: normalizeDateTime(form.startDateTime),
        endDateTime: normalizeDateTime(form.endDateTime),
        allergies: form.allergies.trim() || null,
        location: form.location.trim() || null,
        spectraReservationNumber: form.spectraReservationNumber.trim(),
        notes: form.notes.trim() || null,
        snackTrayCount: Number(form.snackTrayCount) || 0,
        items: form.items.map(item => ({
          guestCount: Number(item.guestCount),
          servingTime: normalizeTime(item.servingTime),
          productNumber: item.productNumber,
          productName: item.productName,
          menu: item.menu.trim(),
          room: item.room.trim(),
        })),
      };
      const saved = editingId
        ? await youthIslandBookingApi.update(editingId, payload)
        : await youthIslandBookingApi.create(payload);
      setBookings(current => (
        editingId
          ? current.map(booking => (booking.id === saved.id ? saved : booking))
          : [saved, ...current]
      ));
      setForm(initialForm());
      setEditingId(null);
      setSuccess(`Bestilling #${saved.id} er ${editingId ? 'opdateret' : 'gemt'}.`);
    } catch (err) {
      setError(err.message || 'Bestillingen kunne ikke gemmes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profile-page youth-island-page">
      <header className="youth-island-head">
        <div>
          <div className="section-eyebrow">Ungdomsøen</div>
          <h1>Bestillinger</h1>
          <p>{user?.email}</p>
        </div>
        <div className="youth-island-count">
          <strong>{bookings.length}</strong>
          <span>gemte bestillinger</span>
        </div>
      </header>

      <nav className="youth-page-tabs" aria-label="Ungdomsøen sections">
        {pageTabs.map(tab => (
          <button
            type="button"
            key={tab.id}
            className={activePageTab === tab.id ? 'active' : ''}
            aria-current={activePageTab === tab.id ? 'page' : undefined}
            onClick={() => selectPageTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activePageTab === PAGE_TABS.create && (
      <section className="youth-booking-workspace youth-tab-panel" aria-labelledby="new-youth-booking">
        <form className="youth-booking-form" onSubmit={submit}>
          <div className="youth-section-head">
            <div>
              <span>{editingId ? `Redigerer #${editingId}` : 'Ny bestilling'}</span>
              <h2 id="new-youth-booking">{editingId ? 'Opdater arrangement' : 'Arrangement'}</h2>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          {productsError && (
            <div className="form-error">
              {productsError}
              <button className="btn btn-cream" type="button" onClick={loadProducts} disabled={productsLoading}>
                Prøv igen
              </button>
            </div>
          )}

          <div className="youth-field-grid">
            <div className="field youth-field-wide">
              <label htmlFor="youth-customer">Kunde eller arrangement</label>
              <input
                id="youth-customer"
                value={form.customerName}
                onChange={event => updateField('customerName', event.target.value)}
                placeholder="Bestyrelsesmøde MGF FUØ"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="youth-start-date-time">Start</label>
              <input
                id="youth-start-date-time"
                type="datetime-local"
                value={form.startDateTime}
                onChange={event => updateStartDateTime(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="youth-end-date-time">Slut</label>
              <input
                id="youth-end-date-time"
                type="datetime-local"
                value={form.endDateTime}
                onChange={event => updateField('endDateTime', event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="youth-order-date">Bestillingsdato</label>
              <input
                id="youth-order-date"
                type="date"
                value={form.orderDate}
                onChange={event => updateField('orderDate', event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="youth-spectra">Spectra reservationsnummer</label>
              <input
                id="youth-spectra"
                value={form.spectraReservationNumber}
                onChange={event => updateField('spectraReservationNumber', event.target.value)}
                inputMode="numeric"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="youth-location">Lokale eller område</label>
              <input
                id="youth-location"
                value={form.location}
                onChange={event => updateField('location', event.target.value)}
                placeholder="Ungdomsøen"
              />
            </div>
            <div className="field youth-field-wide">
              <label htmlFor="youth-allergies">Allergener</label>
              <textarea
                id="youth-allergies"
                rows="3"
                value={form.allergies}
                onChange={event => updateField('allergies', event.target.value)}
              />
            </div>
          </div>

          <section className="youth-service-section">
            <div className="youth-service-heading">
              <div>
                <span>Forplejning</span>
                <h3>Bestilling</h3>
              </div>
              <button className="btn btn-cream" type="button" onClick={addItem}>
                <Icon name="plus" size={17} />
                Tilføj servering
              </button>
            </div>

            <div className="youth-service-list">
              {form.items.map((item, index) => (
                <div className="youth-service-row" key={`service-${index}`}>
                  <div className="youth-service-number">{index + 1}</div>
                  <div className="field">
                    <label htmlFor={`youth-guests-${index}`}>Antal</label>
                    <input
                      id={`youth-guests-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.guestCount}
                      onChange={event => updateItem(index, 'guestCount', event.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`youth-time-${index}`}>Tid</label>
                    <input
                      id={`youth-time-${index}`}
                      type="time"
                      value={item.servingTime}
                      onChange={event => updateItem(index, 'servingTime', event.target.value)}
                      required
                    />
                  </div>
                  <div className="field youth-service-product">
                    <label htmlFor={`youth-product-${index}`}>e-conomic produkt</label>
                    <select
                      id={`youth-product-${index}`}
                      value={item.productNumber}
                      onChange={event => updateItemProduct(index, event.target.value)}
                      disabled={productsLoading || productOptions.length === 0}
                      required
                    >
                      <option value="">
                        {productsLoading ? 'Henter produkter...' : 'Vælg produkt'}
                      </option>
                      {productOptions.map(product => (
                        <option key={product.economicProductNumber} value={product.economicProductNumber}>
                          {productOptionLabel(product)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field youth-service-menu">
                    <label htmlFor={`youth-menu-${index}`}>Menu</label>
                    <input
                      id={`youth-menu-${index}`}
                      value={item.menu}
                      onChange={event => updateItem(index, 'menu', event.target.value)}
                      placeholder="Vegetarisk hovedret med brød"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`youth-room-${index}`}>Lokale</label>
                    <input
                      id={`youth-room-${index}`}
                      value={item.room}
                      onChange={event => updateItem(index, 'room', event.target.value)}
                      placeholder="Artilleri"
                      required
                    />
                  </div>
                  <button
                    className="icon-btn youth-remove-service"
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length === 1}
                    aria-label={`Fjern servering ${index + 1}`}
                    title="Fjern servering"
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="youth-field-grid youth-final-fields">
            <div className="field">
              <label htmlFor="youth-snacks">Fade med sunde og sprøde snacks</label>
              <input
                id="youth-snacks"
                type="number"
                min="0"
                step="1"
                value={form.snackTrayCount}
                onChange={event => updateField('snackTrayCount', event.target.value)}
              />
            </div>
            <div className="field youth-field-wide">
              <label htmlFor="youth-notes">Andet</label>
              <textarea
                id="youth-notes"
                rows="4"
                value={form.notes}
                onChange={event => updateField('notes', event.target.value)}
              />
            </div>
          </div>

          <div className="youth-submit-row">
            <div>
              <span>Bestilles af</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="youth-submit-actions">
              {editingId && (
                <button className="btn btn-cream" type="button" onClick={cancelEdit} disabled={saving}>
                  Annuller
                </button>
              )}
              <button className="btn btn-blue" type="submit" disabled={saving}>
                {saving ? 'Gemmer...' : editingId ? 'Gem ændringer' : 'Send bestilling'}
                {!saving && <Icon name={editingId ? 'check' : 'arrow'} size={18} />}
              </button>
            </div>
          </div>
        </form>

        <aside className="youth-booking-preview" aria-label="Forhåndsvisning af bestillingsdokument">
          <div className="youth-preview-head">
            <div>
              <span>Dokument</span>
              <h2>Preview</h2>
            </div>
            <button className="btn btn-cream" type="button" onClick={downloadBookingDocument}>
              <Icon name="download" size={17} />
              Download
            </button>
          </div>

          <div className="youth-document">
            <div className="youth-document-top">
              <span>Ungdomsøen</span>
              <strong>Bestilling</strong>
            </div>
            <h3>{form.customerName || 'Ny bestilling'}</h3>
            <dl className="youth-document-meta">
              <div><dt>Start</dt><dd>{formatDateTime(form.startDateTime)}</dd></div>
              <div><dt>Slut</dt><dd>{formatDateTime(form.endDateTime)}</dd></div>
              <div><dt>Varighed</dt><dd>{formatDuration(form.startDateTime, form.endDateTime)}</dd></div>
              <div><dt>Spectra</dt><dd>{form.spectraReservationNumber || 'Ikke angivet'}</dd></div>
              <div><dt>Lokale</dt><dd>{form.location || 'Ikke angivet'}</dd></div>
            </dl>

            <div className="youth-document-section">
              <h4>Forplejning</h4>
              <div className="youth-document-lines">
                {form.items.map((item, index) => (
                  <div key={`preview-${index}`}>
                    <strong>{item.productName || item.menu || `Servering ${index + 1}`}</strong>
                    <span>{item.guestCount || 0} personer · {formatTime(item.servingTime)} · {item.room || 'Lokale ikke angivet'}</span>
                    {item.menu && <p>{item.menu}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="youth-document-section">
              <h4>Allergener</h4>
              <p>{form.allergies || 'Ingen angivet'}</p>
            </div>

            <div className="youth-document-section">
              <h4>Andet</h4>
              <p>{form.notes || 'Intet angivet'}</p>
            </div>

            <div className="youth-document-footer">
              <span>Bestilt af</span>
              <strong>{user?.email || 'Ikke angivet'}</strong>
            </div>
          </div>
        </aside>
      </section>
      )}

      {activePageTab === PAGE_TABS.coming && (
      <section className="youth-upcoming-overview youth-tab-panel" aria-labelledby="youth-upcoming-title">
        <div className="profile-section-head youth-upcoming-head">
          <div>
            <div className="section-eyebrow">Coming bookings</div>
            <h2 id="youth-upcoming-title">Kommende bestillinger</h2>
          </div>
          <strong>{scheduleBookings.length} planlagt</strong>
        </div>

        {loading && <div className="profile-empty">Henter kommende bestillinger...</div>}
        {!loading && upcomingOverviewBookings.length === 0 && (
          <div className="profile-empty">Der er ingen kommende bestillinger endnu.</div>
        )}
        {!loading && upcomingOverviewBookings.length > 0 && (
          <div className="youth-upcoming-list">
            {upcomingOverviewBookings.map(booking => (
              <article className="youth-upcoming-item" key={`upcoming-${booking.id}`}>
                <time dateTime={getBookingStartDateTime(booking) || ''}>{formatDateTime(getBookingStartDateTime(booking))}</time>
                <div>
                  <strong>{booking.customerName}</strong>
                  <span>
                    {formatDuration(getBookingStartDateTime(booking), getBookingEndDateTime(booking))}
                    {booking.location ? ` · ${booking.location}` : ''}
                  </span>
                </div>
                <button className="btn btn-cream" type="button" onClick={() => startEdit(booking)}>
                  <Icon name="edit" size={16} />
                  Rediger
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {activePageTab === PAGE_TABS.earlier && (
      <section className="youth-booking-history youth-tab-panel" aria-labelledby="youth-booking-history-title">
        <div className="profile-section-head youth-history-head">
          <div>
            <div className="section-eyebrow">Overblik</div>
            <h2 id="youth-booking-history-title">Tidligere bestillinger</h2>
          </div>
          <button className="btn btn-cream" type="button" onClick={loadBookings} disabled={loading}>
            <Icon name="refresh" size={17} />
            {loading ? 'Henter...' : 'Opdater'}
          </button>
        </div>

        {loading && <div className="profile-empty">Henter bestillinger...</div>}
        {!loading && bookings.length === 0 && <div className="profile-empty">Der er endnu ingen bestillinger.</div>}
        {!loading && bookings.length > 0 && earlierBookings.length === 0 && (
          <div className="profile-empty">Der er endnu ingen tidligere bestillinger.</div>
        )}

        {!loading && earlierBookings.length > 0 && (
          <div className="youth-history-list">
            {earlierBookings.map(booking => (
              <details className="youth-history-item" key={booking.id}>
                <summary>
                  <div>
                    <span>{formatDateTime(getBookingStartDateTime(booking))}</span>
                    <strong>{booking.customerName}</strong>
                  </div>
                  <dl>
                    <div><dt>Spectra</dt><dd>{booking.spectraReservationNumber}</dd></div>
                    <div><dt>Bestilt af</dt><dd>{booking.orderedByName || booking.orderedByEmail}</dd></div>
                  </dl>
                  <Icon name="chev" size={20} />
                </summary>
                <div className="youth-history-detail">
                  <dl className="youth-history-meta">
                    <div><dt>Start</dt><dd>{formatDateTime(getBookingStartDateTime(booking))}</dd></div>
                    <div><dt>Slut</dt><dd>{formatDateTime(getBookingEndDateTime(booking))}</dd></div>
                    <div><dt>Varighed</dt><dd>{formatDuration(getBookingStartDateTime(booking), getBookingEndDateTime(booking))}</dd></div>
                    <div><dt>Bestillingsdato</dt><dd>{formatDate(booking.orderDate)}</dd></div>
                    <div><dt>Lokale eller område</dt><dd>{booking.location || 'Ikke angivet'}</dd></div>
                    <div><dt>Allergener</dt><dd>{booking.allergies || 'Ingen angivet'}</dd></div>
                    <div><dt>Snackfade</dt><dd>{booking.snackTrayCount || 0}</dd></div>
                    <div><dt>Senest opdateret</dt><dd>{formatDateTime(booking.updatedAt)}</dd></div>
                    <div className="youth-history-wide"><dt>Andet</dt><dd>{booking.notes || 'Intet angivet'}</dd></div>
                  </dl>
                  <div className="youth-history-services">
                    {(booking.items || []).map((item, index) => (
                      <div key={item.id || `${booking.id}-${index}`}>
                        <strong>{item.guestCount} personer</strong>
                        <span>{formatTime(item.servingTime)} · {item.room}</span>
                        <p>
                          {item.productName && <b>{item.productName}</b>}
                          {item.menu}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="youth-history-actions">
                    <button className="btn btn-cream" type="button" onClick={() => startEdit(booking)}>
                      <Icon name="edit" size={17} />
                      Rediger bestilling
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
      )}

      {activePageTab === PAGE_TABS.schedule && (
      <section className="youth-booking-history youth-tab-panel" aria-labelledby="youth-schedule-title">
        <div className="profile-section-head youth-history-head">
          <div>
            <div className="section-eyebrow">Plan</div>
            <h2 id="youth-schedule-title">Schedule</h2>
          </div>
          <button className="btn btn-cream" type="button" onClick={loadBookings} disabled={loading}>
            <Icon name="refresh" size={17} />
            {loading ? 'Henter...' : 'Opdater'}
          </button>
        </div>

        {loading && <div className="profile-empty">Henter bestillinger...</div>}
        {!loading && bookings.length === 0 && <div className="profile-empty">Der er endnu ingen bestillinger.</div>}
        {!loading && bookings.length > 0 && scheduleBookings.length === 0 && (
          <div className="profile-empty">Der er ingen kommende bestillinger i kalenderen.</div>
        )}

        {!loading && scheduleBookings.length > 0 && (
          <div className="youth-schedule-list">
            {scheduleBookings.map(booking => (
              <article className="youth-schedule-item" key={`schedule-${booking.id}`}>
                <time dateTime={getBookingStartDateTime(booking) || ''}>
                  <strong>{formatDateTime(getBookingStartDateTime(booking))}</strong>
                  <span>{formatDuration(getBookingStartDateTime(booking), getBookingEndDateTime(booking))}</span>
                </time>
                <div className="youth-schedule-body">
                  <h3>{booking.customerName}</h3>
                  <dl>
                    <div><dt>Spectra</dt><dd>{booking.spectraReservationNumber}</dd></div>
                    <div><dt>Lokale</dt><dd>{booking.location || 'Ikke angivet'}</dd></div>
                  </dl>
                  <div className="youth-schedule-services">
                    {(booking.items || []).map((item, index) => (
                      <span key={item.id || `${booking.id}-schedule-${index}`}>
                        {formatTime(item.servingTime)} · {item.room} · {item.productName || item.menu}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-cream" type="button" onClick={() => startEdit(booking)}>
                  <Icon name="edit" size={17} />
                  Rediger
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      )}
    </main>
  );
}

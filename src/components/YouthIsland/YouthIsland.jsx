import { useCallback, useEffect, useMemo, useState } from 'react';
import { productApi } from '../../api/products.js';
import { getProductYear, normalizeProduct } from '../../lib/products.js';
import { findSpecialServingProduct, getServingDateTime, isSpecialServing as isSpecialItem } from '../../lib/youthIsland.js';
import { buildYouthOrderSheet, youthOrderFilename } from '../../lib/youthIslandOrder.js';
import { youthIslandBookingApi } from '../../api/youthIslandBookings.js';
import { Icon } from '../Shared/Icon.jsx';
import { DateTimeInput } from './DateTimeInput.jsx';
import { BookingHistory } from './BookingHistory.jsx';
import { ProductPicker } from './ProductPicker.jsx';
import { YouthOrderSheet } from './YouthOrderSheet.jsx';
import './YouthIsland.css';

const emptyItem = (overrides = {}) => ({
  clientId: crypto.randomUUID(),
  guestCount: '',
  servingDateTime: '',
  productNumber: '',
  productName: '',
  unitPriceOverride: '',
  menu: '',
  room: '',
  ...overrides,
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

  const firstServing = (booking.items || [])
    .map(item => getServingDateTime(item, booking))
    .filter(Boolean)
    .sort()[0];
  return firstServing || `${booking.eventDate}T09:00:00`;
}

function getBookingEndDateTime(booking) {
  if (booking?.endDateTime) return booking.endDateTime;
  if (!booking?.eventDate) return '';

  const servingDateTimes = (booking.items || [])
    .map(item => getServingDateTime(item, booking))
    .filter(Boolean)
    .sort();
  return servingDateTimes.at(-1) || '';
}

function getBookingDate(booking) {
  return String(getBookingStartDateTime(booking) || booking?.eventDate || '').slice(0, 10);
}

function getLatestEdit(booking) {
  const editHistory = Array.isArray(booking?.editHistory) ? booking.editHistory : [];
  return editHistory.at(-1) || null;
}

function formatEditor(edit) {
  if (!edit) return 'Ikke redigeret endnu';
  return edit.editedByName || edit.editedByEmail || 'Ukendt bruger';
}

function bookingToForm(booking) {
  const startDateTime = getBookingStartDateTime(booking);

  return {
    version: booking.version,
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
      ? booking.items.map(item => emptyItem({
        id: item.id,
        guestCount: String(item.guestCount || ''),
        servingDateTime: toDateTimeInput(getServingDateTime(item, booking)),
        productNumber: item.productNumber || '',
        productName: item.productName || '',
        unitPriceOverride: item.unitPriceOverride == null ? '' : String(item.unitPriceOverride),
        menu: item.menu || '',
        room: item.room || '',
      }))
      : [emptyItem()],
  };
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
  const [downloading, setDownloading] = useState(false);
  const [conflict, setConflict] = useState(false);
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

  const diverseProduct = useMemo(
    () => findSpecialServingProduct(products),
    [products],
  );

  const editingBooking = useMemo(
    () => bookings.find(booking => booking.id === editingId) || null,
    [bookings, editingId],
  );

  const orderSheet = useMemo(
    () => buildYouthOrderSheet(form, editingBooking
      ? { name: editingBooking.orderedByName, email: editingBooking.orderedByEmail }
      : user),
    [form, user, editingBooking],
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
      items: current.items.map(item => item.servingDateTime ? item : { ...item, servingDateTime: value }),
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
            unitPriceOverride: '',
            menu: product?.name || item.menu,
          }
          : item
      )),
    }));
  };

  const addItem = () => {
    setForm(current => ({ ...current, items: [emptyItem({ servingDateTime: current.startDateTime, autoFocus: true }), ...current.items] }));
  };

  const addSpecialItem = () => {
    if (!diverseProduct) {
      setError('Produktet DIVERSE SALG (1019) kunne ikke findes i e-conomic. Opdater produktlisten og prøv igen.');
      return;
    }
    setError('');
    setForm(current => ({
      ...current,
      items: [emptyItem({ productNumber: diverseProduct.economicProductNumber, servingDateTime: current.startDateTime, autoFocus: true }), ...current.items],
    }));
  };

  const updateSpecialItemName = (index, value) => {
    setForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, productName: value, menu: value } : item
      )),
    }));
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
    setConflict(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setSuccess('');
    setConflict(false);
  };

  const reloadEditingBooking = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const latest = await youthIslandBookingApi.getById(editingId);
      setBookings(current => current.map(booking => booking.id === latest.id ? latest : booking));
      setForm(bookingToForm(latest));
      setConflict(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Bestillingen kunne ikke genindlæses.');
    } finally {
      setSaving(false);
    }
  };

  const downloadBookingDocument = async () => {
    setDownloading(true);
    setError('');
    try {
      const { downloadYouthOrderPdf } = await import('../../lib/youthIslandPdf.js');
      await downloadYouthOrderPdf(orderSheet, youthOrderFilename(form));
    } catch (err) {
      setError(err.message || 'PDF-filen kunne ikke oprettes. Prøv igen.');
    } finally {
      setDownloading(false);
    }
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
      || !item.servingDateTime
      || Number.isNaN(new Date(item.servingDateTime).getTime())
      || !item.productNumber
      || !item.productName
      || (isSpecialItem(item) && (
        item.unitPriceOverride === ''
        || !Number.isFinite(Number(item.unitPriceOverride))
        || Number(item.unitPriceOverride) < 0
      ))
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
      setError('Hver servering skal have antal, dato og tid samt et produkt eller specialnavn med pris.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        version: form.version,
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
          id: item.id,
          guestCount: Number(item.guestCount),
          servingDateTime: normalizeDateTime(item.servingDateTime),
          servingTime: normalizeDateTime(item.servingDateTime).slice(11),
          productNumber: item.productNumber,
          productName: item.productName,
          unitPriceOverride: isSpecialItem(item) ? Number(item.unitPriceOverride) : null,
          menu: item.menu.trim() || null,
          room: item.room.trim() || null,
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
      setConflict(err.status === 409);
      setError(err.status === 409
        ? 'En anden person har gemt en nyere version. Dine ændringer står stadig i formularen. Hent nyeste version for at fortsætte; det erstatter dine ikke-gemte ændringer.'
        : err.message || 'Bestillingen kunne ikke gemmes.');
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
              {editingBooking && (
                <p className="youth-edit-attribution">
                  Oprettet af {editingBooking.orderedByName || editingBooking.orderedByEmail}
                  {getLatestEdit(editingBooking) && (
                    <> · Senest redigeret af {formatEditor(getLatestEdit(editingBooking))} {formatDateTime(getLatestEdit(editingBooking).editedAt)}</>
                  )}
                </p>
              )}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
          {conflict && <button className="btn btn-cream" type="button" onClick={reloadEditingBooking} disabled={saving}>Hent nyeste version</button>}
          {success && <div className="form-success">{success}</div>}
          {editingBooking && <BookingHistory key={`${editingBooking.id}-${editingBooking.version}`} booking={editingBooking} />}
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
            <div className="field youth-field-wide youth-datetime-field">
              <label htmlFor="youth-start-date-time">Start</label>
              <DateTimeInput
                id="youth-start-date-time"
                label="Startdato og tid"
                value={form.startDateTime}
                onChange={updateStartDateTime}
                required
              />
            </div>
            <div className="field youth-field-wide youth-datetime-field">
              <label htmlFor="youth-end-date-time">Slut</label>
              <DateTimeInput
                id="youth-end-date-time"
                label="Slutdato og tid"
                value={form.endDateTime}
                onChange={value => updateField('endDateTime', value)}
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
              <div className="youth-service-actions">
                <button className="btn btn-cream" type="button" onClick={addItem}>
                  <Icon name="plus" size={17} />
                  Tilføj servering
                </button>
                <button
                  className="btn btn-cream"
                  type="button"
                  onClick={addSpecialItem}
                  disabled={productsLoading || !diverseProduct}
                >
                  <Icon name="plus" size={17} />
                  Tilføj en speciel servering
                </button>
              </div>
            </div>

            <div className="youth-service-list">
              {form.items.map((item, index) => (
                <div className="youth-service-row" key={item.clientId}>
                  <div className="youth-service-number">{index + 1}</div>
                  <div className="field">
                    <label htmlFor={`youth-guests-${index}`}>Antal</label>
                    <input
                      id={`youth-guests-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      autoFocus={item.autoFocus}
                      value={item.guestCount}
                      onChange={event => updateItem(index, 'guestCount', event.target.value)}
                      required
                    />
                  </div>
                  <div className="field youth-service-datetime">
                    <label htmlFor={`youth-time-${index}`}>Dato og tid</label>
                    <DateTimeInput
                      id={`youth-time-${index}`}
                      label={`Servering ${index + 1}, dato og tid`}
                      value={item.servingDateTime}
                      onChange={value => updateItem(index, 'servingDateTime', value)}
                      required
                    />
                  </div>
                  <div className="field youth-service-product">
                    {isSpecialItem(item) ? (
                      <>
                        <label htmlFor={`youth-special-name-${index}`}>Navn</label>
                        <input
                          id={`youth-special-name-${index}`}
                          value={item.productName}
                          onChange={event => updateSpecialItemName(index, event.target.value)}
                          placeholder="Speciel servering"
                          required
                        />
                      </>
                    ) : (
                      <ProductPicker
                        id={`youth-product-${index}`}
                        products={productOptions}
                        value={item.productNumber}
                        selectedName={item.productName}
                        onChange={value => updateItemProduct(index, value)}
                        disabled={productsLoading || productOptions.length === 0}
                      />
                    )}
                  </div>
                  <div className="field youth-service-menu">
                    {isSpecialItem(item) ? (
                      <>
                        <label htmlFor={`youth-special-price-${index}`}>Pris pr. person, ekskl. moms</label>
                        <input
                          id={`youth-special-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPriceOverride}
                          onChange={event => updateItem(index, 'unitPriceOverride', event.target.value)}
                          placeholder="0,00"
                          required
                        />
                      </>
                    ) : (
                      <>
                        <label htmlFor={`youth-menu-${index}`}>Menu (valgfri)</label>
                        <input
                          id={`youth-menu-${index}`}
                          value={item.menu}
                          onChange={event => updateItem(index, 'menu', event.target.value)}
                          placeholder="Vegetarisk hovedret med brød"
                        />
                      </>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor={`youth-room-${index}`}>Lokale (valgfri)</label>
                    <input
                      id={`youth-room-${index}`}
                      value={item.room}
                      onChange={event => updateItem(index, 'room', event.target.value)}
                      placeholder="Artilleri"
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
              <h2>Bestillingsformular</h2>
            </div>
            <button className="btn btn-cream" type="button" onClick={downloadBookingDocument} disabled={downloading}>
              <Icon name="download" size={17} />
              {downloading ? 'Opretter PDF...' : 'Download PDF'}
            </button>
          </div>

          <YouthOrderSheet sheet={orderSheet} />
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
                  {getLatestEdit(booking) && (
                    <span>Senest redigeret af {formatEditor(getLatestEdit(booking))}</span>
                  )}
                </div>
                <button className="btn btn-cream" type="button" onClick={() => startEdit(booking)}>
                  <Icon name="edit" size={16} />
                  Rediger
                </button>
                <BookingHistory key={`${booking.id}-${booking.version}`} booking={booking} />
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
                    <div><dt>Senest redigeret af</dt><dd>{formatEditor(getLatestEdit(booking))}</dd></div>
                    <div className="youth-history-wide"><dt>Andet</dt><dd>{booking.notes || 'Intet angivet'}</dd></div>
                  </dl>
                  <div className="youth-history-services">
                    {(booking.items || []).map((item, index) => (
                      <div key={item.id || `${booking.id}-${index}`}>
                        <strong>{item.guestCount} personer</strong>
                        <span>{formatDateTime(getServingDateTime(item, booking))} · {item.room}</span>
                        <p>
                          {item.productName && <b>{item.productName}</b>}
                          {item.menu}
                        </p>
                      </div>
                    ))}
                  </div>
                  <BookingHistory key={`${booking.id}-${booking.version}`} booking={booking} />
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
                    <div><dt>Senest redigeret af</dt><dd>{formatEditor(getLatestEdit(booking))}</dd></div>
                  </dl>
                  <div className="youth-schedule-services">
                    {(booking.items || []).map((item, index) => (
                      <span key={item.id || `${booking.id}-schedule-${index}`}>
                        {formatDateTime(getServingDateTime(item, booking))} · {item.room} · {item.productName || item.menu}
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

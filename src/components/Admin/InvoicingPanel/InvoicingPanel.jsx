import { useMemo, useState } from 'react';
import { cleaningInvoiceApi, youthIslandInvoiceApi } from '../../../api/cleaningInvoices.js';
import { Icon } from '../../Shared/Icon.jsx';

function getPreviousMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
}

function formatHours(value) {
  const hours = Number(value || 0);
  return `${hours.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} h`;
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

function formatTime(value) {
  return String(value || '').slice(0, 5);
}

function isCleaningProduct(product) {
  const haystack = [
    product?.name,
    product?.description,
    product?.economicProductGroupName,
  ].join(' ').toLowerCase();

  return haystack.includes('cleaning') || haystack.includes('rengøring') || haystack.includes('rengoring');
}

function isYouthIslandEventCustomer(customer) {
  const name = String(customer?.name || '').toLowerCase();
  const youthIsland = name.includes('ungdomsø') || name.includes('ungdomso') || name.includes('youth island');
  return youthIsland && name.includes('event');
}

function getYouthIslandCustomerRank(customer) {
  const name = String(customer?.name || '').toLowerCase();
  if (name === 'ungdomsø event') return 0;
  if (name === 'ungdomsøen event #1') return 0;
  if (name.includes('ungdomsø event') || name.includes('ungdomsøen event #1')) return 1;
  if (isYouthIslandEventCustomer(customer)) return 2;
  return 3;
}

export function InvoicingPanel({
  products,
  productsLoading,
  productsError,
  customers = [],
  customersLoading = false,
  customersError = '',
  onRefreshProducts,
  onRefreshCustomers,
}) {
  const [invoiceMode, setInvoiceMode] = useState('cleaning');

  const [invoiceMonth, setInvoiceMonth] = useState(getPreviousMonth);
  const [productNumber, setProductNumber] = useState('');
  const [bookAndSend, setBookAndSend] = useState(true);
  const [force, setForce] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [youthStartDate, setYouthStartDate] = useState(getToday);
  const [youthCustomerNumber, setYouthCustomerNumber] = useState('');
  const [applyYouthEventDiscount, setApplyYouthEventDiscount] = useState(true);
  const [youthBookAndSend, setYouthBookAndSend] = useState(true);
  const [youthForce, setYouthForce] = useState(false);
  const [youthPreview, setYouthPreview] = useState(null);
  const [youthLoading, setYouthLoading] = useState(false);
  const [youthCreating, setYouthCreating] = useState(false);
  const [youthError, setYouthError] = useState('');
  const [youthSuccess, setYouthSuccess] = useState('');

  const cleaningProducts = useMemo(() => (
    products
      .filter(product => product?.economicProductNumber)
      .filter(isCleaningProduct)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'da'))
  ), [products]);

  const youthCustomerOptions = useMemo(() => (
    customers
      .filter(customer => customer?.customerNumber)
      .filter(isYouthIslandEventCustomer)
      .sort((a, b) => {
        const youthA = getYouthIslandCustomerRank(a);
        const youthB = getYouthIslandCustomerRank(b);
        return youthA - youthB || String(a.name || '').localeCompare(String(b.name || ''), 'da');
      })
  ), [customers]);

  const selectedProductNumber = productNumber || cleaningProducts[0]?.economicProductNumber || '';
  const selectedYouthCustomerNumber = youthCustomerOptions.some(
    customer => String(customer.customerNumber) === String(youthCustomerNumber),
  )
    ? youthCustomerNumber
    : youthCustomerOptions[0]?.customerNumber || '';
  const billableLines = preview?.lines?.filter(line => !line.alreadyInvoiced || force) || [];
  const youthBillableInvoices = youthPreview?.invoices?.filter(invoice => !invoice.alreadyInvoiced || youthForce) || [];
  const youthCanCreate = youthPreview && youthBillableInvoices.length > 0;

  async function handlePreview(event) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const nextPreview = await cleaningInvoiceApi.preview({
        invoiceMonth,
        productNumber: selectedProductNumber || null,
      });
      setPreview(nextPreview);
    } catch (err) {
      setError(err.message || 'Could not preview cleaning invoices.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!selectedProductNumber || !preview || creating) return;

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const result = await cleaningInvoiceApi.create({
        invoiceMonth,
        productNumber: selectedProductNumber || null,
        bookAndSend,
        force,
      });
      setPreview(result);
      setSuccess(bookAndSend ? 'Cleaning invoices were created, booked, and sent.' : 'Cleaning draft invoices were created.');
    } catch (err) {
      setError(err.message || 'Could not create cleaning invoices.');
    } finally {
      setCreating(false);
    }
  }

  async function handleYouthPreview(event) {
    event.preventDefault();

    setYouthLoading(true);
    setYouthError('');
    setYouthSuccess('');

    try {
      const nextPreview = await youthIslandInvoiceApi.preview({
        startDate: youthStartDate,
        customerNumber: selectedYouthCustomerNumber ? Number(selectedYouthCustomerNumber) : null,
        applyEventDiscount: applyYouthEventDiscount,
      });
      setYouthPreview(nextPreview);
    } catch (err) {
      setYouthError(err.message || 'Could not preview Ungdomsøen invoice.');
    } finally {
      setYouthLoading(false);
    }
  }

  async function handleYouthCreate() {
    if (!youthPreview || youthCreating) return;

    setYouthCreating(true);
    setYouthError('');
    setYouthSuccess('');

    try {
      const result = await youthIslandInvoiceApi.create({
        startDate: youthStartDate,
        customerNumber: selectedYouthCustomerNumber ? Number(selectedYouthCustomerNumber) : null,
        applyEventDiscount: applyYouthEventDiscount,
        bookAndSend: youthBookAndSend,
        force: youthForce,
      });
      setYouthPreview(result);
      setYouthSuccess(youthBookAndSend ? 'Ungdomsøen invoices were created, booked, and sent.' : 'Ungdomsøen draft invoices were created.');
    } catch (err) {
      setYouthError(err.message || 'Could not create Ungdomsøen invoice.');
    } finally {
      setYouthCreating(false);
    }
  }

  return (
    <section className="profile-requests admin-users">
      <div className="admin-email-source-tabs admin-invoice-tabs" role="tablist" aria-label="Invoice type">
        <button
          type="button"
          className={invoiceMode === 'cleaning' ? 'active' : ''}
          onClick={() => setInvoiceMode('cleaning')}
        >
          Cleaning
        </button>
        <button
          type="button"
          className={invoiceMode === 'youth' ? 'active' : ''}
          onClick={() => setInvoiceMode('youth')}
        >
          Ungdomsøen
        </button>
      </div>

      {invoiceMode === 'cleaning' && (
        <>
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Monthly invoicing</span>
              <h2>{preview?.totalCustomers ?? 0}</h2>
              <p>Cleaning customers ready for the selected month.</p>
            </div>
            <div className="profile-panel accent">
              <span>Total</span>
              <h2>{formatMoney(preview?.totalNetAmount)}</h2>
              <p>{formatHours(preview?.totalHours)} across {preview?.totalAppointments ?? 0} appointments.</p>
            </div>
          </section>

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">e-conomic</div>
              <h2>Cleaning invoicing</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={onRefreshProducts} disabled={productsLoading}>
              Refresh products <Icon name="arrow" size={18} />
            </button>
          </div>

          {productsError && <div className="form-error">{productsError}</div>}
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <form className="admin-product-form" onSubmit={handlePreview}>
            <div className="field-row">
              <div className="field">
                <label>Invoice month</label>
                <input
                  type="month"
                  value={invoiceMonth}
                  onChange={event => {
                    setInvoiceMonth(event.target.value);
                    setPreview(null);
                  }}
                />
              </div>
              <div className="field">
                <label>Rengøring product</label>
                <select
                  value={selectedProductNumber}
                  onChange={event => {
                    setProductNumber(event.target.value);
                    setPreview(null);
                  }}
                  disabled={productsLoading || !cleaningProducts.length}
                >
                  {!cleaningProducts.length && <option value="">No Rengøring product found</option>}
                  {cleaningProducts.map(product => (
                    <option key={product.economicProductNumber} value={product.economicProductNumber}>
                      {product.name} · {formatMoney(product.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={bookAndSend}
                onChange={event => setBookAndSend(event.target.checked)}
              />
              <span>Book and send invoices by email after creating them</span>
            </label>
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={force}
                onChange={event => setForce(event.target.checked)}
              />
              <span>Allow duplicate invoices for already invoiced customers</span>
            </label>

            <div className="admin-product-form-actions">
              <button className="btn btn-blue" type="submit" disabled={loading || productsLoading}>
                {loading ? 'Previewing...' : 'Preview invoices'}
                <Icon name="arrow" size={18} />
              </button>
              <button
                className="btn btn-cream"
                type="button"
                onClick={handleCreate}
                disabled={creating || !preview || !billableLines.length}
              >
                {creating ? 'Creating...' : (bookAndSend ? 'Create and send' : 'Create drafts')}
                <Icon name="check" size={18} />
              </button>
            </div>
          </form>

          {preview && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Appointments</th>
                    <th>Hours</th>
                    <th>Unit price</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.lines.map(line => (
                    <tr key={line.customerNumber}>
                      <td>
                        <strong>{line.customerName}</strong>
                        <small>#{line.customerNumber}</small>
                      </td>
                      <td>{line.appointmentCount}</td>
                      <td>{formatHours(line.quantityHours)}</td>
                      <td>{formatMoney(line.unitNetPrice)}</td>
                      <td>{formatMoney(line.netAmount)}</td>
                      <td>
                        {line.error
                          ? line.error
                          : line.alreadyInvoiced
                            ? `${line.status || 'Invoiced'} ${line.bookedInvoiceNumber ? `#${line.bookedInvoiceNumber}` : line.draftInvoiceNumber ? `draft #${line.draftInvoiceNumber}` : ''}`
                            : 'Ready'}
                      </td>
                    </tr>
                  ))}
                  {!preview.lines.length && (
                    <tr>
                      <td colSpan="6">No billable cleaning appointments found for this month.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {invoiceMode === 'youth' && (
        <>
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Weekly invoicing</span>
              <h2>{youthPreview?.invoiceCount ?? 0}</h2>
              <p>Separate event invoices ready from the selected start date.</p>
            </div>
            <div className="profile-panel accent">
              <span>Total</span>
              <h2>{formatMoney(youthPreview?.totalNetAmount)}</h2>
              <p>{youthPreview?.lineCount ?? 0} lines across {youthPreview?.bookingCount ?? 0} events.</p>
            </div>
          </section>

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">e-conomic</div>
              <h2>Ungdomsøen invoicing</h2>
            </div>
            <div className="admin-product-form-actions">
              <button className="btn btn-blue" type="button" onClick={onRefreshCustomers} disabled={customersLoading}>
                Refresh customers <Icon name="arrow" size={18} />
              </button>
              <button className="btn btn-cream" type="button" onClick={onRefreshProducts} disabled={productsLoading}>
                Refresh products <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>

          {productsError && <div className="form-error">{productsError}</div>}
          {customersError && <div className="form-error">{customersError}</div>}
          {youthError && <div className="form-error">{youthError}</div>}
          {youthSuccess && <div className="form-success">{youthSuccess}</div>}

          <form className="admin-product-form" onSubmit={handleYouthPreview}>
            <div className="field-row">
              <div className="field">
                <label>Invoice from date</label>
                <input
                  type="date"
                  value={youthStartDate}
                  onChange={event => {
                    setYouthStartDate(event.target.value);
                    setYouthPreview(null);
                  }}
                />
              </div>
              <div className="field">
                <label>Ungdomsøen customer</label>
                <select
                  value={selectedYouthCustomerNumber}
                  onChange={event => {
                    setYouthCustomerNumber(event.target.value);
                    setYouthPreview(null);
                  }}
                  disabled={customersLoading || !youthCustomerOptions.length}
                >
                  {!youthCustomerOptions.length && <option value="">No Ungdomsøen event customers found</option>}
                  {youthCustomerOptions.map(customer => (
                    <option key={customer.customerNumber} value={customer.customerNumber}>
                      {customer.name || 'Unnamed customer'} · #{customer.customerNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={applyYouthEventDiscount}
                onChange={event => {
                  setApplyYouthEventDiscount(event.target.checked);
                  setYouthPreview(null);
                }}
              />
              <span>Apply 33% event customer discount on every line</span>
            </label>
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={youthBookAndSend}
                onChange={event => setYouthBookAndSend(event.target.checked)}
              />
              <span>Book and send invoices by email after creating them</span>
            </label>
            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={youthForce}
                onChange={event => setYouthForce(event.target.checked)}
              />
              <span>Allow duplicate invoices for already invoiced events</span>
            </label>

            <div className="admin-product-form-actions">
              <button className="btn btn-blue" type="submit" disabled={youthLoading || customersLoading}>
                {youthLoading ? 'Previewing...' : 'Preview week'}
                <Icon name="arrow" size={18} />
              </button>
              <button
                className="btn btn-cream"
                type="button"
                onClick={handleYouthCreate}
                disabled={youthCreating || !youthCanCreate}
              >
                {youthCreating ? 'Creating...' : (youthBookAndSend ? 'Create and send' : 'Create drafts')}
                <Icon name="check" size={18} />
              </button>
            </div>
          </form>

          {youthPreview && (
            <div className="admin-invoice-events">
              {youthPreview.error && <div className="form-error">{youthPreview.error}</div>}
              {youthPreview.invoices?.map(invoice => (
                <section className="admin-table-wrap" key={invoice.bookingId}>
                  <div className="admin-invoice-status">
                    <strong>{invoice.eventName}</strong>
                    <span>
                      {formatDate(invoice.eventDate)} · {invoice.lineCount} lines · {formatMoney(invoice.netAmount)}
                    </span>
                    <small>
                      {invoice.error
                        ? invoice.error
                        : invoice.alreadyInvoiced
                          ? `${invoice.status || 'Invoiced'} ${invoice.bookedInvoiceNumber ? `#${invoice.bookedInvoiceNumber}` : invoice.draftInvoiceNumber ? `draft #${invoice.draftInvoiceNumber}` : ''}`
                          : `Ready for ${youthPreview.customerName || 'Ungdomsøen Event #1'} · invoice date ${formatDate(youthPreview.invoiceDate)}`}
                    </small>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Product</th>
                        <th>Room</th>
                        <th>Guests</th>
                        <th>Unit price</th>
                        <th>Discount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map(line => (
                        <tr key={`${line.bookingId}-${line.productNumber}-${line.servingTime}-${line.room}`}>
                          <td>
                            <strong>{formatTime(line.servingTime)}</strong>
                            <small>{invoice.spectraReservationNumber}</small>
                          </td>
                          <td>
                            <strong>{line.productName}</strong>
                            <small>{line.productNumber}</small>
                          </td>
                          <td>{line.room}</td>
                          <td>{line.guestCount}</td>
                          <td>{formatMoney(line.unitNetPrice)}</td>
                          <td>{Number(line.discountPercentage || 0)}%</td>
                          <td>{formatMoney(line.netAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
              {!youthPreview.invoices?.length && (
                <div className="profile-empty">No billable Ungdomsøen bookings found for this week.</div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

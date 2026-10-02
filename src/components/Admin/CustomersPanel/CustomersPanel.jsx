import { Icon } from '../../Shared/Icon.jsx';

function getCustomerKey(customer) {
  return String(customer?.customerNumber || customer?.email || customer?.name || 'customer');
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Not available';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Not available';
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
}

export function CustomersPanel({
  customers,
  filteredCustomers,
  selectedCustomer,
  loading,
  error,
  search,
  group,
  groups,
  country,
  countries,
  status,
  balance,
  sort,
  onRefresh,
  onSearchChange,
  onGroupChange,
  onCountryChange,
  onStatusChange,
  onBalanceChange,
  onSortChange,
  onClearFilters,
  onSelectCustomer,
}) {
  return (
    <section className="profile-requests admin-users">
      <section className="profile-grid admin-grid">
        <div className="profile-panel">
          <span>Customers</span>
          <h2>{customers.length}</h2>
          <p>Live customer records from e-conomic.</p>
        </div>
        <div className="profile-panel accent">
          <span>Source</span>
          <h2>Live</h2>
          <p>Customer details are not stored in PostgreSQL.</p>
        </div>
      </section>

      <div className="profile-section-head">
        <div>
          <div className="section-eyebrow">e-conomic</div>
          <h2>Customer overview</h2>
        </div>
        <button className="btn btn-blue" type="button" onClick={onRefresh} disabled={loading}>
          Refresh <Icon name="arrow" size={18} />
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="profile-empty">Loading customers from e-conomic...</div>}

      {!loading && !error && customers.length > 0 && (
        <div className="admin-customer-filters">
          <div className="field admin-customer-search">
            <label>Search customers</label>
            <input
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder="Name, email, number, city, or CVR"
            />
          </div>
          <div className="field">
            <label>Customer group</label>
            <select value={group} onChange={event => onGroupChange(event.target.value)}>
              <option value="all">All groups</option>
              {groups.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Country</label>
            <select value={country} onChange={event => onCountryChange(event.target.value)}>
              <option value="all">All countries</option>
              {countries.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={event => onStatusChange(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="barred">Barred</option>
            </select>
          </div>
          <div className="field">
            <label>Balance</label>
            <select value={balance} onChange={event => onBalanceChange(event.target.value)}>
              <option value="all">Any balance</option>
              <option value="positive">Positive</option>
              <option value="zero">Zero</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div className="field">
            <label>Sort</label>
            <select value={sort} onChange={event => onSortChange(event.target.value)}>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="number-asc">Customer number</option>
              <option value="balance-desc">Balance high-low</option>
              <option value="balance-asc">Balance low-high</option>
              <option value="updated-desc">Recently updated</option>
            </select>
          </div>
          <button
            className="btn btn-cream admin-clear-customer-filters"
            type="button"
            onClick={onClearFilters}
            aria-label="Clear customer filters"
            title="Clear customer filters"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="admin-customer-results">{filteredCustomers.length} of {customers.length} customers</div>
      )}

      {!loading && !error && customers.length === 0 && (
        <div className="profile-empty">No customers found in e-conomic.</div>
      )}

      {!loading && !error && customers.length > 0 && filteredCustomers.length === 0 && (
        <div className="profile-empty">No customers match your filters.</div>
      )}

      {filteredCustomers.length > 0 && (
        <div className="admin-request-display">
          <aside className="admin-request-queue" aria-label="e-conomic customers">
            {filteredCustomers.map(customer => {
              const key = getCustomerKey(customer);
              return (
                <button
                  className={`admin-request-row ${selectedCustomer?.customerNumber === customer.customerNumber ? 'selected' : ''}`}
                  type="button"
                  key={key}
                  onClick={() => onSelectCustomer(customer.customerNumber)}
                >
                  <span>Customer #{customer.customerNumber}</span>
                  <strong>{customer.name || 'Unnamed customer'}</strong>
                  <small>{customer.email || customer.city || 'No contact details'}</small>
                </button>
              );
            })}
          </aside>

          <article className="admin-request-detail">
            {selectedCustomer && (
              <>
                <div className="admin-detail-head">
                  <div>
                    <span>e-conomic customer</span>
                    <h3>{selectedCustomer.name || 'Unnamed customer'}</h3>
                  </div>
                  <div className="admin-status-pill">#{selectedCustomer.customerNumber}</div>
                </div>
                <dl className="admin-detail-grid">
                  <div><dt>Email</dt><dd>{selectedCustomer.email || 'Not available'}</dd></div>
                  <div><dt>Phone</dt><dd>{selectedCustomer.mobilePhone || selectedCustomer.telephoneAndFaxNumber || 'Not available'}</dd></div>
                  <div><dt>Address</dt><dd>{selectedCustomer.address || 'Not available'}</dd></div>
                  <div><dt>City</dt><dd>{[selectedCustomer.zip, selectedCustomer.city].filter(Boolean).join(' ') || 'Not available'}</dd></div>
                  <div><dt>CVR</dt><dd>{selectedCustomer.corporateIdentificationNumber || selectedCustomer.vatNumber || 'Not available'}</dd></div>
                  <div><dt>Group</dt><dd>{selectedCustomer.customerGroup?.name || selectedCustomer.customerGroup?.customerGroupNumber || 'Not available'}</dd></div>
                  <div><dt>Balance</dt><dd>{formatMoney(selectedCustomer.balance)}</dd></div>
                  <div><dt>Country</dt><dd>{selectedCustomer.country || 'Not available'}</dd></div>
                </dl>
              </>
            )}
          </article>
        </div>
      )}
    </section>
  );
}

import { Icon } from '../Icon.jsx';
import { formatDate, getStatus, getType, isAdminUser } from './adminUtils.js';

export function UsersPanel({
  customers,
  filteredCustomers,
  selectedCustomer,
  selectedCustomerRequestsState,
  selectedCustomerRequestSummary,
  usersLoading,
  usersError,
  userError,
  userSuccess,
  userForm,
  userSaving,
  customerSearch,
  settingAdminUserId,
  onRefresh,
  onCreateUser,
  onUpdateUserField,
  onSearchChange,
  onSelectCustomer,
  onMakeAdmin,
}) {
  return (
        <section className="profile-requests admin-customers">
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Users</span>
              <h2>{customers.length}</h2>
              <p>Users returned by the user API with request history attached.</p>
            </div>

            <div className="profile-panel accent">
              <span>Selected</span>
              <h2>{selectedCustomerRequestsState.loading ? '...' : selectedCustomerRequestsState.items.length}</h2>
              <p>{selectedCustomer?.email || 'Choose a user to see their request history.'}</p>
            </div>
          </section>
          <br />

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Users</div>
              <h2>User overview</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={onRefresh} disabled={usersLoading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          <form className="admin-product-form admin-user-form" onSubmit={onCreateUser}>
            {userError && <div className="form-error">{userError}</div>}
            {userSuccess && <div className="form-success">{userSuccess}</div>}

            <div className="field-row">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={event => onUpdateUserField('email', event.target.value)}
                  placeholder="user@inbox.dk"
                />
              </div>
              <div className="field">
                <label>First name</label>
                <input
                  value={userForm.firstName}
                  onChange={event => onUpdateUserField('firstName', event.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="field">
                <label>Last name</label>
                <input
                  value={userForm.lastName}
                  onChange={event => onUpdateUserField('lastName', event.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Password</label>
                <input value="changeme" readOnly />
              </div>
              <div className="admin-product-submit">
                <button className="btn btn-blue" type="submit" disabled={userSaving}>
                  {userSaving ? 'Adding...' : 'Add user'}
                  <Icon name="plus" size={18} />
                </button>
              </div>
            </div>
          </form>

          {usersLoading && (
            <div className="profile-empty">Loading users...</div>
          )}

          {usersError && (
            <div className="form-error">{usersError}</div>
          )}

          {!usersLoading && !usersError && customers.length === 0 && (
            <div className="profile-empty">No users found yet.</div>
          )}

          {!usersLoading && !usersError && customers.length > 0 && (
            <>
              <div className="admin-product-search field">
                <label>Search users</label>
                <input
                  value={customerSearch}
                  onChange={event => onSearchChange(event.target.value)}
                  placeholder="Search by name, email, id, or role"
                />
              </div>

              {filteredCustomers.length === 0 && (
                <div className="profile-empty">No users match your search.</div>
              )}

              {filteredCustomers.length > 0 && (
                <div className="admin-customer-layout">
                  <aside className="admin-request-queue" aria-label="Users">
                    {filteredCustomers.map(customer => {
                      const isSelected = selectedCustomer?.key === customer.key;

                      return (
                        <button
                          className={`admin-request-row ${isSelected ? 'selected' : ''}`}
                          type="button"
                          key={customer.key}
                          onClick={() => onSelectCustomer(customer.key)}
                        >
                          <span>{customer.role}</span>
                          <strong>{customer.email}</strong>
                          <small>
                            {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'No name'} · {customer.id ? `User #${customer.id}` : 'No user id'}
                          </small>
                        </button>
                      );
                    })}
                  </aside>

                  <article className="admin-request-detail">
                    {selectedCustomer ? (
                      <>
                        <div className="admin-detail-head">
                          <div>
                            <span>User</span>
                            <h3>{selectedCustomer.email}</h3>
                          </div>
                          <div className="admin-detail-actions">
                            <div className="admin-status-pill">
                              {selectedCustomerRequestsState.loading
                                ? 'Loading'
                                : `${selectedCustomerRequestsState.items.length} request${selectedCustomerRequestsState.items.length === 1 ? '' : 's'}`}
                            </div>
                            {!isAdminUser(selectedCustomer) && (
                              <button
                                className="btn btn-blue"
                                type="button"
                                onClick={() => onMakeAdmin(selectedCustomer)}
                                disabled={!selectedCustomer.id || settingAdminUserId === selectedCustomer.id}
                              >
                                {settingAdminUserId === selectedCustomer.id ? 'Updating...' : 'Make admin'}
                                <Icon name="check" size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        {selectedCustomerRequestsState.error && (
                          <div className="form-error">{selectedCustomerRequestsState.error}</div>
                        )}

                        <dl className="admin-detail-grid">
                          <div>
                            <dt>Email</dt>
                            <dd>{selectedCustomer.email}</dd>
                          </div>
                          <div>
                            <dt>First name</dt>
                            <dd>{selectedCustomer.firstName || 'Not available'}</dd>
                          </div>
                          <div>
                            <dt>Last name</dt>
                            <dd>{selectedCustomer.lastName || 'Not available'}</dd>
                          </div>
                          <div>
                            <dt>User ID</dt>
                            <dd>{selectedCustomer.id || 'Not available'}</dd>
                          </div>
                          <div>
                            <dt>Role</dt>
                            <dd>{selectedCustomer.role}</dd>
                          </div>
                          <div>
                            <dt>First request</dt>
                            <dd>{selectedCustomerRequestSummary.firstDate ? formatDate(selectedCustomerRequestSummary.firstDate) : 'No date'}</dd>
                          </div>
                          <div>
                            <dt>Latest request</dt>
                            <dd>{selectedCustomerRequestSummary.latestDate ? formatDate(selectedCustomerRequestSummary.latestDate) : 'No date'}</dd>
                          </div>
                          <div>
                            <dt>Total requests</dt>
                            <dd>{selectedCustomerRequestsState.loading ? 'Loading...' : selectedCustomerRequestsState.items.length}</dd>
                          </div>
                          <div>
                            <dt>Status counts</dt>
                            <dd>
                              {Object.entries(selectedCustomerRequestSummary.statuses).length > 0
                                ? Object.entries(selectedCustomerRequestSummary.statuses)
                                .map(([status, count]) => `${status}: ${count}`)
                                  .join(', ')
                                : 'None'}
                            </dd>
                          </div>
                        </dl>

                        <div className="admin-detail-section">
                          <h4>Request history</h4>
                          {!selectedCustomer.id && (
                            <div className="request-products-state error">{'This user has no id, so requests cannot be loaded from /request/user/{userId}.'}</div>
                          )}
                          {selectedCustomerRequestsState.loading && (
                            <div className="request-products-state">Loading user requests...</div>
                          )}
                          {!selectedCustomerRequestsState.loading && selectedCustomer.id && selectedCustomerRequestsState.items.length === 0 ? (
                            <div className="request-products-state">No requests found for this user.</div>
                          ) : null}
                          {!selectedCustomerRequestsState.loading && selectedCustomerRequestsState.items.length > 0 && (
                            <div className="admin-customer-table-wrap">
                              <table className="admin-customer-table">
                                <thead>
                                  <tr>
                                    <th>ID</th>
                                    <th>Location</th>
                                    <th>Start</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedCustomerRequestsState.items.map(request => (
                                    <tr key={request.id || `${request.startDate}-${request.location}`}>
                                      <td>#{request.id || 'New'}</td>
                                      <td>{request.location || 'No location'}</td>
                                      <td>{formatDate(request.startDate)}</td>
                                      <td>{getStatus(request)}</td>
                                      <td>{getType(request) || 'None'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="profile-empty">Select a user to see the overview.</div>
                    )}
                  </article>
                </div>
              )}
            </>
          )}
        </section>  );
}

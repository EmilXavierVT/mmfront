import { Icon } from '../Icon.jsx';
import { formatCalendarDay, formatCalendarMonth, formatDate, getProductDescription, getProductName, getRequester, getStatus } from './adminUtils.js';

export function CalendarPanel({
  acceptedRequests,
  selectedCalendarRequest,
  selectedCalendarProductsState,
  requestsLoading,
  requestsError,
  displayedCalendarCursor,
  calendarDays,
  acceptedRequestsByDay,
  onRefresh,
  onMoveMonth,
  onSelectRequest,
}) {
  return (
        <section className="profile-requests admin-calendar">
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Status 2</span>
              <h2>{acceptedRequests.length}</h2>
              <p>Accepted requests ready to plan on the calendar.</p>
            </div>

            <div className="profile-panel accent">
              <span>Selected</span>
              <h2>{selectedCalendarRequest ? `#${selectedCalendarRequest.id || 'New'}` : 'None'}</h2>
              <p>{selectedCalendarRequest?.location || 'Choose an event to see the overview.'}</p>
            </div>
          </section>
          <br />

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Calendar</div>
              <h2>Status 2 events</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={onRefresh} disabled={requestsLoading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          {requestsLoading && (
            <div className="profile-empty">Loading calendar...</div>
          )}

          {requestsError && (
            <div className="form-error">{requestsError}</div>
          )}

          {!requestsLoading && !requestsError && acceptedRequests.length === 0 && (
            <div className="profile-empty">No status 2 requests found.</div>
          )}

          {acceptedRequests.length > 0 && (
            <div className="admin-calendar-layout">
              <section className="admin-calendar-board" aria-label="Status 2 request calendar">
                <div className="admin-calendar-head">
                  <button className="admin-calendar-nav" type="button" onClick={() => onMoveMonth(-1)} aria-label="Previous month">
                    <Icon name="chevL" size={18} />
                  </button>
                  <h3>{formatCalendarMonth(displayedCalendarCursor)}</h3>
                  <button className="admin-calendar-nav" type="button" onClick={() => onMoveMonth(1)} aria-label="Next month">
                    <Icon name="chev" size={18} />
                  </button>
                </div>

                <div className="admin-calendar-weekdays" aria-hidden="true">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="admin-calendar-grid">
                  {calendarDays.map(day => {
                    const dayRequests = acceptedRequestsByDay[day.key] || [];

                    return (
                      <div className={`admin-calendar-day ${day.inMonth ? '' : 'muted'}`} key={day.key}>
                        <span className="admin-calendar-date">{day.date.getDate()}</span>
                        <div className="admin-calendar-events">
                          {dayRequests.map(request => {
                            const isSelected = selectedCalendarRequest?.id === request.id;

                            return (
                              <button
                                className={`admin-calendar-event ${isSelected ? 'selected' : ''}`}
                                type="button"
                                key={request.id || `${request.startDate}-${request.location}`}
                                onClick={() => onSelectRequest(request.id)}
                              >
                                <strong>{request.location || 'No location'}</strong>
                                <small>{getRequester(request)}</small>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <article className="admin-request-detail admin-calendar-detail">
                {selectedCalendarRequest ? (
                  <>
                    <div className="admin-detail-head">
                      <div>
                        <span>Event overview</span>
                        <h3>{selectedCalendarRequest.location || 'No location'}</h3>
                      </div>
                      <div className="admin-status-pill">{getStatus(selectedCalendarRequest)}</div>
                    </div>

                    <dl className="admin-detail-grid">
                      <div>
                        <dt>ID</dt>
                        <dd>{selectedCalendarRequest.id || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{getRequester(selectedCalendarRequest)}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{selectedCalendarRequest.location || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Event day</dt>
                        <dd>{formatCalendarDay(selectedCalendarRequest.startDate)}</dd>
                      </div>
                      <div>
                        <dt>Start</dt>
                        <dd>{formatDate(selectedCalendarRequest.startDate)}</dd>
                      </div>
                      <div>
                        <dt>End</dt>
                        <dd>{formatDate(selectedCalendarRequest.endDate)}</dd>
                      </div>
                    </dl>

                    <div className="admin-detail-section">
                      <h4>Products</h4>
                      {selectedCalendarProductsState.loading && <div className="request-products-state">Loading products...</div>}
                      {selectedCalendarProductsState.error && <div className="request-products-state error">{selectedCalendarProductsState.error}</div>}
                      {!selectedCalendarProductsState.loading && !selectedCalendarProductsState.error && selectedCalendarProductsState.items.length === 0 && (
                        <div className="request-products-state">No products attached to this request.</div>
                      )}
                      {selectedCalendarProductsState.items.length > 0 && (
                        <ul className="admin-product-list">
                          {selectedCalendarProductsState.items.map((item, index) => (
                            <li key={item.id || `${item.productId || getProductName(item)}-${index}`}>
                              <div>
                                <strong>{getProductName(item)}</strong>
                                {getProductDescription(item) && <small>{getProductDescription(item)}</small>}
                              </div>
                              <span>{item.amount || item.quantity || 1}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="profile-empty">Click an event to see the overview.</div>
                )}
              </article>
            </div>
          )}
        </section>  );
}

import { Icon } from '../../Shared/Icon.jsx';
import { formatCalendarDay, formatCalendarMonth, formatDate, getProductDescription, getProductName, getRequester, getStatus } from '../adminUtils.js';

function getEventTitle(event) {
  if (event?.kind === 'youthIsland') {
    return event.booking?.customerName || 'Ungdomsøen booking';
  }

  return event?.request?.location || 'No location';
}

function getEventSubtitle(event) {
  if (event?.kind === 'youthIsland') {
    const booking = event.booking;
    return [
      'Ungdomsøen',
      booking?.totalGuests ? `${booking.totalGuests} pers.` : null,
    ].filter(Boolean).join(' · ');
  }

  return getRequester(event?.request);
}

export function CalendarPanel({
  youthIslandBookings,
  calendarEvents,
  selectedCalendarEvent,
  selectedCalendarProductsState,
  requestsLoading,
  requestsError,
  displayedCalendarCursor,
  calendarDays,
  calendarEventsByDay,
  onRefresh,
  onMoveMonth,
  onSelectEvent,
}) {
  const selectedCalendarRequest = selectedCalendarEvent?.kind === 'request'
    ? selectedCalendarEvent.request
    : null;
  const selectedYouthIslandBooking = selectedCalendarEvent?.kind === 'youthIsland'
    ? selectedCalendarEvent.booking
    : null;

  return (
        <section className="profile-requests admin-calendar">
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Calendar</span>
              <h2>{calendarEvents.length}</h2>
              <p>Accepted requests and Ungdomsøen bookings.</p>
            </div>

            <div className="profile-panel">
              <span>Ungdomsøen</span>
              <h2>{youthIslandBookings.length}</h2>
              <p>YI bookings visible in this calendar.</p>
            </div>

            <div className="profile-panel accent">
              <span>Selected</span>
              <h2>
                {selectedCalendarEvent
                  ? selectedCalendarEvent.kind === 'youthIsland'
                    ? `YI #${selectedYouthIslandBooking?.id || 'New'}`
                    : `#${selectedCalendarRequest?.id || 'New'}`
                  : 'None'}
              </h2>
              <p>{getEventTitle(selectedCalendarEvent) || 'Choose an event to see the overview.'}</p>
            </div>
          </section>
          <br />

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Calendar</div>
              <h2>Accepted events</h2>
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

          {!requestsLoading && !requestsError && calendarEvents.length === 0 && (
            <div className="profile-empty">No accepted requests or Ungdomsøen bookings found.</div>
          )}

          {calendarEvents.length > 0 && (
            <div className="admin-calendar-layout">
              <section className="admin-calendar-board" aria-label="Accepted request and Ungdomsøen booking calendar">
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
                    const dayEvents = calendarEventsByDay[day.key] || [];

                    return (
                      <div className={`admin-calendar-day ${day.inMonth ? '' : 'muted'}`} key={day.key}>
                        <span className="admin-calendar-date">{day.date.getDate()}</span>
                        <div className="admin-calendar-events">
                          {dayEvents.map(event => {
                            const isSelected = selectedCalendarEvent?.key === event.key;
                            const isYouthIsland = event.kind === 'youthIsland';

                            return (
                              <button
                                className={`admin-calendar-event ${isSelected ? 'selected' : ''} ${isYouthIsland ? 'youth-island' : ''}`}
                                type="button"
                                key={event.key}
                                onClick={() => onSelectEvent(event.key)}
                              >
                                <strong>{getEventTitle(event)}</strong>
                                <small>{getEventSubtitle(event)}</small>
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
                ) : selectedYouthIslandBooking ? (
                  <>
                    <div className="admin-detail-head">
                      <div>
                        <span>Ungdomsøen booking</span>
                        <h3>{selectedYouthIslandBooking.customerName || 'No title'}</h3>
                      </div>
                      <div className="admin-status-pill youth-island">YI</div>
                    </div>

                    <dl className="admin-detail-grid">
                      <div>
                        <dt>ID</dt>
                        <dd>{selectedYouthIslandBooking.id || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Event day</dt>
                        <dd>{formatCalendarDay(selectedYouthIslandBooking.eventDate)}</dd>
                      </div>
                      <div>
                        <dt>Order date</dt>
                        <dd>{selectedYouthIslandBooking.orderDate ? formatCalendarDay(selectedYouthIslandBooking.orderDate) : 'None'}</dd>
                      </div>
                      <div>
                        <dt>Spectra</dt>
                        <dd>{selectedYouthIslandBooking.spectraReservationNumber || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{selectedYouthIslandBooking.location || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Guests</dt>
                        <dd>{selectedYouthIslandBooking.totalGuests || 0}</dd>
                      </div>
                      <div>
                        <dt>Allergies</dt>
                        <dd>{selectedYouthIslandBooking.allergies || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Snack trays</dt>
                        <dd>{selectedYouthIslandBooking.snackTrayCount || 0}</dd>
                      </div>
                      <div>
                        <dt>Ordered by</dt>
                        <dd>{selectedYouthIslandBooking.orderedByName || selectedYouthIslandBooking.orderedByEmail || 'None'}</dd>
                      </div>
                    </dl>

                    <div className="admin-detail-section">
                      <h4>Serveringer</h4>
                      {(!selectedYouthIslandBooking.items || selectedYouthIslandBooking.items.length === 0) && (
                        <div className="request-products-state">No service lines attached to this booking.</div>
                      )}
                      {selectedYouthIslandBooking.items?.length > 0 && (
                        <ul className="admin-product-list">
                          {selectedYouthIslandBooking.items.map((item, index) => (
                            <li key={item.id || `${selectedYouthIslandBooking.id}-${index}`}>
                              <div>
                                <strong>{item.productName || item.menu || 'Servering'}</strong>
                                <small>{[item.servingTime, item.room, item.menu].filter(Boolean).join(' · ')}</small>
                              </div>
                              <span>{item.guestCount || 0}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selectedYouthIslandBooking.notes && (
                      <div className="admin-detail-section">
                        <h4>Notes</h4>
                        <p>{selectedYouthIslandBooking.notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="profile-empty">Click an event to see the overview.</div>
                )}
              </article>
            </div>
          )}
        </section>  );
}

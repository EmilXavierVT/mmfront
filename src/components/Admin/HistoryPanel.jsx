import { Icon } from '../Icon.jsx';
import { formatDate, getProductDescription, getProductName, getRequester, getStatus, getType, renderValue } from './adminUtils.js';

export function HistoryPanel({
  historyRequests,
  selectedHistoryRequest,
  selectedHistoryProductsState,
  requestsLoading,
  requestsError,
  historyUpdateError,
  onRefresh,
  onSelectRequest,
}) {
  return (
        <section className="profile-requests admin-history">
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Status 6</span>
              <h2>{historyRequests.length}</h2>
              <p>Requests that have passed their end time and have been moved to history.</p>
            </div>

            <div className="profile-panel accent">
              <span>Selected</span>
              <h2>{selectedHistoryRequest ? `#${selectedHistoryRequest.id || 'New'}` : 'None'}</h2>
              <p>{selectedHistoryRequest?.location || 'Choose a historical request to see the overview.'}</p>
            </div>
          </section>
          <br />

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">History</div>
              <h2>Finished requests</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={onRefresh} disabled={requestsLoading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          {requestsLoading && (
            <div className="profile-empty">Loading history...</div>
          )}

          {requestsError && (
            <div className="form-error">{requestsError}</div>
          )}

          {historyUpdateError && (
            <div className="form-error">{historyUpdateError}</div>
          )}

          {!requestsLoading && !requestsError && historyRequests.length === 0 && (
            <div className="profile-empty">No status 6 requests found.</div>
          )}

          {historyRequests.length > 0 && (
            <div className="admin-request-display">
              <aside className="admin-request-queue" aria-label="Status 6 request history">
                {historyRequests.map(request => {
                  const isSelected = selectedHistoryRequest?.id === request.id;

                  return (
                    <button
                      className={`admin-request-row ${isSelected ? 'selected' : ''}`}
                      type="button"
                      key={request.id || `${request.endDate}-${request.location}`}
                      onClick={() => onSelectRequest(request.id)}
                    >
                      <span>Request #{request.id || 'New'}</span>
                      <strong>{request.location || 'No location'}</strong>
                      <small>{formatDate(request.endDate)} · {getRequester(request)}</small>
                    </button>
                  );
                })}
              </aside>

              <article className="admin-request-detail">
                {selectedHistoryRequest ? (
                  <>
                    <div className="admin-detail-head">
                      <div>
                        <span>Historical request</span>
                        <h3>{selectedHistoryRequest.location || 'No location'}</h3>
                      </div>
                      <div className="admin-status-pill">{getStatus(selectedHistoryRequest)}</div>
                    </div>

                    <dl className="admin-detail-grid">
                      <div>
                        <dt>ID</dt>
                        <dd>{selectedHistoryRequest.id || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Requester</dt>
                        <dd>{getRequester(selectedHistoryRequest)}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{getType(selectedHistoryRequest) || 'None'}</dd>
                      </div>
                      <div>
                        <dt>Start</dt>
                        <dd>{formatDate(selectedHistoryRequest.startDate)}</dd>
                      </div>
                      <div>
                        <dt>End</dt>
                        <dd>{formatDate(selectedHistoryRequest.endDate)}</dd>
                      </div>
                      <div>
                        <dt>Allergies</dt>
                        <dd>{renderValue(selectedHistoryRequest.allergies)}</dd>
                      </div>
                    </dl>

                    <div className="admin-detail-section">
                      <h4>Products</h4>
                      {selectedHistoryProductsState.loading && <div className="request-products-state">Loading products...</div>}
                      {selectedHistoryProductsState.error && <div className="request-products-state error">{selectedHistoryProductsState.error}</div>}
                      {!selectedHistoryProductsState.loading && !selectedHistoryProductsState.error && selectedHistoryProductsState.items.length === 0 && (
                        <div className="request-products-state">No products attached to this request.</div>
                      )}
                      {selectedHistoryProductsState.items.length > 0 && (
                        <ul className="admin-product-list">
                          {selectedHistoryProductsState.items.map((item, index) => (
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
                  <div className="profile-empty">Select a request to see the overview.</div>
                )}
              </article>
            </div>
          )}
        </section>  );
}

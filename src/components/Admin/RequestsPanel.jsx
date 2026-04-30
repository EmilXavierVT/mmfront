import { Icon } from '../Icon.jsx';
import { formatDate, getProductDescription, getProductName, getRequester, getStatus, getType, renderValue } from './adminUtils.js';

export function RequestsPanel({
  requests,
  unansweredTypeOneRequests,
  selectedRequest,
  selectedProductsState,
  extraDetails,
  requestsLoading,
  requestsError,
  statusUpdateError,
  updatingRequest,
  onRefresh,
  onSelectRequest,
  onUpdateStatus,
}) {
  return (
      <section className="profile-requests admin-requests">
         <section className="profile-grid admin-grid">
        <div className="profile-panel">
          <span>Total</span>
          <h2>{requests.length}</h2>
          <p>All customer requests currently returned by the API.</p>
        </div>

        <div className="profile-panel accent">
          <span>Unanswered type 1</span>
          <h2>{unansweredTypeOneRequests.length}</h2>
          <p>Catering requests still waiting for follow-up.</p>
        </div>
      </section>
      <br/>
        <div className="profile-section-head">
          <div>
            <div className="section-eyebrow">Overview</div>
            <h2>Unanswered catering</h2>
          </div>
          <button className="btn btn-blue" type="button" onClick={onRefresh} disabled={requestsLoading}>
            Refresh <Icon name="arrow" size={18} />
          </button>
        </div>

        {requestsLoading && (
          <div className="profile-empty">Loading requests...</div>
        )}

        {requestsError && (
          <div className="form-error">{requestsError}</div>
        )}

        {!requestsLoading && !requestsError && unansweredTypeOneRequests.length === 0 && (
          <div className="profile-empty">No unanswered type 1 requests found.</div>
        )}

        {unansweredTypeOneRequests.length > 0 && (
          <div className="admin-request-display">
            <aside className="admin-request-queue" aria-label="Unanswered type 1 requests">
              {unansweredTypeOneRequests.map(request => {
                const isSelected = selectedRequest?.id === request.id;

                return (
                  <button
                    className={`admin-request-row ${isSelected ? 'selected' : ''}`}
                    type="button"
                    key={request.id || `${request.startDate}-${request.location}`}
                    onClick={() => onSelectRequest(request.id)}
                  >
                    <span>Request #{request.id || 'New'}</span>
                    <strong>{request.location || 'No location'}</strong>
                    <small>{formatDate(request.startDate)} · {getRequester(request)}</small>
                  </button>
                );
              })}
            </aside>

            <article className="admin-request-detail">
              {selectedRequest ? (
                <>
                  <div className="admin-detail-head">
                    <div>
                      <span>Selected request</span>
                      <h3>{selectedRequest.location || 'No location'}</h3>
                    </div>
                    <div className="admin-detail-actions">
                      <div className="admin-status-pill">{getStatus(selectedRequest)}</div>
                      <button
                        className="btn btn-blue"
                        type="button"
                        onClick={() => onUpdateStatus(2, 'Accepted', 'Accept')}
                        disabled={updatingRequest?.id === selectedRequest.id}
                      >
                        {updatingRequest?.id === selectedRequest.id && updatingRequest?.actionName === 'Accept'
                          ? 'Accepting...'
                          : 'Accept request'}
                        <Icon name="check" size={18} />
                      </button>
                      <button
                        className="btn btn-cream admin-dismiss-btn"
                        type="button"
                        onClick={() => onUpdateStatus(99, 'Dismissed', 'Dismiss')}
                        disabled={updatingRequest?.id === selectedRequest.id}
                      >
                        {updatingRequest?.id === selectedRequest.id && updatingRequest?.actionName === 'Dismiss'
                          ? 'Dismissing...'
                          : 'Dismiss'}
                        <Icon name="x" size={18} />
                      </button>
                    </div>
                  </div>

                  {statusUpdateError && <div className="form-error">{statusUpdateError}</div>}

                  <dl className="admin-detail-grid">
                    <div>
                      <dt>ID</dt>
                      <dd>{selectedRequest.id || 'None'}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{getType(selectedRequest) || 'None'}</dd>
                    </div>
                    <div>
                      <dt>Requester</dt>
                      <dd>{getRequester(selectedRequest)}</dd>
                    </div>
                    <div>
                      <dt>Start</dt>
                      <dd>{formatDate(selectedRequest.startDate)}</dd>
                    </div>
                    <div>
                      <dt>End</dt>
                      <dd>{formatDate(selectedRequest.endDate)}</dd>
                    </div>
                    <div>
                      <dt>Allergies</dt>
                      <dd>{renderValue(selectedRequest.allergies)}</dd>
                    </div>
                  </dl>

                  <div className="admin-detail-section">
                    <h4>Products</h4>
                    {selectedProductsState.loading && <div className="request-products-state">Loading products...</div>}
                    {selectedProductsState.error && <div className="request-products-state error">{selectedProductsState.error}</div>}
                    {!selectedProductsState.loading && !selectedProductsState.error && selectedProductsState.items.length === 0 && (
                      <div className="request-products-state">No products attached to this request.</div>
                    )}
                    {selectedProductsState.items.length > 0 && (
                      <ul className="admin-product-list">
                        {selectedProductsState.items.map((item, index) => (
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

                  {extraDetails.length > 0 && (
                    <div className="admin-detail-section">
                      <h4>Other information</h4>
                      <dl className="admin-extra-grid">
                        {extraDetails.map(([key, value]) => (
                          <div key={key}>
                            <dt>{key}</dt>
                            <dd>{renderValue(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </>
              ) : (
                <div className="profile-empty">Select a request to see the overview.</div>
              )}
            </article>
          </div>
        )}
      </section>  );
}

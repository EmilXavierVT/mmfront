import { useEffect, useState } from 'react';
import { productApi } from '../api/products.js';
import { productInRequestApi, quoteRequestApi } from '../api/requests.js';
import { Icon } from './Icon.jsx';

function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-DK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getRequestTitle(request) {
  const type = request?.typeDTO?.name || request?.typeName || request?.type;
  if (type === 1 || String(type).toLowerCase() === '1') return 'Catering request';
  if (type === 2 || String(type).toLowerCase() === '2') return 'Cleaning request';
  return type ? `${type} request` : 'Request';
}

function getInlineProducts(request) {
  return request?.productInRequests
    || request?.productInRequestDTOs
    || request?.products
    || [];
}

function getProductInRequestIds(request) {
  return request?.productInRequestIds
    || request?.productInRequestsIds
    || [];
}

function getProductName(item) {
  return item?.productDTO?.name
    || item?.product?.name
    || item?.name
    || item?.productName
    || (item?.productId ? `Product #${item.productId}` : 'Product');
}

function getProductDescription(item) {
  return item?.productDTO?.description
    || item?.product?.description
    || item?.description
    || '';
}

async function loadProductsForRequest(request) {
  const ids = getProductInRequestIds(request);
  if (!ids.length) return [];

  const productInRequests = await Promise.all(ids.map(id => productInRequestApi.getById(id)));

  return Promise.all(productInRequests.map(async item => {
    const productId = item?.productId || item?.productDTO?.id || item?.product?.id;
    if (!productId || item?.productDTO || item?.product) return item;

    const product = await productApi.getById(productId);
    return { ...item, product };
  }));
}

export function Profile({ user, onBook, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [openRequestId, setOpenRequestId] = useState(null);
  const [requestProducts, setRequestProducts] = useState({});
  const id = user?.id || user?.userId;

  const toggleRequest = async (request) => {
    const requestId = request?.id;
    if (!requestId) return;

    if (openRequestId === requestId) {
      setOpenRequestId(null);
      return;
    }

    setOpenRequestId(requestId);

    const inlineProducts = getInlineProducts(request);
    if (inlineProducts.length > 0) {
      setRequestProducts(current => ({
        ...current,
        [requestId]: { items: inlineProducts, loading: false, error: '' },
      }));
      return;
    }

    if (requestProducts[requestId]?.items || requestProducts[requestId]?.loading) return;

    setRequestProducts(current => ({
      ...current,
      [requestId]: { items: [], loading: true, error: '' },
    }));

    try {
      const data = await loadProductsForRequest(request);
      setRequestProducts(current => ({
        ...current,
        [requestId]: { items: data, loading: false, error: '' },
      }));
    } catch (err) {
      setRequestProducts(current => ({
        ...current,
        [requestId]: { items: [], loading: false, error: err.message || 'Could not load products.' },
      }));
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    let ignore = false;

    async function loadRequests() {
      setRequestsLoading(true);
      setRequestsError('');

      try {
        const data = await quoteRequestApi.getByUserId(id);
        if (!ignore) {
          setRequests(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setRequestsError(err.message || 'Could not load your requests.');
        }
      } finally {
        if (!ignore) {
          setRequestsLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Profile</div>
          <h1>Welcome back.</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-cream" type="button" onClick={onLogout}>
          Log out <Icon name="logout" size={18} />
        </button>
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <span>Account</span>
          <h2>Your details</h2>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Logged in</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{id || 'Not available'}</dd>
            </div>
          </dl>
        </div>

        <div className="profile-panel accent">
          <span>Next</span>
          <h2>Make a request</h2>
          <p>Build a cart, choose a date, and send it straight through with your current session.</p>
          <button className="btn btn-primary" type="button" onClick={onBook}>
            Book now <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      <section className="profile-requests">
        <div className="profile-section-head">
          <div>
            <div className="section-eyebrow">Requests</div>
            <h2>Your requests</h2>
          </div>
          <button className="btn btn-blue" type="button" onClick={onBook}>
            New request <Icon name="arrow" size={18} />
          </button>
        </div>

        {!id && (
          <div className="profile-empty">We could not find your id in the login session. Log out and log in again to refresh it.</div>
        )}

        {id && requestsLoading && (
          <div className="profile-empty">Loading requests...</div>
        )}

        {id && requestsError && (
          <div className="form-error">{requestsError}</div>
        )}

        {id && !requestsLoading && !requestsError && requests.length === 0 && (
          <div className="profile-empty">No requests yet. Your first one will show up here.</div>
        )}

        {requests.length > 0 && (
          <div className="request-list">
            {requests.map(request => {
              const requestKey = request.id || `${request.startDate}-${request.location}`;
              const isOpen = openRequestId === request.id;
              const productsState = requestProducts[request.id] || { items: [], loading: false, error: '' };

              return (
                <article className={`request-card ${isOpen ? 'open' : ''}`} key={requestKey}>
                  <button className="request-card-main" type="button" onClick={() => toggleRequest(request)} aria-expanded={isOpen}>
                    <div>
                      <span>{getRequestTitle(request)}</span>
                      <h3>{request.location || 'No location'}</h3>
                    </div>
                    <dl>
                      <div>
                        <dt>Start</dt>
                        <dd>{formatDate(request.startDate)}</dd>
                      </div>
                      <div>
                        <dt>End</dt>
                        <dd>{formatDate(request.endDate)}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{request.statusDTO?.name || request.statusName || request.status || 'Pending'}</dd>
                      </div>
                    </dl>
                    <Icon name={isOpen ? 'chevUp' : 'chev'} size={20} />
                  </button>

                  {isOpen && (
                    <div className="request-products">
                      {productsState.loading && <div className="request-products-state">Loading products...</div>}
                      {productsState.error && <div className="request-products-state error">{productsState.error}</div>}
                      {!productsState.loading && !productsState.error && productsState.items.length === 0 && (
                        <div className="request-products-state">No products attached to this request.</div>
                      )}
                      {productsState.items.length > 0 && (
                        <ul>
                          {productsState.items.map((item, index) => (
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
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

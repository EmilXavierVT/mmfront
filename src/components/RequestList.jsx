import { productApi } from '../api/products.js';
import { productInRequestApi } from '../api/requests.js';
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

function getRequester(request) {
  return request?.userDTO?.email
    || request?.user?.email
    || request?.customerEmail
    || request?.email
    || request?.userEmail
    || request?.userId
    || request?.userDTO?.id
    || request?.user?.id
    || 'Unknown';
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

export function RequestList({
  requests,
  openRequestId,
  requestProducts,
  onOpenRequest,
  onSetRequestProducts,
  showRequester = false,
}) {
  const toggleRequest = async (request) => {
    const requestId = request?.id;
    if (!requestId) return;

    if (openRequestId === requestId) {
      onOpenRequest(null);
      return;
    }

    onOpenRequest(requestId);

    const inlineProducts = getInlineProducts(request);
    if (inlineProducts.length > 0) {
      onSetRequestProducts(current => ({
        ...current,
        [requestId]: { items: inlineProducts, loading: false, error: '' },
      }));
      return;
    }

    if (requestProducts[requestId]?.items || requestProducts[requestId]?.loading) return;

    onSetRequestProducts(current => ({
      ...current,
      [requestId]: { items: [], loading: true, error: '' },
    }));

    try {
      const data = await loadProductsForRequest(request);
      onSetRequestProducts(current => ({
        ...current,
        [requestId]: { items: data, loading: false, error: '' },
      }));
    } catch (err) {
      onSetRequestProducts(current => ({
        ...current,
        [requestId]: { items: [], loading: false, error: err.message || 'Could not load products.' },
      }));
    }
  };

  return (
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
                {showRequester && (
                  <div>
                    <dt>Requester</dt>
                    <dd>{getRequester(request)}</dd>
                  </div>
                )}
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
  );
}

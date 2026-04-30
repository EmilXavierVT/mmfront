import { productApi } from '../../api/products.js';
import { productInRequestApi } from '../../api/requests.js';
import { PRODUCT_TYPE_LABELS as PRODUCT_TYPE_LABELS_SOURCE } from '../../lib/products.js';

export function getStatus(request) {
  return request?.statusDTO?.name || request?.statusName || request?.status || 'Pending';
}

export function getType(request) {
  return request?.typeDTO?.id
    || request?.typeId
    || request?.typeDTO?.name
    || request?.typeName
    || request?.type;
}

export function isTypeOne(request) {
  return String(getType(request)).toLowerCase() === '1';
}

export function isUnanswered(request) {
  const status = String(getStatus(request)).toLowerCase();
  return ['1', 'pending', 'unanswered', 'open', 'new'].includes(status);
}

export function isStatusTwo(request) {
  const status = getStatus(request);
  const statusId = request?.statusDTO?.id || request?.statusId || request?.status;

  return String(statusId).toLowerCase() === '2'
    || String(status).toLowerCase() === '2';
}

export function isStatusSix(request) {
  const status = getStatus(request);
  const statusId = request?.statusDTO?.id || request?.statusId || request?.status;

  return String(statusId).toLowerCase() === '6'
    || String(status).toLowerCase() === '6';
}

export function hasPassedEndTime(request) {
  const endDate = new Date(request?.endDate);
  if (Number.isNaN(endDate.getTime())) return false;

  return endDate.getTime() < Date.now();
}

export function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-DK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatCalendarMonth(date) {
  return new Intl.DateTimeFormat('en-DK', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatCalendarDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat('en-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function getDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);

    return {
      date: day,
      key: getDateKey(day),
      inMonth: day.getMonth() === month,
    };
  });
}

export function getRequester(request) {
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

export function getUserId(customer) {
  return customer?.id
    || customer?.userId
    || customer?.userDTO?.id
    || null;
}

export function getUserEmail(customer) {
  return customer?.email
    || customer?.username
    || customer?.userName
    || customer?.name
    || customer?.userDTO?.email
    || 'Unknown';
}

export function getUserFirstName(customer) {
  return customer?.firstName
    || customer?.firstname
    || customer?.userDTO?.firstName
    || customer?.userDTO?.firstname
    || '';
}

export function getUserLastName(customer) {
  return customer?.lastName
    || customer?.lastname
    || customer?.userDTO?.lastName
    || customer?.userDTO?.lastname
    || '';
}

function normalizeRoleValue(role) {
  if (!role) return '';
  if (typeof role === 'object') {
    return normalizeRoleValue(role.name || role.role || role.authority);
  }

  return String(role)
    .split(',')
    .map(item => item.trim().replace(/^ROLE_/i, ''))
    .filter(Boolean);
}

function getUserRoles(customer) {
  return [
    customer?.role,
    customer?.roleDTO?.name,
    customer?.userRole,
    customer?.authority,
    customer?.roles,
    customer?.userDTO?.role,
    customer?.userDTO?.roles,
  ]
    .flat()
    .flatMap(normalizeRoleValue)
    .filter(Boolean);
}

export function getUserRole(customer) {
  const roles = getUserRoles(customer);
  if (!roles.length) return 'None';

  return roles.join(', ');
}

export function isAdminUser(customer) {
  return getUserRoles(customer).some(role => role.toLowerCase() === 'admin');
}

export function getUserKey(customer) {
  return String(getUserId(customer) || getUserEmail(customer)).toLowerCase();
}

export function getInlineProducts(request) {
  return request?.productInRequests
    || request?.productInRequestDTOs
    || request?.products
    || [];
}

export function getProductInRequestIds(request) {
  return request?.productInRequestIds
    || request?.productInRequestsIds
    || [];
}

export function getProductName(item) {
  return item?.productDTO?.name
    || item?.product?.name
    || item?.name
    || item?.productName
    || (item?.productId ? `Product #${item.productId}` : 'Product');
}

export function getProductDescription(item) {
  return item?.productDTO?.description
    || item?.product?.description
    || item?.description
    || '';
}

export function renderValue(value) {
  if (value === null || value === undefined || value === '') return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function getTenantId(request) {
  return request?.tenantId
    || request?.tenantDTO?.id
    || request?.tenant?.id
    || 1;
}

export function getRequestUpdatePayload(request, status) {
  return {
    id: request.id,
    tenantId: getTenantId(request),
    startDate: request.startDate,
    endDate: request.endDate,
    location: request.location,
    status,
    type: Number(getType(request)) || getType(request),
    allergies: request.allergies || null,
    productInRequestIds: getProductInRequestIds(request),
    weatherDTO: request.weatherDTO || null,
  };
}

export async function loadProductsForRequest(request) {
  const inlineProducts = getInlineProducts(request);
  if (inlineProducts.length > 0) return inlineProducts;

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

export const hiddenDetailKeys = new Set([
  'id',
  'type',
  'typeId',
  'typeDTO',
  'typeName',
  'status',
  'statusDTO',
  'statusName',
  'startDate',
  'endDate',
  'location',
  'user',
  'userDTO',
  'userId',
  'email',
  'userEmail',
  'customerEmail',
  'productInRequests',
  'productInRequestDTOs',
  'products',
  'productInRequestIds',
  'productInRequestsIds',
]);

export const initialProductForm = {
  name: '',
  description: '',
  price: '',
  type: '1',
};

export const initialUserForm = {
  email: '',
  firstName: '',
  lastName: '',
};

export function getProductEditBase(product) {
  return {
    name: product?.name || '',
    description: product?.description || product?.desc || '',
    price: product?.price ?? '',
    type: String(product?.type ?? '1'),
  };
}

export function getProductUpdatePayload(product, edit) {
  return {
    id: product.id,
    name: edit.name.trim(),
    description: edit.description.trim(),
    price: Number(edit.price),
    type: Number(edit.type),
    productInRequestIds: product.productInRequestIds || [],
  };
}

export function summarizeCustomerRequests(requests) {
  const statuses = {};
  let firstDate = null;
  let latestDate = null;

  requests.forEach(request => {
    const status = getStatus(request);
    const startDate = request.startDate ? new Date(request.startDate) : null;

    statuses[status] = (statuses[status] || 0) + 1;

    if (startDate && !Number.isNaN(startDate.getTime())) {
      if (!firstDate || startDate < firstDate) firstDate = startDate;
      if (!latestDate || startDate > latestDate) latestDate = startDate;
    }
  });

  return { statuses, firstDate, latestDate };
}

export function buildCustomerSummaries(users) {
  return users.map(customer => {
    return {
      key: getUserKey(customer),
      email: getUserEmail(customer),
      firstName: getUserFirstName(customer),
      lastName: getUserLastName(customer),
      id: getUserId(customer),
      role: getUserRole(customer),
      raw: customer,
    };
  })
    .sort((a, b) => String(a.email).localeCompare(String(b.email)));
}


export const PRODUCT_TYPE_LABELS = PRODUCT_TYPE_LABELS_SOURCE;

import { useEffect, useMemo, useRef, useState } from 'react';
import { productApi } from '../api/products.js';
import { productInRequestApi, quoteRequestApi } from '../api/requests.js';
import { userApi } from '../api/users.js';
import { PRODUCT_TYPE_LABELS } from '../lib/products.js';
import { Icon } from './Icon.jsx';

function getStatus(request) {
  return request?.statusDTO?.name || request?.statusName || request?.status || 'Pending';
}

function getType(request) {
  return request?.typeDTO?.id
    || request?.typeId
    || request?.typeDTO?.name
    || request?.typeName
    || request?.type;
}

function isTypeOne(request) {
  return String(getType(request)).toLowerCase() === '1';
}

function isUnanswered(request) {
  const status = String(getStatus(request)).toLowerCase();
  return ['1', 'pending', 'unanswered', 'open', 'new'].includes(status);
}

function isStatusTwo(request) {
  const status = getStatus(request);
  const statusId = request?.statusDTO?.id || request?.statusId || request?.status;

  return String(statusId).toLowerCase() === '2'
    || String(status).toLowerCase() === '2';
}

function isStatusSix(request) {
  const status = getStatus(request);
  const statusId = request?.statusDTO?.id || request?.statusId || request?.status;

  return String(statusId).toLowerCase() === '6'
    || String(status).toLowerCase() === '6';
}

function hasPassedEndTime(request) {
  const endDate = new Date(request?.endDate);
  if (Number.isNaN(endDate.getTime())) return false;

  return endDate.getTime() < Date.now();
}

function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-DK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatCalendarMonth(date) {
  return new Intl.DateTimeFormat('en-DK', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatCalendarDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat('en-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function getDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDays(date) {
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

function getUserId(customer) {
  return customer?.id
    || customer?.userId
    || customer?.userDTO?.id
    || null;
}

function getUserEmail(customer) {
  return customer?.email
    || customer?.username
    || customer?.userName
    || customer?.name
    || customer?.userDTO?.email
    || 'Unknown';
}

function getUserFirstName(customer) {
  return customer?.firstName
    || customer?.firstname
    || customer?.userDTO?.firstName
    || customer?.userDTO?.firstname
    || '';
}

function getUserLastName(customer) {
  return customer?.lastName
    || customer?.lastname
    || customer?.userDTO?.lastName
    || customer?.userDTO?.lastname
    || '';
}

function getUserRole(customer) {
  const role = customer?.role
    || customer?.roleDTO?.name
    || customer?.userRole
    || customer?.authority
    || customer?.roles?.[0]?.name
    || customer?.roles?.[0]
    || '';

  return typeof role === 'object' ? renderValue(role) : String(role || 'None');
}

function isAdminUser(customer) {
  return String(getUserRole(customer)).toLowerCase() === 'admin';
}

function getUserKey(customer) {
  return String(getUserId(customer) || getUserEmail(customer)).toLowerCase();
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

function renderValue(value) {
  if (value === null || value === undefined || value === '') return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getTenantId(request) {
  return request?.tenantId
    || request?.tenantDTO?.id
    || request?.tenant?.id
    || 1;
}

function getRequestUpdatePayload(request, status) {
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

async function loadProductsForRequest(request) {
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

const hiddenDetailKeys = new Set([
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

const initialProductForm = {
  name: '',
  description: '',
  price: '',
  type: '1',
};

const initialUserForm = {
  email: '',
  firstName: '',
  lastName: '',
};

function getProductEditBase(product) {
  return {
    name: product?.name || '',
    description: product?.description || product?.desc || '',
    price: product?.price ?? '',
    type: String(product?.type ?? '1'),
  };
}

function getProductUpdatePayload(product, edit) {
  return {
    id: product.id,
    name: edit.name.trim(),
    description: edit.description.trim(),
    price: Number(edit.price),
    type: Number(edit.type),
    productInRequestIds: product.productInRequestIds || [],
  };
}

function summarizeCustomerRequests(requests) {
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

function buildCustomerSummaries(users) {
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

export function Admin({
  user,
  products = [],
  productsLoading = false,
  productsError = '',
  onLogout,
  onProductsChanged,
}) {
  const [adminTab, setAdminTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedCalendarRequestId, setSelectedCalendarRequestId] = useState(null);
  const [selectedHistoryRequestId, setSelectedHistoryRequestId] = useState(null);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState(null);
  const [calendarCursor, setCalendarCursor] = useState(null);
  const [requestProducts, setRequestProducts] = useState({});
  const [customerRequestStates, setCustomerRequestStates] = useState({});
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [historyUpdateError, setHistoryUpdateError] = useState('');
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [userForm, setUserForm] = useState(initialUserForm);
  const [userSaving, setUserSaving] = useState(false);
  const [settingAdminUserId, setSettingAdminUserId] = useState(null);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [productEdits, setProductEdits] = useState({});
  const [savingProductId, setSavingProductId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [productListError, setProductListError] = useState('');
  const [productListSuccess, setProductListSuccess] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const productLoadsStarted = useRef(new Set());
  const customerRequestLoadsStarted = useRef(new Set());
  const historyUpdatesStarted = useRef(new Set());
  const productTypeOptions = Object.entries(PRODUCT_TYPE_LABELS);

  const unansweredTypeOneRequests = useMemo(
    () => requests.filter(request => isTypeOne(request) && isUnanswered(request)),
    [requests],
  );

  const acceptedRequests = useMemo(
    () => requests
      .filter(isStatusTwo)
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)),
    [requests],
  );

  const historyRequests = useMemo(
    () => requests
      .filter(isStatusSix)
      .sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0)),
    [requests],
  );

  const customers = useMemo(() => buildCustomerSummaries(users), [users]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter(customer => [
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.id,
      customer.role,
    ].some(value => String(value ?? '').toLowerCase().includes(query)));
  }, [customerSearch, customers]);

  const selectedRequest = useMemo(
    () => unansweredTypeOneRequests.find(request => request.id === selectedRequestId) || unansweredTypeOneRequests[0] || null,
    [selectedRequestId, unansweredTypeOneRequests],
  );

  const selectedCalendarRequest = useMemo(
    () => acceptedRequests.find(request => request.id === selectedCalendarRequestId) || acceptedRequests[0] || null,
    [acceptedRequests, selectedCalendarRequestId],
  );

  const selectedHistoryRequest = useMemo(
    () => historyRequests.find(request => request.id === selectedHistoryRequestId) || historyRequests[0] || null,
    [historyRequests, selectedHistoryRequestId],
  );

  const selectedCustomer = useMemo(
    () => filteredCustomers.find(customer => customer.key === selectedCustomerKey) || filteredCustomers[0] || null,
    [filteredCustomers, selectedCustomerKey],
  );

  const activeProductRequest = adminTab === 'calendar'
    ? selectedCalendarRequest
    : adminTab === 'history'
      ? selectedHistoryRequest
      : selectedRequest;

  const selectedProductsState = selectedRequest?.id
    ? requestProducts[selectedRequest.id] || { items: [], loading: false, error: '' }
    : { items: [], loading: false, error: '' };

  const selectedCalendarProductsState = selectedCalendarRequest?.id
    ? requestProducts[selectedCalendarRequest.id] || { items: [], loading: false, error: '' }
    : { items: [], loading: false, error: '' };

  const selectedHistoryProductsState = selectedHistoryRequest?.id
    ? requestProducts[selectedHistoryRequest.id] || { items: [], loading: false, error: '' }
    : { items: [], loading: false, error: '' };

  const selectedCustomerRequestsState = selectedCustomer?.key
    ? customerRequestStates[selectedCustomer.key] || { items: [], loading: false, error: '' }
    : { items: [], loading: false, error: '' };

  const selectedCustomerRequestSummary = useMemo(
    () => summarizeCustomerRequests(selectedCustomerRequestsState.items),
    [selectedCustomerRequestsState.items],
  );

  const extraDetails = selectedRequest
    ? Object.entries(selectedRequest).filter(([key]) => !hiddenDetailKeys.has(key))
    : [];

  const acceptedRequestsByDay = useMemo(() => acceptedRequests.reduce((acc, request) => {
    const key = getDateKey(request.startDate);
    if (!key) return acc;

    return {
      ...acc,
      [key]: [...(acc[key] || []), request],
    };
  }, {}), [acceptedRequests]);

  const displayedCalendarCursor = useMemo(() => {
    if (calendarCursor) return calendarCursor;

    const selectedDate = new Date(selectedCalendarRequest?.startDate);
    if (!Number.isNaN(selectedDate.getTime())) {
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }

    return new Date();
  }, [calendarCursor, selectedCalendarRequest]);

  const calendarDays = useMemo(() => getMonthDays(displayedCalendarCursor), [displayedCalendarCursor]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter(product => {
      const typeLabel = PRODUCT_TYPE_LABELS[product.type] || `Type ${product.type ?? ''}`;
      return [
        product.id,
        product.name,
        product.description,
        product.desc,
        product.price,
        product.type,
        typeLabel,
      ].some(value => String(value ?? '').toLowerCase().includes(query));
    });
  }, [productSearch, products]);

  const loadRequests = async () => {
    setRequestsLoading(true);
    setRequestsError('');
    setStatusUpdateError('');
    setHistoryUpdateError('');

    try {
      const data = await quoteRequestApi.getAll();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setRequestsError(err.message || 'Could not load requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const data = await userApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsersError(err.message || 'Could not load users.');
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshCustomers = async () => {
    customerRequestLoadsStarted.current.clear();
    setCustomerRequestStates({});
    await loadUsers();
  };

  useEffect(() => {
    let ignore = false;

    async function loadInitialUsers() {
      setUsersLoading(true);
      setUsersError('');

      try {
        const data = await userApi.getAll();
        if (!ignore) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setUsersError(err.message || 'Could not load users.');
        }
      } finally {
        if (!ignore) {
          setUsersLoading(false);
        }
      }
    }

    loadInitialUsers();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialRequests() {
      setRequestsLoading(true);
      setRequestsError('');

      try {
        const data = await quoteRequestApi.getAll();
        if (!ignore) {
          setRequests(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setRequestsError(err.message || 'Could not load requests.');
        }
      } finally {
        if (!ignore) {
          setRequestsLoading(false);
        }
      }
    }

    loadInitialRequests();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeProductRequest?.id) return;
    if (requestProducts[activeProductRequest.id]?.items || requestProducts[activeProductRequest.id]?.loading) return;
    if (productLoadsStarted.current.has(activeProductRequest.id)) return;

    productLoadsStarted.current.add(activeProductRequest.id);

    Promise.resolve()
      .then(() => {
        setRequestProducts(current => ({
          ...current,
          [activeProductRequest.id]: { items: [], loading: true, error: '' },
        }));
      })
      .then(() => loadProductsForRequest(activeProductRequest))
      .then(data => {
        setRequestProducts(current => ({
          ...current,
          [activeProductRequest.id]: { items: data, loading: false, error: '' },
        }));
      })
      .catch(err => {
        setRequestProducts(current => ({
          ...current,
          [activeProductRequest.id]: { items: [], loading: false, error: err.message || 'Could not load products.' },
        }));
      });
  }, [activeProductRequest, requestProducts]);

  useEffect(() => {
    if (requestsLoading || requestsError) return;

    const expiredRequests = requests.filter(request => (
      request?.id
      && hasPassedEndTime(request)
      && !isStatusSix(request)
      && !historyUpdatesStarted.current.has(request.id)
    ));

    if (!expiredRequests.length) return;

    expiredRequests.forEach(request => {
      historyUpdatesStarted.current.add(request.id);
    });

    Promise.all(expiredRequests.map(async request => {
      const payload = getRequestUpdatePayload(request, 6);
      const updatedRequest = await quoteRequestApi.update(request.id, payload);

      return updatedRequest && typeof updatedRequest === 'object'
        ? updatedRequest
        : { ...request, status: 6, statusDTO: { ...request.statusDTO, id: 6, name: 'History' } };
    }))
      .then(updatedRequests => {
        setRequests(current => current.map(request => (
          updatedRequests.find(updatedRequest => updatedRequest.id === request.id) || request
        )));
      })
      .catch(err => {
        setHistoryUpdateError(err.message || 'Could not move passed requests to history.');
      });
  }, [requests, requestsError, requestsLoading]);

  useEffect(() => {
    if (adminTab !== 'users') return;
    if (!selectedCustomer?.key || !selectedCustomer?.id) return;
    if (customerRequestStates[selectedCustomer.key]?.items || customerRequestStates[selectedCustomer.key]?.loading) return;
    if (customerRequestLoadsStarted.current.has(selectedCustomer.key)) return;

    customerRequestLoadsStarted.current.add(selectedCustomer.key);

    Promise.resolve()
      .then(() => {
        setCustomerRequestStates(current => ({
          ...current,
          [selectedCustomer.key]: { items: [], loading: true, error: '' },
        }));
      })
      .then(() => quoteRequestApi.getByUserId(selectedCustomer.id))
      .then(data => {
        const items = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
          : [];

        setCustomerRequestStates(current => ({
          ...current,
          [selectedCustomer.key]: { items, loading: false, error: '' },
        }));
      })
      .catch(err => {
        setCustomerRequestStates(current => ({
          ...current,
          [selectedCustomer.key]: { items: [], loading: false, error: err.message || 'Could not load user requests.' },
        }));
      });
  }, [adminTab, customerRequestStates, selectedCustomer]);

  const updateSelectedRequestStatus = async (status, statusName, actionName) => {
    if (!selectedRequest?.id || updatingRequest) return;

    setUpdatingRequest({ id: selectedRequest.id, actionName });
    setStatusUpdateError('');

    try {
      const payload = getRequestUpdatePayload(selectedRequest, status);
      const updatedRequest = await quoteRequestApi.update(selectedRequest.id, payload);
      const nextRequest = updatedRequest && typeof updatedRequest === 'object'
        ? updatedRequest
        : { ...selectedRequest, status, statusDTO: { ...selectedRequest.statusDTO, id: status, name: statusName } };

      setRequests(current => current.map(request => (
        request.id === selectedRequest.id ? nextRequest : request
      )));
      setSelectedRequestId(null);
    } catch (err) {
      setStatusUpdateError(err.message || `Could not ${actionName.toLowerCase()} request.`);
    } finally {
      setUpdatingRequest(null);
    }
  };

  const updateProductField = (field, value) => {
    setProductForm(current => ({ ...current, [field]: value }));
    setProductError('');
    setProductSuccess('');
  };

  const updateUserField = (field, value) => {
    setUserForm(current => ({ ...current, [field]: value }));
    setUserError('');
    setUserSuccess('');
  };

  const createProduct = async (event) => {
    event.preventDefault();

    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const price = Number(productForm.price);
    const type = Number(productForm.type);

    if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(type)) {
      setProductError('Add a name, valid price, and product type.');
      return;
    }

    setProductSaving(true);
    setProductError('');
    setProductSuccess('');

    try {
      await productApi.create({
        name,
        description,
        price,
        type,
        productInRequestIds: [],
      });
      setProductForm(initialProductForm);
      setProductSuccess(`${name} was added to products.`);
      if (onProductsChanged) {
        await onProductsChanged();
      }
    } catch (err) {
      setProductError(err.message || 'Could not add product.');
    } finally {
      setProductSaving(false);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();

    const email = userForm.email.trim();
    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const password = 'change me';

    if (!email || !firstName || !lastName) {
      setUserError('Add email, first name, and last name.');
      return;
    }

    setUserSaving(true);
    setUserError('');
    setUserSuccess('');

    try {
      const registeredUser = await userApi.register({ email, password });
      const userId = getUserId(registeredUser);
      const allUsers = await userApi.getAll();
      const nextUsers = Array.isArray(allUsers) ? allUsers : [];
      const createdUser = nextUsers.find(nextUser => (
        String(getUserEmail(nextUser)).toLowerCase() === email.toLowerCase()
      ));
      const createdUserId = userId || getUserId(createdUser);

      if (!createdUserId) {
        throw new Error('User was registered, but the new user id was not returned by the API.');
      }

      const updateBase = createdUser || registeredUser || {};
      await userApi.update(createdUserId, {
        ...updateBase,
        id: createdUserId,
        email,
        firstName,
        lastName,
      });
      const refreshedUsers = await userApi.getAll();
      const refreshedUser = Array.isArray(refreshedUsers)
        ? refreshedUsers.find(nextUser => String(getUserId(nextUser)) === String(createdUserId))
        : null;

      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : nextUsers);
      setSelectedCustomerKey(getUserKey(refreshedUser || { id: createdUserId, email }));
      setUserForm(initialUserForm);
      setUserSuccess(`${firstName} ${lastName} was added. Temporary password: ${password}`);
    } catch (err) {
      setUserError(err.message || 'Could not add user.');
    } finally {
      setUserSaving(false);
    }
  };

  const makeUserAdmin = async (selectedUser) => {
    if (!selectedUser?.id || settingAdminUserId) return;

    setSettingAdminUserId(selectedUser.id);
    setUserError('');
    setUserSuccess('');

    try {
      await userApi.setAdmin(selectedUser.id);
      const refreshedUsers = await userApi.getAll();
      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : users);
      setSelectedCustomerKey(selectedUser.key);
      setUserSuccess(`${selectedUser.email} is now an admin.`);
    } catch (err) {
      setUserError(err.message || 'Could not make user admin.');
    } finally {
      setSettingAdminUserId(null);
    }
  };

  const getProductEdit = (product) => productEdits[product.id] || getProductEditBase(product);

  const updateProductEdit = (product, field, value) => {
    setProductEdits(current => ({
      ...current,
      [product.id]: {
        ...getProductEditBase(product),
        ...current[product.id],
        [field]: value,
      },
    }));
    setProductListError('');
    setProductListSuccess('');
  };

  const saveProduct = async (product) => {
    const edit = getProductEdit(product);
    const payload = getProductUpdatePayload(product, edit);

    if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0 || !Number.isFinite(payload.type)) {
      setProductListError('Each product needs a name, valid price, and type before saving.');
      return;
    }

    setSavingProductId(product.id);
    setProductListError('');
    setProductListSuccess('');

    try {
      await productApi.update(product.id, payload);
      setProductEdits(current => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      setProductListSuccess(`${payload.name} was updated.`);
      if (onProductsChanged) {
        await onProductsChanged();
      }
    } catch (err) {
      setProductListError(err.message || 'Could not update product.');
    } finally {
      setSavingProductId(null);
    }
  };

  const deleteProduct = async (product) => {
    if (!product?.id || deletingProductId) return;
    const name = product.name || `Product #${product.id}`;
    const confirmed = window.confirm(`Delete ${name}?`);
    if (!confirmed) return;

    setDeletingProductId(product.id);
    setProductListError('');
    setProductListSuccess('');

    try {
      await productApi.delete(product.id);
      setProductEdits(current => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      setProductListSuccess(`${name} was deleted.`);
      if (onProductsChanged) {
        await onProductsChanged();
      }
    } catch (err) {
      setProductListError(err.message || 'Could not delete product.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const moveCalendarMonth = (direction) => {
    setCalendarCursor(current => {
      const base = current || displayedCalendarCursor;
      return new Date(base.getFullYear(), base.getMonth() + direction, 1);
    });
  };

  return (
    <main className="profile-page admin-page">
      {/* <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Admin</div>
          <h1>Requests</h1>
          <p>{user?.email}</p>
        </div>
      </section> */}

     

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          className={`admin-tab ${adminTab === 'requests' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={adminTab === 'requests'}
          onClick={() => setAdminTab('requests')}
        >
          Requests
        </button>
        <button
          className={`admin-tab ${adminTab === 'products' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={adminTab === 'products'}
          onClick={() => setAdminTab('products')}
        >
          Products
        </button>
        <button
          className={`admin-tab ${adminTab === 'calendar' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={adminTab === 'calendar'}
          onClick={() => setAdminTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`admin-tab ${adminTab === 'users' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={adminTab === 'users'}
          onClick={() => setAdminTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab ${adminTab === 'history' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={adminTab === 'history'}
          onClick={() => setAdminTab('history')}
        >
          History
        </button>
      </div>

      {adminTab === 'requests' && (
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
          <button className="btn btn-blue" type="button" onClick={loadRequests} disabled={requestsLoading}>
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
                    onClick={() => setSelectedRequestId(request.id)}
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
                        onClick={() => updateSelectedRequestStatus(2, 'Accepted', 'Accept')}
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
                        onClick={() => updateSelectedRequestStatus(99, 'Dismissed', 'Dismiss')}
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
      </section>
      )}

      {adminTab === 'calendar' && (
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
            <button className="btn btn-blue" type="button" onClick={loadRequests} disabled={requestsLoading}>
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
                  <button className="admin-calendar-nav" type="button" onClick={() => moveCalendarMonth(-1)} aria-label="Previous month">
                    <Icon name="chevL" size={18} />
                  </button>
                  <h3>{formatCalendarMonth(displayedCalendarCursor)}</h3>
                  <button className="admin-calendar-nav" type="button" onClick={() => moveCalendarMonth(1)} aria-label="Next month">
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
                                onClick={() => setSelectedCalendarRequestId(request.id)}
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
        </section>
      )}

      {adminTab === 'history' && (
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
            <button className="btn btn-blue" type="button" onClick={loadRequests} disabled={requestsLoading}>
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
                      onClick={() => setSelectedHistoryRequestId(request.id)}
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
        </section>
      )}

      {adminTab === 'users' && (
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
            <button className="btn btn-blue" type="button" onClick={refreshCustomers} disabled={usersLoading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          <form className="admin-product-form admin-user-form" onSubmit={createUser}>
            {userError && <div className="form-error">{userError}</div>}
            {userSuccess && <div className="form-success">{userSuccess}</div>}

            <div className="field-row">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={event => updateUserField('email', event.target.value)}
                  placeholder="user@inbox.dk"
                />
              </div>
              <div className="field">
                <label>First name</label>
                <input
                  value={userForm.firstName}
                  onChange={event => updateUserField('firstName', event.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="field">
                <label>Last name</label>
                <input
                  value={userForm.lastName}
                  onChange={event => updateUserField('lastName', event.target.value)}
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
                  onChange={event => setCustomerSearch(event.target.value)}
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
                          onClick={() => setSelectedCustomerKey(customer.key)}
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
                            <button
                              className="btn btn-blue"
                              type="button"
                              onClick={() => makeUserAdmin(selectedCustomer)}
                              disabled={!selectedCustomer.id || isAdminUser(selectedCustomer) || settingAdminUserId === selectedCustomer.id}
                            >
                              {settingAdminUserId === selectedCustomer.id
                                ? 'Updating...'
                                : isAdminUser(selectedCustomer)
                                  ? 'Admin'
                                  : 'Make admin'}
                              <Icon name="check" size={18} />
                            </button>
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
        </section>
      )}

      {adminTab === 'products' && (
        <section className="profile-requests admin-products">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Products</div>
              <h2>Add product</h2>
            </div>
          </div>

          <form className="admin-product-form" onSubmit={createProduct}>
            {productError && <div className="form-error">{productError}</div>}
            {productSuccess && <div className="form-success">{productSuccess}</div>}

            <div className="field-row">
              <div className="field">
                <label>Name</label>
                <input
                  value={productForm.name}
                  onChange={event => updateProductField('name', event.target.value)}
                  placeholder="Seasonal lunch box"
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={productForm.type}
                  onChange={event => updateProductField('type', event.target.value)}
                >
                  {productTypeOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                value={productForm.description}
                onChange={event => updateProductField('description', event.target.value)}
                placeholder="Short customer-facing description"
                rows="4"
              />
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.price}
                  onChange={event => updateProductField('price', event.target.value)}
                  placeholder="125"
                />
              </div>
              <div className="admin-product-submit">
                <button className="btn btn-blue" type="submit" disabled={productSaving}>
                  {productSaving ? 'Adding...' : 'Add product'}
                  <Icon name="plus" size={18} />
                </button>
              </div>
            </div>
          </form>

          <div className="admin-products-list">
            <div className="profile-section-head admin-products-list-head">
              <div>
                <div className="section-eyebrow">Inventory</div>
                <h2>All products</h2>
              </div>
              <button className="btn btn-blue" type="button" onClick={onProductsChanged} disabled={productsLoading}>
                Refresh <Icon name="arrow" size={18} />
              </button>
            </div>

            {productListError && <div className="form-error">{productListError}</div>}
            {productListSuccess && <div className="form-success">{productListSuccess}</div>}
            {productsLoading && <div className="profile-empty">Loading products...</div>}
            {productsError && <div className="form-error">{productsError}</div>}
            {!productsLoading && !productsError && products.length === 0 && (
              <div className="profile-empty">No products found.</div>
            )}

            {products.length > 0 && (
              <div className="admin-product-search field">
                <label>Search products</label>
                <input
                  value={productSearch}
                  onChange={event => setProductSearch(event.target.value)}
                  placeholder="Search by name, type, price, id, or description"
                />
              </div>
            )}

            {!productsLoading && !productsError && products.length > 0 && filteredProducts.length === 0 && (
              <div className="profile-empty">No products match your search.</div>
            )}

            {products.length > 0 && (
              <div className="admin-product-table-wrap">
                <table className="admin-product-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const edit = getProductEdit(product);
                      const saving = savingProductId === product.id;
                      const deleting = deletingProductId === product.id;

                      return (
                        <tr key={product.id}>
                          <td className="admin-product-id">#{product.id}</td>
                          <td>
                            <input
                              aria-label={`Name for product ${product.id}`}
                              value={edit.name}
                              onChange={event => updateProductEdit(product, 'name', event.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              aria-label={`Type for product ${product.id}`}
                              value={edit.type}
                              onChange={event => updateProductEdit(product, 'type', event.target.value)}
                            >
                              {productTypeOptions.map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              aria-label={`Price for product ${product.id}`}
                              type="number"
                              min="0"
                              step="1"
                              value={edit.price}
                              onChange={event => updateProductEdit(product, 'price', event.target.value)}
                            />
                          </td>
                          <td>
                            <textarea
                              aria-label={`Description for product ${product.id}`}
                              value={edit.description}
                              onChange={event => updateProductEdit(product, 'description', event.target.value)}
                              rows="2"
                            />
                          </td>
                          <td>
                            <div className="admin-product-actions">
                              <button className="btn btn-blue" type="button" onClick={() => saveProduct(product)} disabled={saving || deleting}>
                                {saving ? 'Saving...' : 'Save'}
                                <Icon name="check" size={18} />
                              </button>
                              <button className="btn btn-cream admin-delete-product-btn" type="button" onClick={() => deleteProduct(product)} disabled={saving || deleting}>
                                {deleting ? 'Deleting...' : 'Delete'}
                                <Icon name="x" size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="admin-logout-panel">
        <div>
          <span>Session</span>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-cream" type="button" onClick={onLogout}>
          Log out <Icon name="logout" size={18} />
        </button>
      </section>
    </main>
  );
}

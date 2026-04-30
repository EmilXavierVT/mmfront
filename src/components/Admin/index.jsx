import { useEffect, useMemo, useRef, useState } from 'react';
import { productApi } from '../../api/products.js';
import { quoteRequestApi } from '../../api/requests.js';
import { userApi } from '../../api/users.js';
import { AdminSession } from './AdminSession.jsx';
import { AdminTabs } from './AdminTabs.jsx';
import { CalendarPanel } from './CalendarPanel.jsx';
import { EmailPanel } from './EmailPanel.jsx';
import { HistoryPanel } from './HistoryPanel.jsx';
import { ProductsPanel } from './ProductsPanel.jsx';
import { RequestsPanel } from './RequestsPanel.jsx';
import { UsersPanel } from './UsersPanel.jsx';
import {
  PRODUCT_TYPE_LABELS,
  buildCustomerSummaries,
  getDateKey,
  getMonthDays,
  getProductEditBase,
  getProductUpdatePayload,
  getRequestUpdatePayload,
  getUserEmail,
  getUserId,
  getUserKey,
  hasPassedEndTime,
  hiddenDetailKeys,
  initialProductForm,
  initialUserForm,
  isStatusSix,
  isStatusTwo,
  isTypeOne,
  isUnanswered,
  loadProductsForRequest,
  summarizeCustomerRequests,
} from './adminUtils.js';

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

     

      <AdminTabs adminTab={adminTab} onTabChange={setAdminTab} />

      {adminTab === 'requests' && (
        <RequestsPanel
          requests={requests}
          unansweredTypeOneRequests={unansweredTypeOneRequests}
          selectedRequest={selectedRequest}
          selectedProductsState={selectedProductsState}
          extraDetails={extraDetails}
          requestsLoading={requestsLoading}
          requestsError={requestsError}
          statusUpdateError={statusUpdateError}
          updatingRequest={updatingRequest}
          onRefresh={loadRequests}
          onSelectRequest={setSelectedRequestId}
          onUpdateStatus={updateSelectedRequestStatus}
        />
      )}

      {adminTab === 'calendar' && (
        <CalendarPanel
          acceptedRequests={acceptedRequests}
          selectedCalendarRequest={selectedCalendarRequest}
          selectedCalendarProductsState={selectedCalendarProductsState}
          requestsLoading={requestsLoading}
          requestsError={requestsError}
          displayedCalendarCursor={displayedCalendarCursor}
          calendarDays={calendarDays}
          acceptedRequestsByDay={acceptedRequestsByDay}
          onRefresh={loadRequests}
          onMoveMonth={moveCalendarMonth}
          onSelectRequest={setSelectedCalendarRequestId}
        />
      )}

      {adminTab === 'history' && (
        <HistoryPanel
          historyRequests={historyRequests}
          selectedHistoryRequest={selectedHistoryRequest}
          selectedHistoryProductsState={selectedHistoryProductsState}
          requestsLoading={requestsLoading}
          requestsError={requestsError}
          historyUpdateError={historyUpdateError}
          onRefresh={loadRequests}
          onSelectRequest={setSelectedHistoryRequestId}
        />
      )}

      {adminTab === 'users' && (
        <UsersPanel
          customers={customers}
          filteredCustomers={filteredCustomers}
          selectedCustomer={selectedCustomer}
          selectedCustomerRequestsState={selectedCustomerRequestsState}
          selectedCustomerRequestSummary={selectedCustomerRequestSummary}
          usersLoading={usersLoading}
          usersError={usersError}
          userError={userError}
          userSuccess={userSuccess}
          userForm={userForm}
          userSaving={userSaving}
          customerSearch={customerSearch}
          settingAdminUserId={settingAdminUserId}
          onRefresh={refreshCustomers}
          onCreateUser={createUser}
          onUpdateUserField={updateUserField}
          onSearchChange={setCustomerSearch}
          onSelectCustomer={setSelectedCustomerKey}
          onMakeAdmin={makeUserAdmin}
        />
      )}

      {adminTab === 'email' && (
        <EmailPanel
          customers={customers}
          selectedCustomer={selectedCustomer}
          senderEmail={user?.email}
        />
      )}

      {adminTab === 'products' && (
        <ProductsPanel
          products={products}
          filteredProducts={filteredProducts}
          productsLoading={productsLoading}
          productsError={productsError}
          productForm={productForm}
          productSaving={productSaving}
          productError={productError}
          productSuccess={productSuccess}
          productListError={productListError}
          productListSuccess={productListSuccess}
          productSearch={productSearch}
          productTypeOptions={productTypeOptions}
          savingProductId={savingProductId}
          deletingProductId={deletingProductId}
          onCreateProduct={createProduct}
          onUpdateProductField={updateProductField}
          onProductsChanged={onProductsChanged}
          onSearchChange={setProductSearch}
          getProductEdit={getProductEdit}
          onUpdateProductEdit={updateProductEdit}
          onSaveProduct={saveProduct}
          onDeleteProduct={deleteProduct}
        />
      )}

      <AdminSession user={user} onLogout={onLogout} />
    </main>
  );
}

import { useMemo, useState } from 'react';
import { emailApi } from '../../api/email.js';
import { productApi } from '../../api/products.js';
import { quoteRequestApi } from '../../api/requests.js';
import { userApi } from '../../api/users.js';
import { AdminSession } from './AdminSession/AdminSession.jsx';
import { AdminTabs } from './AdminTabs/AdminTabs.jsx';
import { CalendarPanel } from './CalendarPanel/CalendarPanel.jsx';
import { EmailPanel } from './EmailPanel/EmailPanel.jsx';
import { HistoryPanel } from './HistoryPanel/HistoryPanel.jsx';
import { ProductsPanel } from './ProductsPanel/ProductsPanel.jsx';
import { RequestsPanel } from './RequestsPanel/RequestsPanel.jsx';
import { UsersPanel } from './UsersPanel/UsersPanel.jsx';
import {
  useAdminRequests,
  useAdminUsers,
  useLazyCustomerRequests,
  useLazyRequestProducts,
} from './useAdminData.js';
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
  hiddenDetailKeys,
  initialProductForm,
  initialUserForm,
  isStatusSix,
  isStatusTwo,
  isTypeOne,
  isUnanswered,
  summarizeCustomerRequests,
} from './adminUtils.js';

const APP_URL = 'https://morgendagensmaaltid.dk';
const EMAIL_LOGO_URL = `${APP_URL}/fistIcon.png`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRoleLabel(role) {
  if (role === 'CLEANING_CLIENT') return 'cleaning customer';
  if (role === 'EMPLOYEE') return 'employee';
  if (role === 'CLEANING_STAFF') return 'employee';
  if (role === 'ADMIN') return 'admin';
  return 'user';
}

function getRolesForNewUser(role) {
  return Array.from(new Set(['USER', role].filter(Boolean)));
}

function buildAdminCreatedUserEmail({ email, firstName, role, password }) {
  const safeFirstName = escapeHtml(firstName || 'there');
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(getRoleLabel(role));
  const safePassword = escapeHtml(password);
  const isCleaningCustomer = role === 'CLEANING_CLIENT';
  const subject = isCleaningCustomer
    ? 'Welcome to Morgendagens Maaltid Cleaning'
    : 'Your Morgendagens Maaltid account is ready';
  const intro = isCleaningCustomer
    ? 'Welcome to Morgendagens Maaltid Cleaning. Your personal account has been created and is ready to use.'
    : `An administrator created a new ${safeRole} account for you at Morgendagens Maaltid.`;
  const guidance = isCleaningCustomer
    ? 'You can use your account to stay in touch with us and manage your cleaning-related details and tell us when you go on vacation. We recommend changing your password after your first login.'
    : 'Use the login details below to sign in. We recommend changing your password after your first login.';

  return {
    subject,
    body: `
      <div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <div style="background:#1A171B;padding:28px 24px;color:#ffffff;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;width:76px;border:0;">
                  <img src="${EMAIL_LOGO_URL}" width="64" height="64" alt="Morgendagens Maaltid" style="display:block;border:0;outline:none;text-decoration:none;width:64px;height:64px;object-fit:contain;" />
                </td>
                <td style="vertical-align:middle;">
                  <div style="font-size:13px;letter-spacing:1.6px;text-transform:uppercase;color:#d1d5db;font-weight:700;">Morgendagens Maaltid</div>
                  <h1 style="margin:8px 0 0;font-size:28px;line-height:1.1;color:#ffffff;">Your account is ready</h1>
                </td>
              </tr>
            </table>
          </div>

          <div style="padding:28px 24px;">
            <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi ${safeFirstName},</p>
            <p style="margin:0 0 16px;font-size:16px;color:#374151;">${intro}</p>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;">${guidance}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <tbody>
                <tr>
                  <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;width:34%;">Email</th>
                  <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;color:#111827;">${safeEmail}</td>
                </tr>
                <tr>
                  <th style="text-align:left;padding:12px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;width:34%;">Role</th>
                  <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;color:#111827;text-transform:capitalize;">${safeRole}</td>
                </tr>
                <tr>
                  <th style="text-align:left;padding:12px 14px;color:#6b7280;font-weight:600;width:34%;">Temporary password</th>
                  <td style="padding:12px 14px;color:#111827;font-weight:700;">${safePassword}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top:24px;">
              <a href="${APP_URL}" style="display:inline-block;background:#0496ff;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;">Open Morgendagens Maaltid</a>
            </div>

            <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">If you were not expecting this account, please contact Morgendagens Maaltid.</p>
          </div>
        </div>
      </div>
    `,
  };
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
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedCalendarRequestId, setSelectedCalendarRequestId] = useState(null);
  const [selectedHistoryRequestId, setSelectedHistoryRequestId] = useState(null);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState(null);
  const [calendarCursor, setCalendarCursor] = useState(null);
  const [updatingRequest, setUpdatingRequest] = useState(null);
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
  const {
    requests,
    setRequests,
    requestsLoading,
    requestsError,
    statusUpdateError,
    setStatusUpdateError,
    historyUpdateError,
    loadRequests,
  } = useAdminRequests();
  const {
    users,
    setUsers,
    usersLoading,
    usersError,
    loadUsers,
  } = useAdminUsers();
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
  const {
    customerRequestStates,
    resetCustomerRequestStates,
  } = useLazyCustomerRequests(adminTab, selectedCustomer);

  const activeProductRequest = adminTab === 'calendar'
    ? selectedCalendarRequest
    : adminTab === 'history'
      ? selectedHistoryRequest
      : selectedRequest;
  const { requestProducts } = useLazyRequestProducts(activeProductRequest);

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

  const refreshCustomers = async () => {
    resetCustomerRequestStates();
    await loadUsers();
  };

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
    const role = String(userForm.role || 'USER').toUpperCase();
    const roles = getRolesForNewUser(role);
    const roleLabel = getRoleLabel(role);
    const password = 'ChangeMe!';

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
        roles,
      });
      const refreshedUsers = await userApi.getAll();
      const refreshedUser = Array.isArray(refreshedUsers)
        ? refreshedUsers.find(nextUser => String(getUserId(nextUser)) === String(createdUserId))
        : null;

      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : nextUsers);
      setSelectedCustomerKey(getUserKey(refreshedUser || { id: createdUserId, email }));
      setUserForm(initialUserForm);

      const accountEmail = buildAdminCreatedUserEmail({
        email,
        firstName,
        role,
        password,
      });

      try {
        await emailApi.send({
          to: email,
          subject: accountEmail.subject,
          body: accountEmail.body,
          html: true,
        });
        setUserSuccess(`${firstName} ${lastName} was added as ${roleLabel}. Temporary password: ${password}. Email sent.`);
      } catch (emailError) {
        setUserSuccess(`${firstName} ${lastName} was added as ${roleLabel}. Temporary password: ${password}. Email could not be sent: ${emailError.message || 'unknown error'}`);
      }
    } catch (err) {
      setUserError(err.message || 'Could not add user.');
    } finally {
      setUserSaving(false);
    }
  };

  const makeUserEmployee = async (selectedUser) => {
    if (!selectedUser?.id || settingAdminUserId) return;

    setSettingAdminUserId(selectedUser.id);
    setUserError('');
    setUserSuccess('');

    try {
      await userApi.setEmployee(selectedUser.id, {
        ...selectedUser.raw,
        id: selectedUser.id,
        email: selectedUser.email,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        roles: ['USER', 'EMPLOYEE'],
      });
      const refreshedUsers = await userApi.getAll();
      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : users);
      setSelectedCustomerKey(selectedUser.key);
      setUserSuccess(`${selectedUser.email} is now an employee.`);
    } catch (err) {
      setUserError(err.message || 'Could not make user employee.');
    } finally {
      setSettingAdminUserId(null);
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
          onMakeEmployee={makeUserEmployee}
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

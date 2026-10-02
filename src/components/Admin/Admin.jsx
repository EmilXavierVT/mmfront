import { useMemo, useState } from 'react';
import { emailApi } from '../../api/email.js';
import { quoteRequestApi } from '../../api/requests.js';
import { subscriptionDealApi } from '../../api/subscriptionDeals.js';
import { userApi } from '../../api/users.js';
import { AdminSession } from './AdminSession/AdminSession.jsx';
import { AdminTabs } from './AdminTabs/AdminTabs.jsx';
import { CalendarPanel } from './CalendarPanel/CalendarPanel.jsx';
import { CustomersPanel } from './CustomersPanel/CustomersPanel.jsx';
import { EmailPanel } from './EmailPanel/EmailPanel.jsx';
import { HistoryPanel } from './HistoryPanel/HistoryPanel.jsx';
import { ProductsPanel } from './ProductsPanel/ProductsPanel.jsx';
import { RequestsPanel } from './RequestsPanel/RequestsPanel.jsx';
import { UsersPanel } from './UsersPanel/UsersPanel.jsx';
import { getProductYear } from '../../lib/products.js';
import {
  useAdminRequests,
  useAdminUsers,
  useEconomicCustomers,
  useLazyCustomerRequests,
  useLazyRequestProducts,
} from './useAdminData.js';
import {
  PRODUCT_TYPE_LABELS,
  buildCustomerSummaries,
  getDateKey,
  getMonthDays,
  getRequestUpdatePayload,
  getUserEmail,
  getUserId,
  getUserKey,
  hiddenDetailKeys,
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

function getRolesForNewUser(role, cleaningClientType = 'FLEX') {
  if (role === 'CLEANING_CLIENT') {
    return Array.from(new Set(['USER', 'CLEANING_CLIENT', cleaningClientType].filter(Boolean)));
  }

  return Array.from(new Set(['USER', role].filter(Boolean)));
}

function getEconomicCustomerGroupKey(customer) {
  const group = customer?.customerGroup;
  return String(group?.customerGroupNumber ?? group?.name ?? '');
}

function getEconomicCustomerCountryKey(customer) {
  return String(customer?.country || '').trim().toLocaleLowerCase('da');
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
  const [userForm, setUserForm] = useState(initialUserForm);
  const [userSaving, setUserSaving] = useState(false);
  const [settingAdminUserId, setSettingAdminUserId] = useState(null);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productYear, setProductYear] = useState('all');
  const [productMinPrice, setProductMinPrice] = useState('');
  const [productMaxPrice, setProductMaxPrice] = useState('');
  const [productSort, setProductSort] = useState('name-asc');
  const [customerSearch, setCustomerSearch] = useState('');
  const [economicCustomerSearch, setEconomicCustomerSearch] = useState('');
  const [economicCustomerGroup, setEconomicCustomerGroup] = useState('all');
  const [economicCustomerCountry, setEconomicCustomerCountry] = useState('all');
  const [economicCustomerStatus, setEconomicCustomerStatus] = useState('all');
  const [economicCustomerBalance, setEconomicCustomerBalance] = useState('all');
  const [economicCustomerSort, setEconomicCustomerSort] = useState('name-asc');
  const [selectedEconomicCustomerNumber, setSelectedEconomicCustomerNumber] = useState(null);
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
  const {
    customers: economicCustomers,
    customersLoading: economicCustomersLoading,
    customersError: economicCustomersError,
    loadCustomers: loadEconomicCustomers,
  } = useEconomicCustomers(adminTab === 'customers' || adminTab === 'email');
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

  const economicCustomerGroups = useMemo(() => Array.from(economicCustomers.reduce((groups, customer) => {
    const key = getEconomicCustomerGroupKey(customer);
    if (!key || groups.has(key)) return groups;
    const group = customer.customerGroup;
    groups.set(key, group?.name || `Group ${group?.customerGroupNumber || key}`);
    return groups;
  }, new Map()).entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'da', { numeric: true })), [economicCustomers]);

  const economicCustomerCountries = useMemo(() => Array.from(economicCustomers.reduce((countries, customer) => {
    const key = getEconomicCustomerCountryKey(customer);
    if (!key || countries.has(key)) return countries;
    countries.set(key, String(customer.country).trim());
    return countries;
  }, new Map()).entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'da')), [economicCustomers]);

  const filteredEconomicCustomers = useMemo(() => {
    const query = economicCustomerSearch.trim().toLowerCase();
    const filtered = economicCustomers.filter(customer => {
      const groupKey = getEconomicCustomerGroupKey(customer);
      const countryKey = getEconomicCustomerCountryKey(customer);
      const balance = Number(customer.balance || 0);
      const matchesSearch = !query || [
        customer.customerNumber,
        customer.name,
        customer.email,
        customer.city,
        customer.zip,
        customer.country,
        customer.corporateIdentificationNumber,
        customer.vatNumber,
        customer.customerGroup?.name,
        customer.customerGroup?.customerGroupNumber,
      ].some(value => String(value ?? '').toLowerCase().includes(query));
      const matchesGroup = economicCustomerGroup === 'all' || groupKey === economicCustomerGroup;
      const matchesCountry = economicCustomerCountry === 'all' || countryKey === economicCustomerCountry;
      const matchesStatus = economicCustomerStatus === 'all'
        || (economicCustomerStatus === 'barred' ? customer.barred === true : customer.barred !== true);
      const matchesBalance = economicCustomerBalance === 'all'
        || (economicCustomerBalance === 'positive' && balance > 0)
        || (economicCustomerBalance === 'zero' && balance === 0)
        || (economicCustomerBalance === 'negative' && balance < 0);
      return matchesSearch && matchesGroup && matchesCountry && matchesStatus && matchesBalance;
    });

    return filtered.sort((a, b) => {
      if (economicCustomerSort === 'name-desc') return String(b.name || '').localeCompare(String(a.name || ''), 'da');
      if (economicCustomerSort === 'number-asc') return Number(a.customerNumber || 0) - Number(b.customerNumber || 0);
      if (economicCustomerSort === 'balance-desc') return Number(b.balance || 0) - Number(a.balance || 0);
      if (economicCustomerSort === 'balance-asc') return Number(a.balance || 0) - Number(b.balance || 0);
      if (economicCustomerSort === 'updated-desc') {
        return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
      }
      return String(a.name || '').localeCompare(String(b.name || ''), 'da');
    });
  }, [
    economicCustomerBalance,
    economicCustomerCountry,
    economicCustomerGroup,
    economicCustomerSearch,
    economicCustomerSort,
    economicCustomerStatus,
    economicCustomers,
  ]);

  const clearEconomicCustomerFilters = () => {
    setEconomicCustomerSearch('');
    setEconomicCustomerGroup('all');
    setEconomicCustomerCountry('all');
    setEconomicCustomerStatus('all');
    setEconomicCustomerBalance('all');
    setEconomicCustomerSort('name-asc');
  };

  const selectedEconomicCustomer = useMemo(
    () => filteredEconomicCustomers.find(customer => customer.customerNumber === selectedEconomicCustomerNumber)
      || filteredEconomicCustomers[0]
      || null,
    [filteredEconomicCustomers, selectedEconomicCustomerNumber],
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

  const productYears = useMemo(() => Array.from(new Set(products
    .map(getProductYear)
    .filter(Number.isFinite)))
    .sort((a, b) => b - a), [products]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const minPrice = productMinPrice === '' ? null : Number(productMinPrice);
    const maxPrice = productMaxPrice === '' ? null : Number(productMaxPrice);

    const filtered = products.filter(product => {
      const typeLabel = PRODUCT_TYPE_LABELS[product.type] || `Type ${product.type ?? ''}`;
      const matchesSearch = !query || [
        product.id,
        product.economicProductNumber,
        product.economicProductGroupName,
        product.economicProductGroupNumber,
        product.name,
        product.description,
        product.desc,
        product.price,
        product.type,
        typeLabel,
      ].some(value => String(value ?? '').toLowerCase().includes(query));
      const productCatalogYear = getProductYear(product);
      const price = Number(product.price || 0);
      const matchesYear = productYear === 'all' || productCatalogYear === Number(productYear);
      const matchesMin = minPrice === null || Number.isNaN(minPrice) || price >= minPrice;
      const matchesMax = maxPrice === null || Number.isNaN(maxPrice) || price <= maxPrice;
      return matchesSearch && matchesYear && matchesMin && matchesMax;
    });

    return filtered.sort((a, b) => {
      if (productSort === 'name-desc') return b.name.localeCompare(a.name, 'da');
      if (productSort === 'category-asc') {
        const categoryA = PRODUCT_TYPE_LABELS[a.type] || `Type ${a.type ?? ''}`;
        const categoryB = PRODUCT_TYPE_LABELS[b.type] || `Type ${b.type ?? ''}`;
        return categoryA.localeCompare(categoryB, 'da') || a.name.localeCompare(b.name, 'da');
      }
      if (productSort === 'price-asc') return Number(a.price) - Number(b.price);
      if (productSort === 'price-desc') return Number(b.price) - Number(a.price);
      if (productSort === 'updated-desc') {
        return new Date(b.economicLastUpdated || 0) - new Date(a.economicLastUpdated || 0);
      }
      return a.name.localeCompare(b.name, 'da');
    });
  }, [productMaxPrice, productMinPrice, productSearch, productSort, productYear, products]);

  const clearProductFilters = () => {
    setProductSearch('');
    setProductYear('all');
    setProductMinPrice('');
    setProductMaxPrice('');
    setProductSort('name-asc');
  };

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

  const updateUserField = (field, value) => {
    setUserForm(current => ({ ...current, [field]: value }));
    setUserError('');
    setUserSuccess('');
  };

  const createUser = async (event) => {
    event.preventDefault();

    const email = userForm.email.trim();
    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const role = String(userForm.role || 'USER').toUpperCase();
    const cleaningClientType = String(userForm.cleaningClientType || 'FLEX').toUpperCase();
    const roles = getRolesForNewUser(role, cleaningClientType);
    const roleLabel = getRoleLabel(role);
    const visitsPerMonth = Number(userForm.visitsPerMonth);
    const password = 'ChangeMe!';

    if (!email || !firstName || !lastName) {
      setUserError('Add email, first name, and last name.');
      return;
    }

    if (role === 'CLEANING_CLIENT' && !['SUBSCRIBER', 'FLEX'].includes(cleaningClientType)) {
      setUserError('Choose subscriber or flex for the cleaning customer.');
      return;
    }

    if (role === 'CLEANING_CLIENT' && cleaningClientType === 'SUBSCRIBER' && (!Number.isInteger(visitsPerMonth) || visitsPerMonth < 1)) {
      setUserError('Add a valid visits per month value for the subscriber.');
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

      if (role === 'CLEANING_CLIENT' && cleaningClientType === 'SUBSCRIBER') {
        await subscriptionDealApi.create({
          userId: createdUserId,
          visitsPerMonth,
        });
      }

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

      {adminTab === 'customers' && (
        <CustomersPanel
          customers={economicCustomers}
          filteredCustomers={filteredEconomicCustomers}
          selectedCustomer={selectedEconomicCustomer}
          loading={economicCustomersLoading}
          error={economicCustomersError}
          search={economicCustomerSearch}
          group={economicCustomerGroup}
          groups={economicCustomerGroups}
          country={economicCustomerCountry}
          countries={economicCustomerCountries}
          status={economicCustomerStatus}
          balance={economicCustomerBalance}
          sort={economicCustomerSort}
          onRefresh={loadEconomicCustomers}
          onSearchChange={setEconomicCustomerSearch}
          onGroupChange={setEconomicCustomerGroup}
          onCountryChange={setEconomicCustomerCountry}
          onStatusChange={setEconomicCustomerStatus}
          onBalanceChange={setEconomicCustomerBalance}
          onSortChange={setEconomicCustomerSort}
          onClearFilters={clearEconomicCustomerFilters}
          onSelectCustomer={setSelectedEconomicCustomerNumber}
        />
      )}

      {adminTab === 'email' && (
        <EmailPanel
          users={customers}
          economicCustomers={economicCustomers}
          senderEmail={user?.email}
        />
      )}

      {adminTab === 'products' && (
        <ProductsPanel
          products={products}
          filteredProducts={filteredProducts}
          productsLoading={productsLoading}
          productsError={productsError}
          productSearch={productSearch}
          productYear={productYear}
          productYears={productYears}
          productMinPrice={productMinPrice}
          productMaxPrice={productMaxPrice}
          productSort={productSort}
          productTypeOptions={productTypeOptions}
          onProductsChanged={onProductsChanged}
          onSearchChange={setProductSearch}
          onYearChange={setProductYear}
          onMinPriceChange={setProductMinPrice}
          onMaxPriceChange={setProductMaxPrice}
          onSortChange={setProductSort}
          onClearFilters={clearProductFilters}
        />
      )}

      <AdminSession user={user} onLogout={onLogout} />
    </main>
  );
}

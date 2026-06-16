import { useCallback, useEffect, useRef, useState } from 'react';
import { quoteRequestApi } from '../../api/requests.js';
import { userApi } from '../../api/users.js';
import {
  getRequestUpdatePayload,
  hasPassedEndTime,
  isStatusSix,
  loadProductsForRequest,
} from './adminUtils.js';

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initializeUsers() {
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

    initializeUsers();

    return () => {
      ignore = true;
    };
  }, []);

  return {
    users,
    setUsers,
    usersLoading,
    usersError,
    loadUsers,
  };
}

export function useAdminRequests() {
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [historyUpdateError, setHistoryUpdateError] = useState('');
  const historyUpdatesStarted = useRef(new Set());

  const loadRequests = useCallback(async ({ resetDerivedErrors = true } = {}) => {
    setRequestsLoading(true);
    setRequestsError('');

    if (resetDerivedErrors) {
      setStatusUpdateError('');
      setHistoryUpdateError('');
    }

    try {
      const data = await quoteRequestApi.getAll();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setRequestsError(err.message || 'Could not load requests.');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initializeRequests() {
      if (!ignore) {
        setRequestsLoading(true);
        setRequestsError('');
      }

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

    initializeRequests();

    return () => {
      ignore = true;
    };
  }, [loadRequests]);

  useEffect(() => {
    if (requestsLoading || requestsError) return;

    const expiredRequests = requests.filter((request) => (
      request?.id
      && hasPassedEndTime(request)
      && !isStatusSix(request)
      && !historyUpdatesStarted.current.has(request.id)
    ));

    if (!expiredRequests.length) return;

    expiredRequests.forEach((request) => {
      historyUpdatesStarted.current.add(request.id);
    });

    Promise.all(expiredRequests.map(async (request) => {
      const payload = getRequestUpdatePayload(request, 6);
      const updatedRequest = await quoteRequestApi.update(request.id, payload);

      return updatedRequest && typeof updatedRequest === 'object'
        ? updatedRequest
        : { ...request, status: 6, statusDTO: { ...request.statusDTO, id: 6, name: 'History' } };
    }))
      .then((updatedRequests) => {
        setRequests((current) => current.map((request) => (
          updatedRequests.find((updatedRequest) => updatedRequest.id === request.id) || request
        )));
      })
      .catch((err) => {
        setHistoryUpdateError(err.message || 'Could not move passed requests to history.');
      });
  }, [requests, requestsError, requestsLoading]);

  return {
    requests,
    setRequests,
    requestsLoading,
    requestsError,
    statusUpdateError,
    setStatusUpdateError,
    historyUpdateError,
    loadRequests,
  };
}

export function useLazyRequestProducts(activeRequest) {
  const [requestProducts, setRequestProducts] = useState({});
  const productLoadsStarted = useRef(new Set());
  const activeRequestId = activeRequest?.id;
  const activeRequestState = activeRequestId ? requestProducts[activeRequestId] : null;

  useEffect(() => {
    if (!activeRequestId) return;
    if (activeRequestState?.items || activeRequestState?.loading) return;
    if (productLoadsStarted.current.has(activeRequestId)) return;

    productLoadsStarted.current.add(activeRequestId);

    Promise.resolve()
      .then(() => {
        setRequestProducts((current) => ({
          ...current,
          [activeRequestId]: { items: [], loading: true, error: '' },
        }));
      })
      .then(() => loadProductsForRequest(activeRequest))
      .then((data) => {
        setRequestProducts((current) => ({
          ...current,
          [activeRequestId]: { items: data, loading: false, error: '' },
        }));
      })
      .catch((err) => {
        setRequestProducts((current) => ({
          ...current,
          [activeRequestId]: { items: [], loading: false, error: err.message || 'Could not load products.' },
        }));
      });
  }, [activeRequest, activeRequestId, activeRequestState]);

  return {
    requestProducts,
    setRequestProducts,
  };
}

export function useLazyCustomerRequests(adminTab, selectedCustomer) {
  const [customerRequestStates, setCustomerRequestStates] = useState({});
  const customerRequestLoadsStarted = useRef(new Set());
  const selectedCustomerKey = selectedCustomer?.key;
  const selectedCustomerId = selectedCustomer?.id;
  const selectedCustomerState = selectedCustomerKey ? customerRequestStates[selectedCustomerKey] : null;

  useEffect(() => {
    if (adminTab !== 'users') return;
    if (!selectedCustomerKey || !selectedCustomerId) return;
    if (selectedCustomerState?.items || selectedCustomerState?.loading) return;
    if (customerRequestLoadsStarted.current.has(selectedCustomerKey)) return;

    customerRequestLoadsStarted.current.add(selectedCustomerKey);

    Promise.resolve()
      .then(() => {
        setCustomerRequestStates((current) => ({
          ...current,
          [selectedCustomerKey]: { items: [], loading: true, error: '' },
        }));
      })
      .then(() => quoteRequestApi.getByUserId(selectedCustomerId))
      .then((data) => {
        const items = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
          : [];

        setCustomerRequestStates((current) => ({
          ...current,
          [selectedCustomerKey]: { items, loading: false, error: '' },
        }));
      })
      .catch((err) => {
        setCustomerRequestStates((current) => ({
          ...current,
          [selectedCustomerKey]: { items: [], loading: false, error: err.message || 'Could not load user requests.' },
        }));
      });
  }, [adminTab, selectedCustomerId, selectedCustomerKey, selectedCustomerState]);

  const resetCustomerRequestStates = useCallback(() => {
    customerRequestLoadsStarted.current.clear();
    setCustomerRequestStates({});
  }, []);

  return {
    customerRequestStates,
    resetCustomerRequestStates,
  };
}

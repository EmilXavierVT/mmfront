const REMOTE_API_BASE_URL = import.meta.env.REMOTE_API_BASE_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? '/api' : REMOTE_API_BASE_URL);

const TOKEN_STORAGE_KEY = 'mm_api_token';
const USER_STORAGE_KEY = 'mm_api_user';
const LOGIN_PATHS = ['/auth/login/', '/auth/login'];

class ApiError extends Error {
  constructor(message, response, data) {
    super(message);
    this.name = 'ApiError';
    this.status = response?.status;
    this.data = data;
  }
}

function decodeJwtPayload(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function extractAuthToken(data) {
  if (!data) return null;

  if (typeof data === 'string') {
    return data.replace(/^Bearer\s+/i, '').trim() || null;
  }

  const token = data.token
    || data.accessToken
    || data.access_token
    || data.jwt
    || data.jwtToken
    || data.bearerToken
    || data.authToken
    || data.data?.token
    || data.data?.accessToken
    || data.data?.access_token
    || data.data?.jwt
    || data.user?.token
    || data.user?.accessToken
    || data.userDTO?.token
    || data.userDTO?.accessToken
    || null;

  return typeof token === 'string' ? token.replace(/^Bearer\s+/i, '').trim() || null : null;
}

function pickId(data, claims) {
  return data?.id
    ?? data?.userId
    ?? data?.user?.id
    ?? data?.user?.userId
    ?? claims?.id
    ?? claims?.userId
    ?? claims?.user_id
    ?? (Number.isFinite(Number(claims?.sub)) ? Number(claims.sub) : null);
}

function pickTenantId(data, claims) {
  return data?.tenantId
    ?? data?.tenantDTO?.id
    ?? data?.tenant?.id
    ?? data?.user?.tenantId
    ?? data?.user?.tenantDTO?.id
    ?? data?.user?.tenant?.id
    ?? claims?.tenantId
    ?? claims?.tenant_id
    ?? claims?.tenant?.id
    ?? null;
}

function normalizeRoles(value) {
  if (Array.isArray(value)) {
    return value.flatMap(role => normalizeRoles(role)).filter(Boolean);
  }

  if (typeof value === 'object') {
    return normalizeRoles(
      value?.name
      ?? value?.role
      ?? value?.authority
      ?? value?.roles,
    );
  }

  if (!value) return [];

  return String(value)
    .split(',')
    .map(item => item.trim().replace(/^ROLE_/i, '').toUpperCase())
    .filter(Boolean);
}

function dedupeRoles(roles) {
  return Array.from(new Set(roles.filter(Boolean)));
}

function getPrimaryRole(roles) {
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('EMPLOYEE')) return 'EMPLOYEE';
  if (roles.includes('CLEANING_STAFF')) return 'CLEANING_STAFF';
  if (roles.includes('CLEANING_CLIENT')) return 'CLEANING_CLIENT';
  return roles[0] || '';
}

function pickRoles(data, claims) {
  return dedupeRoles(normalizeRoles([
    data?.role,
    data?.user?.role,
    data?.roles,
    data?.user?.roles,
    claims?.role,
    claims?.roles,
    claims?.authorities,
    claims?.authority,
  ]));
}

function pickRole(data, claims) {
  return getPrimaryRole(pickRoles(data, claims));
}

function normalizeCredentials(credentials, key = 'email') {
  return {
    [key]: String(credentials?.email || credentials?.username || '').trim(),
    password: credentials?.password || '',
  };
}

function buildLoginPayloads(credentials) {
  const loginValue = String(credentials?.email || credentials?.username || '').trim();
  const preferredKeys = loginValue.includes('@')
    ? ['email', 'username', 'userName', 'name']
    : ['username', 'userName', 'name', 'email'];

  return preferredKeys.map(key => normalizeCredentials(credentials, key));
}

function buildUserSession(data, credentials) {
  const claims = decodeJwtPayload(extractAuthToken(data));
  const email = credentials.email
    || credentials.username
    || data?.email
    || data?.username
    || data?.user?.email
    || data?.user?.username
    || claims?.email
    || (String(claims?.sub || '').includes('@') ? claims.sub : '');

  return {
    email,
    id: pickId(data, claims),
    tenantId: pickTenantId(data, claims),
    roles: pickRoles(data, claims),
    role: pickRole(data, claims),
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = data?.title || data?.msg || data?.message || data || 'Request failed';
    throw new ApiError(message, response, data);
  }

  return data;
}

async function fetchJson(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return parseJsonResponse(response);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Could not reach the API. Check your connection and try again.', { cause: err });
    }

    throw err;
  }
}

function storeAuthSession(data, credentials) {
  const token = extractAuthToken(data);

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  const user = buildUserSession(data, credentials);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  return user;
}

export function setStoredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const storedUser = JSON.parse(raw);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const claims = decodeJwtPayload(token);
    const id = storedUser?.id || storedUser?.userId || pickId(null, claims);
    const tenantId = storedUser?.tenantId
      || storedUser?.tenantDTO?.id
      || storedUser?.tenant?.id
      || pickTenantId(storedUser, claims);
    const roles = pickRoles(storedUser, claims);
    const fallbackRoles = Array.isArray(storedUser?.roles)
      ? dedupeRoles(normalizeRoles(storedUser.roles))
      : storedUser?.role
        ? dedupeRoles(normalizeRoles(storedUser.role))
        : [];
    const nextRoles = roles.length ? roles : fallbackRoles;
    const role = getPrimaryRole(nextRoles) || storedUser?.role;

    if (!id && !tenantId && !role) return storedUser;

    const nextUser = { ...storedUser, id, tenantId, roles: nextRoles, role };
    delete nextUser.userId;
    setStoredUser(nextUser);
    return nextUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

async function requestLogin(credentials, persistUser = true, includeSession = false) {
  const loginPayloads = buildLoginPayloads(credentials);
  let nextCredentials = loginPayloads[0];
  let data;
  let lastError;

  for (let index = 0; index < loginPayloads.length; index += 1) {
    const payload = loginPayloads[index];

    for (let pathIndex = 0; pathIndex < LOGIN_PATHS.length; pathIndex += 1) {
      const path = LOGIN_PATHS[pathIndex];

      try {
        data = await fetchJson(path, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        nextCredentials = payload;
        break;
      } catch (err) {
        lastError = err;
        const message = String(err.message || '').toLowerCase();
        const shouldTryAlternatePath = pathIndex < LOGIN_PATHS.length - 1
          && (err.status === 404 || err.status === 405);
        const shouldTryAlternateIdentifier = index < loginPayloads.length - 1
          && (message.includes('user not found') || message.includes('not found') || err.status === 400);

        if (shouldTryAlternatePath) {
          continue;
        }

        if (!shouldTryAlternateIdentifier) {
          throw err;
        }

        break;
      }
    }

    if (data) break;
  }

  const token = extractAuthToken(data);

  if (!token) {
    if (lastError) {
      throw lastError;
    }

    throw new Error('Login response did not include a token.');
  }

  if (persistUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return storeAuthSession(data, nextCredentials);
  }

  if (includeSession) {
    return {
      token,
      user: buildUserSession(data, nextCredentials),
    };
  }

  return token;
}

export async function getAuthToken(credentials) {
  return requestLogin(credentials, false);
}

export async function getAuthSession(credentials) {
  return requestLogin(credentials, false, true);
}

export async function login(credentials) {
  return requestLogin(credentials);
}

export async function registerAccount(credentials) {
  const nextCredentials = normalizeCredentials(credentials);
  return fetchJson('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(nextCredentials),
  });
}

export async function register(credentials) {
  const nextCredentials = normalizeCredentials(credentials);
  const data = await registerAccount(nextCredentials);

  if (extractAuthToken(data)) {
    return storeAuthSession(data, nextCredentials);
  }

  return login(nextCredentials);
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  }, false);
}

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function apiRequest(path, options = {}, retryWithFreshToken = true) {
  const { authToken, headers, ...fetchOptions } = options;
  const token = authToken || getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401 && retryWithFreshToken && token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    throw new Error('Your session expired. Please log in again.');
  }

  return parseJsonResponse(response);
}

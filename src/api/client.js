const API_BASE_URL = 'https://morgendagens.project-ice.dk/api';

const TOKEN_STORAGE_KEY = 'mm_api_token';
const USER_STORAGE_KEY = 'mm_api_user';

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

function normalizeRole(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeRole).find(Boolean) || '';
  }

  if (typeof value === 'object') {
    return normalizeRole(value?.name ?? value?.role ?? value?.authority);
  }

  if (!value) return '';

  const role = String(value).replace(/^ROLE_/i, '').toUpperCase();
  return role;
}

function pickRole(data, claims) {
  return normalizeRole(
    data?.role
      ?? data?.user?.role
      ?? data?.roles
      ?? data?.user?.roles
      ?? claims?.role
      ?? claims?.roles
      ?? claims?.authorities
      ?? claims?.authority,
  );
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
  const claims = decodeJwtPayload(data?.token);
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

function storeAuthSession(data, credentials) {
  if (data?.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  }

  const user = buildUserSession(data, credentials);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  return user;
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const storedUser = JSON.parse(raw);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const claims = decodeJwtPayload(token);
    const id = storedUser?.id || storedUser?.userId || pickId(null, claims);
    const role = storedUser?.role || pickRole(null, claims);

    if (!id && !role) return storedUser;

    const nextUser = { ...storedUser, id, role };
    delete nextUser.userId;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
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

async function requestLogin(credentials, persistUser = true) {
  const loginPayloads = buildLoginPayloads(credentials);
  let nextCredentials = loginPayloads[0];
  let data;
  let lastError;

  for (let index = 0; index < loginPayloads.length; index += 1) {
    const payload = loginPayloads[index];

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await parseJsonResponse(response);
      nextCredentials = payload;
      break;
    } catch (err) {
      lastError = err;
      const message = String(err.message || '').toLowerCase();
      const shouldTryAlternateIdentifier = index < loginPayloads.length - 1
        && (message.includes('user not found') || message.includes('not found') || err.status === 400);

      if (!shouldTryAlternateIdentifier) {
        throw err;
      }
    }
  }

  if (!data?.token) {
    if (lastError) {
      throw lastError;
    }

    throw new Error('Login response did not include a token.');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  if (persistUser) {
    return storeAuthSession(data, nextCredentials);
  }

  return data.token;
}

export async function login(credentials) {
  return requestLogin(credentials);
}

export async function register(credentials) {
  const nextCredentials = normalizeCredentials(credentials);
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextCredentials),
  });
  const data = await parseJsonResponse(response);

  if (data?.token) {
    return storeAuthSession(data, nextCredentials);
  }

  return login(nextCredentials);
}

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function apiRequest(path, options = {}, retryWithFreshToken = true) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
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

const API_BASE_URL = 'https://morgendagens.project-ice.dk/api';
const AUTH_CREDENTIALS = {
  email: 'emilxavierthorsen@gmail.com',
  password: '1234',
};

const TOKEN_STORAGE_KEY = 'mm_api_token';
const USER_STORAGE_KEY = 'mm_api_user';

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

function buildUserSession(data, credentials) {
  const claims = decodeJwtPayload(data?.token);
  const email = credentials.email
    || data?.email
    || data?.user?.email
    || claims?.email
    || (String(claims?.sub || '').includes('@') ? claims.sub : '');

  return {
    email,
    id: pickId(data, claims),
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
    throw new Error(message);
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
    if (storedUser?.id) return storedUser;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const claims = decodeJwtPayload(token);
    const id = storedUser?.userId || pickId(null, claims);

    if (!id) return storedUser;

    const nextUser = { ...storedUser, id };
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
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await parseJsonResponse(response);

  if (!data?.token) {
    throw new Error('Login response did not include a token.');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  if (persistUser) {
    return storeAuthSession(data, credentials);
  }

  return data.token;
}

export async function login(credentials) {
  return requestLogin(credentials);
}

export async function register(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await parseJsonResponse(response);

  if (data?.token) {
    return storeAuthSession(data, credentials);
  }

  return login(credentials);
}

async function serviceLogin() {
  return requestLogin(AUTH_CREDENTIALS, false);
}

async function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || serviceLogin();
}

export async function apiRequest(path, options = {}, retryWithFreshToken = true) {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 && retryWithFreshToken) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    await serviceLogin();
    return apiRequest(path, options, false);
  }

  return parseJsonResponse(response);
}

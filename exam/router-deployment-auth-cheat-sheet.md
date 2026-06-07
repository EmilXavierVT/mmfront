## Router, Deployment, Auth and Security Cheat Sheet

Short notes based on this codebase.

## 1. React Router

Purpose:

1. Client-side navigation
2. URL to component mapping
3. No full page reloads

Used here:

1. `BrowserRouter`
2. `Routes`
3. `Route`
4. `Navigate`
5. `NavLink`
6. `useNavigate`
7. `useLocation`

## 2. Routing examples

From `App.jsx`:
```jsx
<Route path="/admin" element={<AdminPage ... />} />
<Route path="/profile" element={<ProfilePage ... />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

## 3. Flexbox

Best for 1D layout.

Example:
```css
display: flex;
align-items: center;
justify-content: space-between;
```

Used for:

1. Nav bars
2. Button rows
3. Icon/text alignment

## 4. Grid

Best for 2D layout.

Example:
```css
display: grid;
grid-template-columns: 1fr 1fr;
```

Used for:

1. Page sections
2. Card layouts
3. Forms and content columns

## 5. CI/CD deployment flow

1. Push to `main`
2. GitHub Actions builds Docker image
3. Image pushed to Docker Hub
4. Server pulls latest image
5. `docker-compose` runs container
6. Caddy serves/proxies traffic

## 6. Caddy purpose

1. Reverse proxy
2. Static file serving
3. HTTPS certificate handling
4. Domain routing

Conceptually it sits in front of the app container.

## 7. JWT flow

1. User logs in
2. Backend returns JWT
3. Frontend stores token in `localStorage`
4. Frontend sends `Authorization: Bearer <token>`
5. Backend validates token

## 8. JWT parts

JWT format:
```txt
header.payload.signature
```

Meaning:

1. Header: algorithm and type
2. Payload: claims and user info
3. Signature: integrity check

## 9. JWT in this app

Examples from `src/api/client.js`:

Store token:
```js
localStorage.setItem(TOKEN_STORAGE_KEY, token);
```

Decode payload:
```js
const [, payload] = token.split('.');
```

Send bearer token:
```js
Authorization: `Bearer ${token}`
```

## 10. Login process

1. `AuthModal` collects credentials
2. `login(credentials)` sends POST request
3. Token comes back
4. Token stored
5. App sets user state
6. App redirects to `profile` or `admin`

## 11. HTTPS

HTTPS = HTTP over TLS.

Purpose:

1. Encrypt traffic
2. Verify server identity
3. Protect data integrity

In deployment, Caddy typically handles certificates.

## 12. Sub-routing

Current app uses top-level routes only.

Conceptual nested route example:
```jsx
<Route path="/admin" element={<AdminLayout />}>
  <Route path="users" element={<UsersPanel />} />
</Route>
```

## 13. SOP and CORS

SOP:

1. Browser security rule
2. Blocks unsafe cross-origin requests

CORS:

1. Server opt-in for cross-origin access
2. Uses response headers

## 14. Avoiding CORS in this app

From `src/api/client.js`:
```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? '/api' : REMOTE_API_BASE_URL);
```

Meaning:

1. In dev, use `/api` to avoid direct cross-origin fetches
2. In prod, use HTTPS API URL and correct proxy/CORS setup

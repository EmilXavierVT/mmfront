## Router, Deployment, Auth and Web Security Notes

These answers are based on examples from this codebase.

## 1. What is React Router and which problems does it solve?

React Router is the library that handles client-side navigation in a React application.

In this project it is used in:

1. `src/main.jsx` with `BrowserRouter`
2. `src/App.jsx` with `Routes`, `Route`, `Navigate`
3. `src/components/Layout/Topbar.jsx` with `NavLink`

Problem it solves:

1. Lets the app behave like a multi-page site without full page reloads
2. Connects URLs to specific React components
3. Supports redirects and protected pages
4. Makes back/forward browser navigation work naturally

Example from `src/App.jsx:358`:
```jsx
<Routes>
  <Route path="/admin" element={<AdminPage ... />} />
  <Route path="/profile" element={<ProfilePage ... />} />
  <Route path="/about" element={<AboutPage onBook={scrollToBook} />} />
  <Route path="/catering" element={<CateringPage ... />} />
  <Route path="/cleaning" element={<CleaningPage ... />} />
  <Route path="/" element={<HomePage ... />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

## 2. Essential building blocks of React Router

### `BrowserRouter`

From `src/main.jsx:8`:
```jsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

Purpose:

1. Enables routing using the browser URL
2. Wraps the app so routing tools can be used inside it

### `Routes`

Groups all route definitions.

### `Route`

Maps a path to a React element.

Example:
```jsx
<Route path="/profile" element={<ProfilePage user={user} onBook={scrollToBook} onLogout={handleLogout} />} />
```

### `Navigate`

Used for redirects.

Example from `src/App.jsx:439`:
```jsx
<Route path="*" element={<Navigate to="/" replace />} />
```

Protected route example from `src/App.jsx:60`:
```jsx
if (!isAdmin) {
  return <Navigate to="/" replace />;
}
```

### `NavLink`

Used for navigation links and active styling.

Example from `src/components/Layout/Topbar.jsx`:
```jsx
<NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/catering">
```

### `useNavigate`

Used for programmatic navigation.

From `src/App.jsx`:
```jsx
const routerNavigate = useNavigate();
routerNavigate(path, { replace });
```

### `useLocation`

Used to read the current URL.

From `src/App.jsx`:
```jsx
const location = useLocation();
```

## 3. Purpose of flexbox and grid in CSS

Flexbox and grid are CSS layout systems.

### Flexbox

Best for one-dimensional layouts, like a row or a column.

Examples from `src/App.css`:
```css
.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

```css
.hero-meta-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
```

What flexbox helps with:

1. Navigation bars
2. Horizontal button groups
3. Alignment of icons and text
4. Spacing with `gap`

### Grid

Best for two-dimensional layouts with rows and columns.

Examples from `src/App.css`:
```css
.split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

```css
.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
```

```css
.book-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
}
```

What grid helps with:

1. Two-column sections
2. Product card layouts
3. Form and summary layouts
4. Responsive page structure

## 4. Conceptually: how we deploy a React frontend through CI/CD

Based on this repo, the deployment flow is:

1. Code is pushed to `main`
2. GitHub Actions starts the workflow in `.github/workflows/docker-publish.yml`
3. The frontend Docker image is built
4. The image is pushed to Docker Hub
5. The server pulls the latest image
6. `docker-compose.yml` starts or updates the container
7. Caddy serves or proxies traffic to the running app

Workflow trigger from `.github/workflows/docker-publish.yml`:
```yml
on:
  push:
    branches:
      - main
```

Build and push step:
```yml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
```

## 5. What is the purpose of Caddy?

There is no `Caddyfile` in this repo, so this part is conceptual based on the deployment setup.

Caddy is typically used to:

1. Receive public web traffic
2. Reverse proxy requests to the frontend container
3. Serve static files if needed
4. Automatically manage HTTPS certificates

In this setup, the app container exposes port `4173`:

From `Dockerfile`:
```dockerfile
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
```

From `docker-compose.yml`:
```yml
ports:
  - "${APP_PORT:-8080}:4173"
```

So conceptually Caddy sits in front of that app and routes domain traffic to it.

## 6. How we use Caddy in the deployment pipeline

Conceptually, the flow is:

1. DNS points the domain to the server
2. Caddy listens on ports `80` and `443`
3. Caddy gets a TLS certificate automatically
4. Caddy forwards requests to the frontend container
5. Users access the app through the domain, not through the raw container port

Caddy can be used for:

1. Reverse proxying to the React app container
2. Serving static frontend files directly
3. Handling HTTPS certificate creation and renewal

In this project, the frontend container is the target app service, and Caddy would typically route traffic to the host port that maps to `4173`.

## 7. Typical JWT authentication flow in a React app

This project has a clear JWT flow in `src/api/client.js` and `src/components/Auth/AuthModal.jsx`.

Typical flow:

1. User submits login form
2. Frontend sends credentials to backend
3. Backend returns a JWT
4. Frontend stores the token
5. Frontend sends the token in future API requests
6. Backend validates the token and returns protected data

Login form calls login here:
`src/components/Auth/AuthModal.jsx:85`
```jsx
user = await login(credentials);
```

Token storage in `src/api/client.js`:
```js
const token = extractAuthToken(data);

if (token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}
```

Protected request header:
```js
...(token ? { Authorization: `Bearer ${token}` } : {}),
```

## 8. Different parts of a JWT token

A JWT has 3 parts separated by dots:

1. Header
2. Payload
3. Signature

Format:
```txt
header.payload.signature
```

This codebase decodes the payload in `src/api/client.js:18`:
```js
function decodeJwtPayload(token) {
  const [, payload] = token.split('.');
  ...
  return JSON.parse(atob(padded));
}
```

Conceptually:

1. Header: algorithm and token type
2. Payload: user data and claims
3. Signature: protects integrity and helps verify authenticity

## 9. How do we use JWT in this React application?

This app uses JWT to:

1. Persist login state
2. Rebuild a user session on reload
3. Add auth headers to API calls
4. Read claims like id, email, tenantId, and role

Examples from `src/api/client.js`:

Store token:
```js
localStorage.setItem(TOKEN_STORAGE_KEY, token);
```

Restore user:
```js
const token = localStorage.getItem(TOKEN_STORAGE_KEY);
const claims = decodeJwtPayload(token);
```

Send bearer token:
```js
Authorization: `Bearer ${token}`
```

## 10. Describe and show the login process using JWT

The login process in this app works like this:

1. User enters credentials in `AuthModal`
2. The form calls `submit`
3. `submit` calls `login(credentials)`
4. `login()` sends a POST request to the backend
5. Backend responds with a token
6. Token is saved to `localStorage`
7. A user session object is created
8. The app updates state and redirects the user

From `src/components/Auth/AuthModal.jsx`:
```jsx
const submit = async (e) => {
  e.preventDefault();
  ...
  user = await login(credentials);
  onAuthenticated(user || { email: credentials.email });
  onClose();
};
```

From `src/api/client.js`:
```js
data = await fetchJson(path, {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

Then:
```js
const token = extractAuthToken(data);

if (!token) {
  throw new Error('Login response did not include a token.');
}

localStorage.setItem(TOKEN_STORAGE_KEY, token);
return storeAuthSession(data, nextCredentials);
```

App state update from `src/App.jsx:448`:
```jsx
onAuthenticated={(nextUser) => {
  setUser(nextUser);
  navigateTo(nextUser?.role === 'ADMIN' ? 'admin' : 'profile');
}}
```

## 11. What is HTTPS and how did we get it working?

HTTPS is HTTP secured by TLS.

It provides:

1. Encryption
2. Server authentication
3. Data integrity

In this project, HTTPS is not configured inside React itself. It is a deployment concern.

Conceptually, HTTPS works here because:

1. The website domain points to the server
2. Caddy handles TLS and certificates
3. Caddy serves or proxies the app over `https://`

This app expects secure URLs, for example:

From `src/api/client.js`:
```js
const REMOTE_API_BASE_URL = 'https://morgendagens.project-ice.dk/api';
```

From `src/components/Layout/SEO.jsx`:
```js
const SITE_URL = 'https://morgendagensmaaltid.dk';
```

## 12. Example of sub-routing

I do not see actual nested React Router sub-routes in the current codebase.

The app currently uses top-level routes like:

1. `/`
2. `/catering`
3. `/cleaning`
4. `/profile`
5. `/admin`

Example from current code:
```jsx
<Route path="/admin" element={<AdminPage ... />} />
<Route path="/profile" element={<ProfilePage ... />} />
```

Conceptual sub-routing example:
```jsx
<Route path="/admin" element={<AdminLayout />}>
  <Route path="users" element={<UsersPanel />} />
  <Route path="products" element={<ProductsPanel />} />
</Route>
```

That would produce URLs like:

1. `/admin/users`
2. `/admin/products`

The closest current concept is that `Admin.jsx` switches panels internally using tabs, but not with URL-based nested routes.

## 13. What are SOP and CORS?

### Same Origin Policy (SOP)

SOP is a browser security rule.

It means a webpage cannot freely access resources from a different origin.

An origin is defined by:

1. Protocol
2. Domain
3. Port

### CORS

CORS stands for Cross-Origin Resource Sharing.

It is the mechanism that allows servers to explicitly permit cross-origin requests.

The browser checks whether the server returned the correct CORS headers.

## 14. How do we avoid CORS errors when fetching data from the API?

This repo avoids CORS problems in development by using a same-origin API path.

From `src/api/client.js:1`:
```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? '/api' : REMOTE_API_BASE_URL);
```

Important part:
```js
'/api'
```

This means that in development the frontend can call `/api/...` on the same origin, usually through a proxy, instead of calling another domain directly.

In production, the app uses:
```js
const REMOTE_API_BASE_URL = 'https://morgendagens.project-ice.dk/api';
```

So to avoid CORS errors in production, the deployment must either:

1. Proxy API traffic through the same public origin, or
2. Configure correct CORS headers on the backend

Short summary:

1. SOP blocks unsafe cross-origin access by default
2. CORS is the controlled exception
3. This app avoids dev CORS issues by using `/api`
4. Production CORS depends on correct backend or reverse proxy setup

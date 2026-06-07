## Final Cram Sheet

Ultra-short recap for the last few minutes before the exam.

## JavaScript

1. Higher-order functions work with other functions: `map`, `filter`, `reduce`
2. Callbacks are functions passed into other functions
3. `fetch` is used for API requests
4. `async/await` makes async code easier to read
5. `localStorage` persists longer than `sessionStorage`
6. DOM manipulation means changing elements or attributes with JavaScript
7. Event bubbling means events move from child to parent
8. Scope decides where variables are visible
9. Spread expands values, rest collects remaining values

## React

1. Components are reusable UI blocks
2. JSX is HTML-like syntax in JavaScript
3. Props pass data from parent to child
4. `children` lets wrapper components render nested content
5. State stores changing values and triggers re-render
6. `useEffect` handles side effects like fetches and listeners
7. Controlled inputs use React state as source of truth
8. Lists are rendered with `map` and stable `key`s
9. Errors are usually handled with `try/catch` plus error state

## Router

1. React Router handles navigation in a SPA
2. `BrowserRouter` wraps the app
3. `Routes` contains route definitions
4. `Route` maps a path to a component
5. `Navigate` redirects
6. `NavLink` supports active styling
7. `useNavigate` changes route in code

## Layout

1. Flexbox is best for one-dimensional layout
2. Grid is best for two-dimensional layout
3. Flexbox is great for nav rows and alignment
4. Grid is great for cards, columns, and page sections

## Deployment

1. Push to `main`
2. GitHub Actions builds Docker image
3. Image is pushed to Docker Hub
4. Server pulls image and runs it
5. Caddy exposes the app on the domain

## Caddy and HTTPS

1. Caddy can reverse proxy traffic to the app container
2. Caddy can serve static files
3. Caddy can get and renew HTTPS certificates automatically
4. HTTPS = encrypted and authenticated HTTP traffic

## JWT and auth

1. User logs in
2. Backend returns JWT
3. Frontend stores token
4. Frontend sends `Authorization: Bearer <token>`
5. Backend validates token
6. JWT parts: header, payload, signature

## CORS and SOP

1. SOP blocks unsafe cross-origin access by default
2. CORS is the server-controlled exception
3. Same origin = same protocol, domain, and port
4. Dev can avoid CORS issues by using `/api` through a proxy

## Best short exam phrases

1. "In this project, a clear example is..."
2. "The main purpose is..."
3. "The benefit is that..."
4. "Conceptually, the flow is..."
5. "In our codebase, this is implemented in..."

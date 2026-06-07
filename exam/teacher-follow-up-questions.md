## Likely Teacher Follow-up Questions

Short follow-up questions with short answers.

## JavaScript

### 1. Why use `map` instead of a `for` loop?

Because `map` is more declarative. It clearly shows that I am transforming one array into another.

### 2. Why is `Promise.all` useful?

It lets multiple async operations run in parallel and waits until all are finished.

### 3. Why use `localStorage` for tokens?

Because it survives page refresh and browser restart. In this app it is used to keep the login session.

### 4. What is the risk of storing tokens in `localStorage`?

If the site has an XSS vulnerability, malicious JavaScript could potentially read the token.

### 5. What is the difference between `null` and `undefined`?

`undefined` usually means a value has not been assigned. `null` is an intentional empty value.

## React

### 6. Why split UI into components?

To make the app easier to reuse, maintain, test, and reason about.

### 7. Why use state instead of normal variables?

Because changing state causes React to re-render the component. Normal variables do not do that.

### 8. When does `useEffect` run?

It runs after render. It can run on every render, once, or only when dependencies change.

### 9. Why do lists need a `key`?

React uses keys to match items between renders so updates are correct and efficient.

### 10. What is a controlled input?

An input whose value is controlled by React state.

### 11. What is the difference between props and state?

Props come from the parent. State belongs to the component itself.

### 12. Why use `useMemo` or `useCallback`?

To avoid recalculating values or recreating functions unnecessarily when dependencies have not changed.

## Routing and deployment

### 13. Why do we need React Router in a SPA?

Because the app changes views on the client side without doing a full page refresh.

### 14. What is the difference between `Link` and `NavLink`?

`NavLink` can apply styling based on whether the route is currently active.

### 15. What happens when you push to `main`?

The GitHub Actions workflow builds the Docker image and pushes it to Docker Hub.

### 16. Why use Docker for deployment?

Because it packages the app and its runtime consistently, so it runs the same way across environments.

### 17. What does Caddy do for us?

It can reverse proxy traffic, serve the site, and manage HTTPS certificates automatically.

### 18. Why do we need HTTPS?

To encrypt traffic and verify that the browser is talking to the correct server.

## JWT and auth

### 19. Why send `Authorization: Bearer <token>`?

That is the standard way to send JWTs to protected API endpoints.

### 20. What information can be inside a JWT payload?

Claims like user id, email, role, tenant id, expiration time, or subject.

### 21. Can we trust JWT data completely on the frontend?

No. The backend must still validate the token and enforce authorization.

### 22. What happens if the token expires?

The backend returns an auth error like `401`, and the frontend should log the user out or ask them to log in again.

## CORS and browser security

### 23. Why does CORS exist?

To let browsers safely control when cross-origin requests are allowed.

### 24. How can a reverse proxy help with CORS?

It can make frontend and API appear to come from the same origin or attach the correct headers.

### 25. What is an origin?

An origin is the combination of protocol, domain, and port.

## Short self-test prompts

1. Explain `useEffect` in 20 seconds.
2. Explain the JWT login flow in 30 seconds.
3. Explain the difference between flexbox and grid.
4. Explain why React Router is needed.
5. Explain how CI/CD works in this project.

## JavaScript Exam Notes

These answers are based on examples from this codebase.

## 1. Higher-order functions in JavaScript

Higher-order functions are functions that either:

1. Take another function as an argument
2. Return a function

Examples from the code:

`src/components/Services/Menu.jsx:8`
```js
products.reduce((acc, product) => {
  const label = PRODUCT_TYPE_LABELS[product.type] || `Type ${product.type ?? 'other'}`;
  acc[label] = [...(acc[label] || []), product];
  return acc;
}, {});
```

`src/components/Admin/useAdminData.js:116`
```js
Promise.all(expiredRequests.map(async (request) => {
  const payload = getRequestUpdatePayload(request, 6);
  const updatedRequest = await quoteRequestApi.update(request.id, payload);
  return updatedRequest;
}));
```

Benefits:

1. Less repetition
2. More expressive code
3. Easier array transformation
4. Works very well with async code

### Oral script

"A higher-order function is a function that works with other functions. In my code I use `reduce`, `map`, and `Promise.all`. For example in `Menu.jsx` I use `reduce` to group products by type. The benefit is that the code becomes shorter, clearer, and easier to reuse."

## 2. Examples of higher-order functions with callbacks

Examples from the code:

`src/components/Admin/Admin.jsx:239`
```js
setRequests(current => current.map(request => (
  request.id === selectedRequest.id ? nextRequest : request
)));
```

`src/App.jsx:299`
```js
toastTimeoutRef.current = window.setTimeout(() => {
  setToast(null);
  toastTimeoutRef.current = null;
}, 1800);
```

`src/tweaks-panel.jsx:186`
```js
window.addEventListener('message', onMsg);
```

Why this is useful:

1. You can pass behavior into another function
2. Browser APIs can run your callback later
3. React state updates can safely use previous state

### Oral script

"A callback is a function passed into another function. In my code I use callbacks with `map`, `setTimeout`, and `addEventListener`. This is useful because it lets me decide what should happen when data changes, when time passes, or when the user triggers an event."

## 3. Purpose of `package.json`

`package.json` describes the project and its dependencies.

From `package.json`:
```json
{
  "name": "mmfront",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

You can use it to:

1. Store project metadata
2. Define scripts like `npm run dev`
3. Track dependencies and devDependencies
4. Configure how the project runs

### Oral script

"The `package.json` file is the project configuration file. It tells us the project name, dependencies, and available scripts. In this project I can run `npm run dev`, `npm run build`, and `npm run lint` because those scripts are defined in `package.json`."

## 4. How to use `fetch` in JavaScript

Best example: `src/api/client.js:173`

```js
async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return parseJsonResponse(response);
}
```

POST example:
```js
return fetchJson('/auth/register/', {
  method: 'POST',
  body: JSON.stringify(nextCredentials),
});
```

How it works:

1. `fetch()` sends the request
2. `await` waits for the response
3. Headers and body can be added
4. The response is parsed after that

### Oral script

"`fetch` is used to communicate with an API. In my project I wrapped it in a helper called `fetchJson`, so I can reuse the same logic for headers and error handling. For example I use it to send login and register requests to the backend."

## 5. Synchronous vs asynchronous programming, and async/await

Synchronous code runs line by line and finishes each step before the next one starts.

Example from `src/App.jsx:274`:
```js
document.documentElement.style.setProperty('--pink', tweaks.accentPink);
```

Asynchronous code can wait for something external, like an API response.

Example from `src/App.jsx:247`:
```js
async function initializeProducts() {
  const data = await productApi.getAll();
  setProducts(normalizeProductsResponse(data));
}
```

Another async example from `src/components/Booking/Booking.jsx:353`:
```js
await Promise.all(selectedDishes.map(d => productInRequestApi.create({
  requestId: createdRequest.id,
  productId: d.id,
  time: toTimePayload(startTime),
  amount: guests,
}, requestAuthToken)));
```

How `async` and `await` fit in:

1. `async` marks a function as asynchronous
2. `await` pauses until a promise is done
3. It makes async code easier to read

### Oral script

"Synchronous code runs immediately, step by step. Asynchronous code is used when something takes time, like loading data from an API. In my app I use `async` and `await` when loading products and creating requests, because I need to wait for the server before continuing."

## 6. Difference between `localStorage` and `sessionStorage`

This project uses `localStorage`.

Example from `src/api/client.js:197`
```js
localStorage.setItem(TOKEN_STORAGE_KEY, token);
```

Difference:

1. `localStorage` stays after the browser is closed
2. `sessionStorage` is cleared when the tab or session ends
3. Both store values as strings

Why `localStorage` is used here:

1. The app stores login token and user session
2. That lets the user stay logged in after refresh

### Oral script

"The main difference is persistence. `localStorage` keeps data even after the browser closes, while `sessionStorage` only lasts for the current tab session. In this project we use `localStorage` to save the user token and user information."

## 7. Storage options in browser developer tools

In this project, the most relevant storage is `localStorage`.

Keys defined in `src/api/client.js:5-6`:
```js
const TOKEN_STORAGE_KEY = 'mm_api_token';
const USER_STORAGE_KEY = 'mm_api_user';
```

How to show it in DevTools:

1. Open the website
2. Open browser DevTools
3. Go to the `Application` tab
4. Open `Local Storage`
5. Select the site
6. Show keys like `mm_api_token` and `mm_api_user`

Other storage types you can mention:

1. Local Storage
2. Session Storage
3. Cookies
4. IndexedDB

### Oral script

"In developer tools I can inspect browser storage in the Application tab. In this project I would show Local Storage, where the app stores the API token and user data. I can also mention that browsers support Session Storage, Cookies, and IndexedDB."

## 8. Example of DOM manipulation

Best example: `src/components/Layout/SEO.jsx:255`

```js
function setMeta(selector, attributes) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}
```

What this does:

1. Finds a meta tag in the DOM
2. Creates it if it does not exist
3. Appends it to the document head
4. Updates its attributes

### Oral script

"DOM manipulation means changing the page structure or attributes with JavaScript. In my project I do that in the SEO component, where I create or update meta tags in `document.head`. That is a clear example of direct DOM manipulation."

## 9. Event bubbling

Event bubbling means an event starts on the child element and then moves up to parent elements.

Example from `src/tweaks-panel.jsx:224`:
```js
<div className="twk-hd" onMouseDown={onDragStart}>
  <button
    className="twk-x"
    onMouseDown={(e) => e.stopPropagation()}
    onClick={dismiss}
  >
    ✕
  </button>
</div>
```

Explanation:

1. The parent has an `onMouseDown` handler
2. The button is inside the parent
3. Without `stopPropagation()`, the click would bubble up
4. That could trigger dragging when the user only wants to close

### Oral script

"Event bubbling means an event happens on the target element first and then bubbles up through parent elements. In my project I prevent bubbling with `stopPropagation()` on a close button, so clicking the button does not also trigger the parent drag handler."

## 10. Scope of a variable: global and local scope

Scope means where a variable can be accessed.

Top-level example from `src/api/client.js:1`:
```js
const REMOTE_API_BASE_URL = 'https://morgendagens.project-ice.dk/api';
const TOKEN_STORAGE_KEY = 'mm_api_token';
```

These are available throughout that module.

Local scope example from `src/api/client.js:173`:
```js
async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
  });
}
```

`response` only exists inside `fetchJson`.

Another local example from `src/components/Layout/Footer.jsx:4`:
```js
const navigate = (event, page) => {
  event.preventDefault();
  onNav(page);
};
```

### Oral script

"Scope means where a variable is visible in the code. A local variable only exists inside its function or block. A global variable exists everywhere, but in modern frontend projects we often use module scope instead of true globals. In my code, constants like `TOKEN_STORAGE_KEY` are available across one file, while variables like `response` only exist inside one function."

## 11. Spread operator vs rest operator

Spread example from `src/App.jsx:306`:
```js
setCart((c) => ({ ...c, [d.id]: (c[d.id] || 0) + 1 }));
```

Spread example from `src/components/Services/Menu.jsx:10`:
```js
acc[label] = [...(acc[label] || []), product];
```

Rest example from `src/api/client.js:341`:
```js
const { authToken, headers, ...fetchOptions } = options;
```

Difference:

1. Spread expands values out
2. Rest collects remaining values into one variable

### Oral script

"Spread and rest use the same `...` syntax but do different jobs. Spread is used to copy or expand values, for example when I update React state with `{ ...c }`. Rest is used to collect the remaining values, like in `const { authToken, headers, ...fetchOptions } = options`."

## Short closing summary

This codebase gives practical examples of:

1. Higher-order functions with `map`, `reduce`, and callbacks
2. API work with `fetch`, `async`, and `await`
3. Browser storage with `localStorage`
4. DOM manipulation with `document.createElement` and `setAttribute`
5. Event bubbling and `stopPropagation()`
6. Scope, spread, and rest in real application code

## JavaScript Cheat Sheet

Short exam notes based on this codebase.

## 1. Higher-order functions

Definition:
A higher-order function takes a function as an argument or returns a function.

Examples in the code:

`src/components/Services/Menu.jsx`
```js
products.reduce((acc, product) => {
  acc[label] = [...(acc[label] || []), product];
  return acc;
}, {});
```

`src/components/Admin/useAdminData.js`
```js
expiredRequests.map(async (request) => { ... })
```

Why useful:

1. Less repetitive code
2. Easier data transformation
3. Cleaner logic

## 2. Callback functions

Definition:
A callback is a function passed into another function.

Examples:

`src/App.jsx`
```js
window.setTimeout(() => {
  setToast(null);
}, 1800);
```

`src/tweaks-panel.jsx`
```js
window.addEventListener('message', onMsg);
```

Why useful:

1. Lets code run later
2. Used for events, timers, and array methods

## 3. `package.json`

Purpose:

1. Stores project metadata
2. Stores dependencies
3. Stores scripts

Example from this project:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint ."
}
```

Useful commands:

1. `npm run dev`
2. `npm run build`
3. `npm run lint`

## 4. `fetch`

Example:

`src/api/client.js`
```js
const response = await fetch(`${API_BASE_URL}${path}`, {
  ...options,
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
});
```

Use:

1. Send requests to backend/API
2. Get or send JSON data

## 5. Synchronous vs asynchronous

Synchronous:
Runs step by step immediately.

Example:
```js
document.documentElement.style.setProperty('--pink', tweaks.accentPink);
```

Asynchronous:
Waits for something like API data.

Example:
```js
const data = await productApi.getAll();
```

`async` and `await`:

1. `async` makes a function asynchronous
2. `await` waits for a promise

## 6. `localStorage` vs `sessionStorage`

`localStorage`:

1. Data stays after browser close
2. Used in this project for token/user

Example:
```js
localStorage.setItem(TOKEN_STORAGE_KEY, token);
```

`sessionStorage`:

1. Data disappears when tab/session ends

## 7. Browser storage in DevTools

Open:

1. DevTools
2. `Application`
3. `Local Storage`

In this project you can show:

1. `mm_api_token`
2. `mm_api_user`

Other storage types:

1. Local Storage
2. Session Storage
3. Cookies
4. IndexedDB

## 8. DOM manipulation

Example from `src/components/Layout/SEO.jsx`:
```js
tag = document.createElement('meta');
document.head.appendChild(tag);
tag.setAttribute(key, value);
```

Meaning:

1. Create DOM element
2. Insert it
3. Change attributes

## 9. Event bubbling

Definition:
An event starts on the child element and bubbles up to parents.

Example:
```js
onMouseDown={(e) => e.stopPropagation()}
```

Why used:

1. Prevent child click from also triggering parent handler

## 10. Scope

Scope = where a variable can be used.

Module/top-level example:
```js
const TOKEN_STORAGE_KEY = 'mm_api_token';
```

Local example:
```js
const response = await fetch(...);
```

Difference:

1. Local scope only exists inside function/block
2. Global/module scope is available in a larger area

## 11. Spread vs rest

Spread example:
```js
{ ...c, [d.id]: (c[d.id] || 0) + 1 }
```

Rest example:
```js
const { authToken, headers, ...fetchOptions } = options;
```

Difference:

1. Spread expands/copies values
2. Rest collects the remaining values

## Super short oral recap

1. Higher-order functions work with other functions
2. Callbacks are functions passed into other functions
3. `package.json` manages scripts and dependencies
4. `fetch` is used for API requests
5. `async/await` makes async code easier to read
6. `localStorage` persists longer than `sessionStorage`
7. DevTools can show Local Storage, Cookies, and more
8. DOM manipulation changes elements on the page
9. Event bubbling moves events from child to parent
10. Scope decides where variables are visible
11. Spread expands, rest collects

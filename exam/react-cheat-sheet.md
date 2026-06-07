## React Cheat Sheet

Short React exam notes based on this codebase.

## 1. React component

Definition:
A component is a reusable piece of UI with its own logic.

Example:
```jsx
export function Menu({ cart, products, loading, error, onAdd, onRetry }) {
  const [tab, setTab] = useState('');
  return <section>{loading && <div>Loading...</div>}</section>;
}
```

## 2. Why use components?

1. Reuse code
2. Split app into small parts
3. Easier maintenance
4. Less manual DOM code

## 3. JSX

Definition:
HTML-like syntax inside JavaScript.

Example:
```jsx
<button onClick={() => setOpen(true)}>Open</button>
```

## 4. Vanilla JS equivalent

Without React you would:

1. Use `document.createElement`
2. Add event listeners manually
3. Update DOM manually
4. Re-render manually

## 5. Props and `children`

Props example:
```jsx
<Profile user={user} onBook={onBook} onLogout={onLogout} />
```

`children` example:
```jsx
function Page({ children }) {
  return <div className="page">{children}</div>;
}
```

## 6. State

Definition:
State stores changing values inside a component.

Example:
```jsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');
```

## 7. Error handling

Example:
```jsx
try {
  const data = await quoteRequestApi.getByUserId(id);
} catch (err) {
  setRequestsError(err.message || 'Could not load your requests.');
}
```

## 8. Conditional rendering

`&&`:
```jsx
{loading && <div>Loading...</div>}
```

Ternary:
```jsx
{inCart ? 'Added' : 'Add'}
```

Return `null`:
```jsx
if (!open) return null;
```

## 9. `useEffect`

Purpose:
Run side effects after render.

Example:
```jsx
useEffect(() => {
  loadRequests();
}, [id]);
```

Parts:

1. Callback
2. Dependency array
3. Optional cleanup

## 10. Event handling

Examples:

```jsx
onClick={() => onBook('catering')}
onChange={e => setEmail(e.target.value)}
onSubmit={submit}
```

## 11. Form submit

Example:
```jsx
const submit = async (e) => {
  e.preventDefault();
};
```

## 12. `map` and `key`

Example:
```jsx
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

Why `key` matters:

1. Helps React track items
2. Improves updates and performance

## 13. Controlled vs uncontrolled forms

Controlled example:
```jsx
<input value={email} onChange={e => setEmail(e.target.value)} />
```

Controlled means React state owns the value.

Uncontrolled means the DOM owns the value.

## 14. Hooks

Hooks are built-in React functions.

Examples:

1. `useState`
2. `useEffect`
3. `useMemo`
4. `useRef`
5. `useCallback`

## 15. Short oral recap

1. Components are reusable UI blocks
2. JSX is HTML-like syntax in JavaScript
3. Props pass data, `children` passes nested content
4. State stores changing values
5. `useEffect` handles side effects
6. Controlled inputs use React state
7. Errors are handled with `try/catch` and error state
8. Lists are rendered with `map` and stable `key`s

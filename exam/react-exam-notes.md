## React Exam Notes

These answers are based on examples from this codebase.

## 1. What is the main concept of a React component?

A React component is a reusable piece of UI with its own logic.

Example from `src/components/Services/Menu.jsx:6`:
```jsx
export function Menu({ cart, products, loading, error, onAdd, onRetry }) {
  const [tab, setTab] = useState('');

  return (
    <section className="section">
      {loading && <div className="menu-state">Loading menu...</div>}
      {error && <button type="button" onClick={onRetry}>Retry</button>}
    </section>
  );
}
```

This shows that a component:

1. Receives props
2. Can have its own state
3. Returns JSX
4. Can be reused by other components

## 2. Benefits of components compared to vanilla JavaScript

Benefits of components:

1. Reusable UI blocks
2. Clear separation of concerns
3. Easier maintenance
4. State-driven rendering
5. Less manual DOM work

In this project, the app is split into components like:

1. `Topbar`
2. `Hero`
3. `Menu`
4. `Booking`
5. `Profile`
6. `AuthModal`

In vanilla JavaScript, you would usually have to:

1. Query DOM elements manually
2. Create DOM nodes with `document.createElement`
3. Update text and classes manually
4. Reattach events yourself

## 3. What is JSX?

JSX is a syntax that lets us write HTML-like UI inside JavaScript.

Example from `src/components/Marketing/FAQ.jsx:18`:
```jsx
{items.map((it, i) => (
  <div className={`faq-item ${open===i?'open':''}`} key={it.q}>
    <button type="button" className="faq-q" onClick={() => setOpen(open===i?-1:i)}>
      <span>{it.q}</span>
      <span className="plus">+</span>
    </button>
    <div className="faq-a">{it.a}</div>
  </div>
))}
```

JSX is not plain HTML. React turns it into JavaScript instructions that describe the UI.

## 4. How would the same functionality be written with JavaScript, HTML and DOM manipulation?

React example from `FAQ.jsx`:
```jsx
<button type="button" className="faq-q" onClick={() => setOpen(open===i?-1:i)}>
```

Vanilla JavaScript version:
```html
<div id="faq"></div>
<script>
  const items = [
    { q: 'Question 1', a: 'Answer 1' },
    { q: 'Question 2', a: 'Answer 2' }
  ];

  let open = -1;
  const root = document.getElementById('faq');

  function render() {
    root.innerHTML = '';

    items.forEach((item, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = `faq-item ${open === i ? 'open' : ''}`;

      const button = document.createElement('button');
      button.textContent = item.q;
      button.addEventListener('click', () => {
        open = open === i ? -1 : i;
        render();
      });

      const answer = document.createElement('div');
      answer.textContent = item.a;

      wrapper.appendChild(button);
      wrapper.appendChild(answer);
      root.appendChild(wrapper);
    });
  }

  render();
</script>
```

Difference:

1. Vanilla JS needs manual element creation and updates
2. React lets us describe UI based on state

## 5. Props including `children`

Props are values passed from a parent component to a child component.

Example from `src/App.jsx:65`:
```jsx
<Admin
  user={user}
  products={products}
  productsLoading={productsLoading}
  productsError={productsError}
  onLogout={onLogout}
  onProductsChanged={onProductsChanged}
/>
```

Example with `children` from `src/App.jsx:47`:
```jsx
function Page({ children }) {
  return <div className="page">{children}</div>;
}
```

Another `children` example from `src/tweaks-panel.jsx:146`:
```jsx
export function TweaksPanel({ title = 'Tweaks', children }) {
  return <div className="twk-body">{children}</div>;
}
```

Purpose of props:

1. Pass data down
2. Pass event handlers down
3. Make components reusable
4. Let wrapper components render nested content with `children`

## 6. Role of state in a React component

State stores values that can change over time and affect rendering.

Example from `src/components/Auth/AuthModal.jsx:59`:
```jsx
const [mode, setMode] = useState(initialMode);
const [email, setEmail] = useState(initialEmail);
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [busy, setBusy] = useState(false);
const [error, setError] = useState('');
```

State is used for:

1. Input values
2. Error messages
3. Loading state
4. UI mode like login/register

When state changes, React re-renders the component.

## 7. How do you handle errors in React?

This project handles errors with `try/catch` and error state.

Example from `src/components/Profile/Profile.jsx:21`:
```jsx
try {
  const data = await quoteRequestApi.getByUserId(id);
  if (!ignore) {
    setRequests(Array.isArray(data) ? data : []);
  }
} catch (err) {
  if (!ignore) {
    setRequestsError(err.message || 'Could not load your requests.');
  }
}
```

Example from `src/components/Auth/AuthModal.jsx:105`:
```jsx
} catch (err) {
  if (mode === 'register' && err.status === 409) {
    setMode('login');
    setConfirmPassword('');
    setError('User already exists. Please log in.');
    return;
  }

  setError(err.message || 'Could not complete authentication.');
}
```

This handles:

1. HTTP errors
2. Validation errors
3. Friendly UI messages

## 8. Different ways of conditional rendering

Logical `&&` from `src/components/Services/Menu.jsx:28`:
```jsx
{loading && <div className="menu-state">Loading menu...</div>}
```

Multiple conditions from `src/components/Services/Menu.jsx:35`:
```jsx
{!loading && !error && tabs.length === 0 && (
  <div className="menu-state">No products available yet.</div>
)}
```

Ternary from `src/components/Services/Menu.jsx:65`:
```jsx
{inCart ? `× ${cart[d.id]} added` : '+ Add'}
```

Return `null` from `src/tweaks-panel.jsx:218`:
```jsx
if (!open) return null;
```

Section switching from `src/components/Admin/Admin.jsx`:
```jsx
{adminTab === 'requests' && (...) }
{adminTab === 'calendar' && (...) }
```

## 9. `useEffect`

`useEffect` runs side effects after rendering.

Example from `src/components/Profile/Profile.jsx:14`:
```jsx
useEffect(() => {
  if (!id) {
    return;
  }

  let ignore = false;

  async function loadRequests() {
    setRequestsLoading(true);
    setRequestsError('');

    try {
      const data = await quoteRequestApi.getByUserId(id);
      if (!ignore) {
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (!ignore) {
        setRequestsError(err.message || 'Could not load your requests.');
      }
    } finally {
      if (!ignore) {
        setRequestsLoading(false);
      }
    }
  }

  loadRequests();

  return () => {
    ignore = true;
  };
}, [id]);
```

Explanation:

1. Callback: the function passed into `useEffect`
2. Dependency array: `[id]` means rerun when `id` changes
3. Cleanup: the returned function runs before rerun/unmount

Another example from `src/tweaks-panel.jsx:180` adds and removes a browser event listener.

## 10. Event handling in React

Examples:

`onClick` from `src/components/Marketing/Hero.jsx`
```jsx
<button type="button" className="btn btn-primary" onClick={() => onBook('catering')}>
```

`onChange` from `src/components/Auth/AuthModal.jsx:154`
```jsx
<input value={email} onChange={e => setEmail(e.target.value)} />
```

`onSubmit` from `src/components/Auth/AuthModal.jsx:122`
```jsx
<form className="auth-modal" onSubmit={submit}>
```

`onMouseDown` from `src/tweaks-panel.jsx:224`
```jsx
<div className="twk-hd" onMouseDown={onDragStart}>
```

## 11. Form submit events

Example from `src/components/Auth/AuthModal.jsx:66`:
```jsx
const submit = async (e) => {
  e.preventDefault();
  if (!email.trim() || !password) return;
  ...
};
```

And the form:
```jsx
<form className="auth-modal" onSubmit={submit}>
```

Another example from `src/components/Admin/EmailPanel/EmailPanel.jsx:38`:
```jsx
const sendEmail = async (event) => {
  event.preventDefault();
  ...
};
```

Purpose:

1. Prevent default page reload
2. Validate fields
3. Submit async data
4. Update loading and error state

## 12. `map` for rendering lists and the `key` attribute

Example from `src/components/Services/Menu.jsx:47`:
```jsx
{items.map(d => {
  return (
    <article className="dish" key={d.id}>
      ...
    </article>
  );
})}
```

Another example from `src/components/Marketing/FAQ.jsx:18`:
```jsx
{items.map((it, i) => (
  <div className={`faq-item ${open===i?'open':''}`} key={it.q}>
```

Why use `map`:

1. Convert array data into JSX elements

Why use `key`:

1. Helps React identify each item between renders
2. Improves performance
3. Prevents list update bugs

Best practice is to use a stable unique key like `id`.

## 13. Controlled vs uncontrolled components in forms

This project mainly uses controlled components.

Controlled example from `src/components/Admin/EmailPanel/EmailPanel.jsx:96`:
```jsx
<input
  type="email"
  value={emailForm.to}
  onChange={event => updateEmailField('to', event.target.value)}
/>
```

Another controlled example from `src/components/Booking/Booking.jsx:511`:
```jsx
<input value={location} onChange={e=>setLocation(e.target.value)} />
```

Controlled means:

1. The input value is stored in React state
2. React controls what appears in the field

Uncontrolled means:

1. The DOM stores the value itself
2. You often access it through refs

This project mostly uses controlled forms because they are easier to validate and reset.

## 14. What are React Hooks?

Hooks are built-in functions that let function components use React features.

Examples from this codebase:

`useState` from `src/components/Marketing/FAQ.jsx:4`
```jsx
const [open, setOpen] = useState(0);
```

`useEffect` from `src/components/Profile/Profile.jsx:14`
```jsx
useEffect(() => {
  ...
}, [id]);
```

Other hooks also used here:

1. `useMemo` in `src/components/Services/Menu.jsx:7`
2. `useRef` in `src/components/Booking/Booking.jsx:255`
3. `useCallback` in `src/components/Admin/useAdminData.js:16`

## 15. Example of handling errors in React

Compact example from `src/components/Admin/EmailPanel/EmailPanel.jsx:38`:
```jsx
const sendEmail = async (event) => {
  event.preventDefault();

  const to = emailForm.to.trim();
  const subject = emailForm.subject.trim();
  const body = emailForm.body.trim();

  if (!to || !subject || !body) {
    setError('Add recipient, subject, and message before sending.');
    return;
  }

  setSending(true);
  setError('');
  setSuccess('');

  try {
    await emailApi.send({ to, subject, body });
    setEmailForm(initialEmailForm);
    setSuccess(`Email sent to ${to}.`);
  } catch (err) {
    setError(err.message || 'Could not send email.');
  } finally {
    setSending(false);
  }
};
```

This shows:

1. Validation errors
2. Async request errors
3. Loading state
4. Success state
5. Friendly UI messages

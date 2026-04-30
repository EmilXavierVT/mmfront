import { useState } from 'react';
import { login, register } from '../api/client.js';
import { Icon } from './Icon.jsx';

export function AuthModal({ onClose, onAuthenticated, initialEmail = '', initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setBusy(true);
    setError('');

    const credentials = {
      email: email.trim(),
      password,
    };

    try {
      let user;
      if (mode === 'login') {
        user = await login(credentials);
      } else {
        user = await register(credentials);
      }

      onAuthenticated(user || { email: credentials.email });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not complete authentication.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="auth-backdrop" type="button" aria-label="Close account panel" onClick={onClose} />
      <form className="auth-modal" onSubmit={submit}>
        <div className="auth-head">
          <div>
            <div className="section-eyebrow">Account</div>
            <h2 id="auth-title">{mode === 'login' ? 'Log in' : 'Register'}</h2>
          </div>
          <button className="icon-btn auth-close" type="button" aria-label="Close account panel" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="segmented auth-tabs">
          <button type="button" className={`seg ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={`seg ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <div className="field">
          <label>{mode === 'login' ? 'Email or username' : 'Email'}</label>
          <input
            type={mode === 'login' ? 'text' : 'email'}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={mode === 'login' ? 'you@inbox.dk or admin' : 'you@inbox.dk'}
            required
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
          {!busy && <Icon name="arrow" size={18} />}
        </button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { login, register } from '../api/client.js';
import { emailApi } from '../api/email.js';
import { Icon } from './Icon.jsx';

const APP_URL = 'https://morgendagensmaaltid.dk';
const EMAIL_LOGO_URL = `${APP_URL}/fistIcon.png`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRegistrationEmail(email) {
  const safeEmail = escapeHtml(email);

  return {
    subject: 'Welcome to Morgendagens Mad',
    body: `
      <div style="background:#1c1a1c;color:#efefef;font-family:'Azeret Mono','Courier New',monospace;font-style:italic;font-weight:700;line-height:1.6;max-width:680px;margin:0 auto;padding:28px;border:2px solid #0496ff;">
        <div style="background:#0496ff;border:2px solid #1c1a1c;border-radius:0 0 12px 22px;padding:18px 20px;margin:0 0 26px;color:#1c1a1c;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;width:76px;border:0;">
                <img src="${EMAIL_LOGO_URL}" width="64" height="64" alt="Morgendagens Måltid" style="display:block;border:0;outline:none;text-decoration:none;width:64px;height:64px;object-fit:contain;" />
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">Morgendagens Måltid</p>
                <h1 style="margin:6px 0 0;font-size:28px;line-height:1.05;color:#1c1a1c;font-style:italic;">Welcome</h1>
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size:16px;margin:0 0 16px;color:#efefef;">Your account has been created successfully.</p>
        <p style="font-size:16px;margin:0 0 22px;color:#efefef;">You can now log in to follow your requests, review bookings, and keep your contact details ready for the next order.</p>

        <div style="background:#efefef;border:2px solid #1c1a1c;border-radius:49% 51% 38% 62% / 56% 42% 58% 44%;color:#1c1a1c;padding:24px 28px;margin:24px auto;text-align:center;max-width:430px;">
          <strong style="display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;font-weight:900;font-size:17px;">Account email</strong>
          <span style="font-weight:900;font-size:18px;">${safeEmail}</span>
        </div>

        <a href="${APP_URL}" style="display:inline-block;background:#ff1dff;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:0.04em;border:2px solid #1c1a1c;border-radius:10px;padding:14px 20px;font-size:15px;box-shadow:0 5px 0 #0496ff;margin:4px 0 24px;">
          Back to our page
        </a>

        <p style="font-size:15px;margin:0;color:#efefef;">Best regards,<br />Morgendagens Måltid</p>
        <p style="font-size:12px;margin:18px 0 0;color:#e6e4e1;">${APP_URL}</p>
      </div>
    `,
  };
}

export function AuthModal({ onClose, onAuthenticated, initialEmail = '', initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

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
        const registrationEmail = buildRegistrationEmail(credentials.email);

        try {
          await emailApi.send({
            to: credentials.email,
            subject: registrationEmail.subject,
            body: registrationEmail.body,
            html: true,
          });
        } catch (emailError) {
          console.warn('Registration email could not be sent.', emailError);
        }
      }

      onAuthenticated(user || { email: credentials.email });
      onClose();
    } catch (err) {
      if (mode === 'register' && err.status === 409) {
        setMode('login');
        setConfirmPassword('');
        setError('User already exists. Please log in.');
        return;
      }

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
          <button
            type="button"
            className={`seg ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
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

        {mode === 'register' && (
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
            />
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
          {!busy && <Icon name="arrow" size={18} />}
        </button>
      </form>
    </div>
  );
}

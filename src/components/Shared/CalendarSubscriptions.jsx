import { useRef, useState } from 'react';
import { calendarSubscriptionApi } from '../../api/calendarSubscriptions.js';
import './CalendarSubscriptions.css';

function CalendarSubscription({ feed, label }) {
  const input = useRef(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function getLink() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setUrl(await calendarSubscriptionApi.getLink(feed));
    } catch (err) {
      setError(err.message || 'Could not get the calendar link.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Link copied.');
    } catch {
      input.current?.focus();
      input.current?.select();
      setNotice('Link selected. Use your device’s copy command.');
    }
  }

  async function revokeLink() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await calendarSubscriptionApi.revoke(feed);
      setUrl('');
      setNotice('Link revoked.');
    } catch (err) {
      setError(err.message || 'Could not revoke the calendar link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="calendar-subscription">
      <div className="calendar-subscription-actions">
        <strong>{label}</strong>
        {!url && (
          <button className="btn btn-blue" type="button" onClick={getLink} disabled={busy} aria-label={`Get ${label} link`}>
            {busy ? 'Getting link…' : 'Get link'}
          </button>
        )}
      </div>
      {url && (
        <div className="calendar-subscription-actions calendar-subscription-link field">
          <input ref={input} value={url} readOnly aria-label={`${label} subscription URL`} onFocus={event => event.target.select()} />
          <button className="btn btn-blue" type="button" onClick={copyLink} disabled={busy} aria-label={`Copy ${label} link`}>
            Copy link
          </button>
          <button className="btn btn-danger" type="button" onClick={revokeLink} disabled={busy} aria-label={`Revoke ${label} link`}>
            {busy ? 'Revoking…' : 'Revoke link'}
          </button>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="calendar-subscription-notice" role="status">{notice}</p>}
    </div>
  );
}

export function CalendarSubscriptions({ feeds, title = 'Calendar links' }) {
  return (
    <details className="calendar-subscriptions">
      <summary>{title}</summary>
      <p>Paste a link into your calendar app to subscribe. Anyone with the link can view its events.</p>
      {feeds.map(([feed, label]) => <CalendarSubscription key={feed} feed={feed} label={label} />)}
    </details>
  );
}

import { useEffect, useState } from 'react';
import { quoteRequestApi } from '../api/requests.js';
import { Icon } from './Icon.jsx';
import { RequestList } from './RequestList.jsx';

export function Profile({ user, onBook, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [openRequestId, setOpenRequestId] = useState(null);
  const [requestProducts, setRequestProducts] = useState({});
  const id = user?.id || user?.userId;

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

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Profile</div>
          <h1>Welcome back.</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-cream" type="button" onClick={onLogout}>
          Log out <Icon name="logout" size={18} />
        </button>
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <span>Account</span>
          <h2>Your details</h2>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Logged in</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{id || 'Not available'}</dd>
            </div>
          </dl>
        </div>

        <div className="profile-panel accent">
          <span>Next</span>
          <h2>Make a request</h2>
          <p>Build a cart, choose a date, and send it straight through with your current session.</p>
          <button className="btn btn-primary" type="button" onClick={onBook}>
            Book now <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      <section className="profile-requests">
        <div className="profile-section-head">
          <div>
            <div className="section-eyebrow">Requests</div>
            <h2>Your requests</h2>
          </div>
          <button className="btn btn-blue" type="button" onClick={onBook}>
            New request <Icon name="arrow" size={18} />
          </button>
        </div>

        {!id && (
          <div className="profile-empty">We could not find your id in the login session. Log out and log in again to refresh it.</div>
        )}

        {id && requestsLoading && (
          <div className="profile-empty">Loading requests...</div>
        )}

        {id && requestsError && (
          <div className="form-error">{requestsError}</div>
        )}

        {id && !requestsLoading && !requestsError && requests.length === 0 && (
          <div className="profile-empty">No requests yet. Your first one will show up here.</div>
        )}

        {requests.length > 0 && (
          <RequestList
            requests={requests}
            openRequestId={openRequestId}
            requestProducts={requestProducts}
            onOpenRequest={setOpenRequestId}
            onSetRequestProducts={setRequestProducts}
          />
        )}
      </section>
    </main>
  );
}

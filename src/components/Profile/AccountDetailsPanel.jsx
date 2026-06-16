import { useEffect, useState } from 'react';
import { userApi } from '../../api/users.js';
import { Icon } from '../Shared/Icon.jsx';

function normalizeUserData(data, fallbackUser) {
  return {
    raw: data || null,
    id: data?.id ?? fallbackUser?.id ?? fallbackUser?.userId ?? null,
    email: data?.email ?? fallbackUser?.email ?? '',
    firstName: data?.firstName ?? fallbackUser?.firstName ?? '',
    lastName: data?.lastName ?? fallbackUser?.lastName ?? '',
    zipCode: data?.zipCode ?? fallbackUser?.zipCode ?? '',
    role: data?.role ?? fallbackUser?.role ?? '',
    roles: data?.roles ?? (fallbackUser?.role ? [fallbackUser.role] : []),
  };
}

export function AccountDetailsPanel({ user, onUserUpdated }) {
  const [details, setDetails] = useState(() => normalizeUserData(null, user));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userId = user?.id || user?.userId;

  useEffect(() => {
    Promise.resolve().then(() => {
      setDetails(current => ({
        ...current,
        email: user?.email ?? '',
        firstName: user?.firstName ?? current.firstName,
        lastName: user?.lastName ?? current.lastName,
        zipCode: user?.zipCode ?? current.zipCode,
        role: user?.role ?? current.role,
        roles: current.roles?.length ? current.roles : (user?.role ? [user.role] : []),
        id: userId ?? current.id,
      }));
    });
  }, [user?.email, user?.firstName, user?.id, user?.lastName, user?.role, user?.userId, user?.zipCode, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let ignore = false;

    async function loadUser() {
      setLoading(true);
      setError('');

      try {
        const data = await userApi.getById(userId);
        if (!ignore) {
          setDetails(normalizeUserData(data, user));
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Could not load your account details.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [user, userId]);

  function updateField(field, value) {
    setDetails(current => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = String(details.email || '').trim();
    const firstName = String(details.firstName || '').trim();
    const lastName = String(details.lastName || '').trim();
    const zipCode = String(details.zipCode || '').trim();

    if (!details.id) {
      setError('Your user id is missing from the session.');
      setSuccess('');
      return;
    }

    if (!email || !firstName || !lastName || !zipCode) {
      setError('Add first name, last name, zip code, and email.');
      setSuccess('');
      return;
    }

    if (!/^\d+$/.test(zipCode)) {
      setError('Zip code must be a number.');
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...(details.raw || {}),
        id: details.id,
        email,
        firstName,
        lastName,
        zipCode: Number(zipCode),
      };

      if (Array.isArray(details.roles) && details.roles.length > 0) {
        payload.roles = details.roles;
      }

      const updatedUser = await userApi.update(details.id, payload);
      const normalizedUser = normalizeUserData(updatedUser || payload, {
        ...user,
        id: details.id,
        email,
        firstName,
        lastName,
        zipCode: Number(zipCode),
      });

      setDetails(normalizedUser);
      setSuccess('Account details updated.');
      onUserUpdated?.({
        ...user,
        id: normalizedUser.id,
        email: normalizedUser.email,
        firstName: normalizedUser.firstName,
        lastName: normalizedUser.lastName,
        zipCode: normalizedUser.zipCode,
        role: normalizedUser.role || user?.role,
      });
    } catch (err) {
      setError(err.message || 'Could not update your account details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-panel change-password-panel">
      <span>Account</span>
      <h2>Your details</h2>
      <p>Update the account details connected to your profile.</p>

      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <div className="field">
            <label>First name</label>
            <input
              type="text"
              value={details.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              placeholder="First name"
              disabled={loading || saving}
            />
          </div>
          <div className="field">
            <label>Last name</label>
            <input
              type="text"
              value={details.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              placeholder="Last name"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Zip code</label>
            <input
              type="text"
              inputMode="numeric"
              value={details.zipCode}
              onChange={(event) => updateField('zipCode', event.target.value)}
              placeholder="Zip code"
              disabled={loading || saving}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={details.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="you@inbox.dk"
              disabled={loading || saving}
            />
          </div>
        </div>

        <div className="account-meta">
          <div>
            <dt>Status</dt>
            <dd>Logged in</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{details.id || 'Not available'}</dd>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="change-password-actions">
          <button className="btn btn-blue" type="submit" disabled={loading || saving}>
            {loading ? 'Loading...' : saving ? 'Saving...' : 'Save details'}
            {!loading && !saving && <Icon name="check" size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}

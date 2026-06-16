import { useState } from 'react';
import { changePassword } from '../../api/client.js';
import { Icon } from '../Shared/Icon.jsx';

export function ChangePasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Fill in all password fields.');
      setSuccess('');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setSuccess('');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const response = await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(response?.msg || response?.message || 'Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Could not change password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-panel change-password-panel">
      <span>Security</span>
      <h2>Change password</h2>
      <p>Enter your current password, then choose a new one for this account.</p>

      <form onSubmit={handleSubmit}>
        <div className="field-row">
          <div className="field">
            <label>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Your current password"
              autoComplete="current-password"
            />
          </div>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Your new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="field">
          <label>Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your new password"
            autoComplete="new-password"
          />
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="change-password-actions">
          <button className="btn btn-blue" type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Update password'}
            {!busy && <Icon name="check" size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}

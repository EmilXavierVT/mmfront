import { useState } from 'react';
import { Icon } from '../../Shared/Icon.jsx';

const ROLE_OPTIONS = [
  ['USER', 'User'],
  ['ADMIN', 'Admin'],
  ['EMPLOYEE', 'Employee'],
  ['CLEANING_STAFF', 'Cleaning staff'],
  ['CLEANING_MANAGER', 'Cleaning manager'],
  ['CLEANING_CLIENT', 'Cleaning customer'],
  ['SUBSCRIBER', 'Subscriber'],
  ['FLEX', 'Flex'],
  ['YOUTH_ISLAND', 'Ungdomsøen'],
];

export function UserEditor({ user, currentUserId, disabled, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    email: user.raw.email || '',
    firstName: user.raw.firstName || '',
    lastName: user.raw.lastName || '',
    phoneNumber: user.raw.phoneNumber || '',
    streetName: user.raw.streetName || '',
    streetNumber: user.raw.streetNumber || '',
    zipCode: String(user.raw.zipCode ?? ''),
    tenantId: String(user.raw.tenantId ?? ''),
    roles: [...(user.raw.roles || [])],
    password: '',
    confirmPassword: '',
  }));
  const [error, setError] = useState('');
  const idPrefix = `admin-user-${user.id}`;

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
    setError('');
  }

  function toggleRole(role) {
    updateField('roles', form.roles.includes(role)
      ? form.roles.filter(value => value !== role)
      : [...form.roles, role]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (disabled) return;

    if (form.password !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (new TextEncoder().encode(form.password).length > 72) {
      setError('Password must be at most 72 UTF-8 bytes.');
      return;
    }
    if (!form.roles.length) {
      setError('Choose at least one role.');
      return;
    }
    const tenantId = Number(form.tenantId);
    if (!Number.isSafeInteger(tenantId) || tenantId < 1) {
      setError('Enter a valid tenant ID.');
      return;
    }
    const zipCode = Number(form.zipCode);
    if (!Number.isInteger(zipCode) || zipCode < 0 || zipCode > 2147483647) {
      setError('Zip code must be a non-negative whole number.');
      return;
    }

    const payload = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      streetName: form.streetName.trim(),
      streetNumber: form.streetNumber.trim(),
      zipCode,
      tenantId,
      roles: form.roles,
      ...(form.password.trim() ? { password: form.password } : {}),
    };

    setError('');
    try {
      await onSave(payload);
      onCancel();
    } catch (err) {
      setError(err.message || 'Could not save user details.');
    }
  }

  function textField(field, label, type = 'text', options = {}) {
    return (
      <div className="field">
        <label htmlFor={`${idPrefix}-${field}`}>{label}</label>
        <input
          id={`${idPrefix}-${field}`}
          type={type}
          value={form[field]}
          onChange={event => updateField(field, event.target.value)}
          {...options}
        />
      </div>
    );
  }

  return (
    <form className="admin-product-form admin-user-editor" onSubmit={handleSubmit}>
      <h4>Edit user details</h4>
      <p>User #{user.id}</p>
      <fieldset className="admin-user-editor-fields" disabled={disabled}>
        <div className="field-row">
          {textField('firstName', 'First name', 'text', { autoComplete: 'off' })}
          {textField('lastName', 'Last name', 'text', { autoComplete: 'off' })}
        </div>
        <div className="field-row">
          {textField('email', 'Email', 'email', { required: true, autoComplete: 'off' })}
          {textField('phoneNumber', 'Phone number', 'tel', { autoComplete: 'off' })}
        </div>
        <div className="field-row">
          {textField('streetName', 'Street name', 'text', { autoComplete: 'off' })}
          {textField('streetNumber', 'Street number', 'text', { autoComplete: 'off' })}
        </div>
        <div className="field-row">
          {textField('zipCode', 'Zip code', 'number', { min: 0, max: 2147483647, step: 1 })}
          {textField('tenantId', 'Tenant ID', 'number', { required: true, min: 1, step: 1 })}
        </div>

        <fieldset className="admin-user-role-fields">
          <legend>Roles</legend>
          <div className="admin-user-role-options">
            {ROLE_OPTIONS.map(([role, label]) => (
              <label className="admin-checkbox-row" key={role}>
                <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                {label}
              </label>
            ))}
          </div>
          <p>Role changes apply the next time this user signs in.</p>
        </fieldset>

        <div className="field-row">
          {textField('password', 'New password', 'password', {
            autoComplete: 'new-password',
            'aria-describedby': `${idPrefix}-password-help`,
          })}
          {textField('confirmPassword', 'Confirm new password', 'password', { autoComplete: 'new-password' })}
        </div>
        <p id={`${idPrefix}-password-help`}>Leave both password fields blank to keep the current password.</p>
        {String(currentUserId) === String(user.id) && (
          <p>Changing your own email, tenant, or roles will sign you out. Sign in again with your updated details.</p>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="admin-product-form-actions">
          <button className="btn btn-cream" type="button" onClick={onCancel}>Cancel</button>
          <button className="btn btn-blue" type="submit">
            {disabled ? 'Saving...' : 'Save user'}
            <Icon name="check" size={18} />
          </button>
        </div>
      </fieldset>
    </form>
  );
}

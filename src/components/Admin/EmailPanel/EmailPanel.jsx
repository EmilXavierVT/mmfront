import { useMemo, useState } from 'react';
import { emailApi } from '../../../api/email.js';
import { Icon } from '../../Shared/Icon.jsx';

const initialEmailForm = {
  to: '',
  subject: '',
  body: '',
};

function uniqueRecipients(recipients) {
  const emails = new Set();
  return recipients.filter(recipient => {
    const key = recipient.email.toLocaleLowerCase();
    if (emails.has(key)) return false;
    emails.add(key);
    return true;
  });
}

export function EmailPanel({ users = [], economicCustomers = [], senderEmail = '' }) {
  const [emailForm, setEmailForm] = useState(initialEmailForm);
  const [recipientSource, setRecipientSource] = useState('users');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userOptions = useMemo(() => uniqueRecipients(users
    .filter(user => user.email && user.email !== 'Unknown')
    .map(user => ({
      key: `user-${user.id || user.email}`,
      email: user.email,
      label: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      detail: user.role || 'Local user',
    }))), [users]);

  const economicCustomerOptions = useMemo(() => uniqueRecipients(economicCustomers
    .filter(customer => customer.email)
    .map(customer => ({
      key: `economic-${customer.customerNumber || customer.email}`,
      email: customer.email,
      label: customer.name || customer.email,
      detail: customer.customerNumber
        ? `e-conomic customer #${customer.customerNumber}`
        : 'e-conomic customer',
    }))), [economicCustomers]);

  const activeRecipients = recipientSource === 'economic' ? economicCustomerOptions : userOptions;
  const filteredRecipients = useMemo(() => {
    const query = recipientSearch.trim().toLocaleLowerCase('da');
    if (!query) return activeRecipients;
    return activeRecipients.filter(recipient => [recipient.label, recipient.email, recipient.detail]
      .some(value => String(value || '').toLocaleLowerCase('da').includes(query)));
  }, [activeRecipients, recipientSearch]);

  const updateEmailField = (field, value) => {
    setEmailForm(current => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const chooseRecipientSource = (source) => {
    setRecipientSource(source);
    setRecipientSearch('');
  };

  const selectRecipient = (recipient) => {
    updateEmailField('to', recipient.email);
  };

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

  return (
    <section className="profile-requests admin-email">
      <section className="profile-grid admin-grid">
        <div className="profile-panel">
          <span>Recipients</span>
          <h2>{userOptions.length + economicCustomerOptions.length}</h2>
          <p>{userOptions.length} local users and {economicCustomerOptions.length} e-conomic customers with email.</p>
        </div>

        <div className="profile-panel accent">
          <span>Sender</span>
          <h2>{senderEmail ? senderEmail.split('@')[0] : 'Admin'}</h2>
          <p>{senderEmail || 'Authenticated admin session'}</p>
        </div>
      </section>
      <br />

      <div className="profile-section-head">
        <div>
          <div className="section-eyebrow">Email</div>
          <h2>Send message</h2>
        </div>
      </div>

      <div className="admin-email-layout">
        <aside className="admin-email-directory" aria-label="Recipient directory">
          <div className="admin-email-source-tabs" role="tablist" aria-label="Recipient source">
            <button
              className={recipientSource === 'users' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={recipientSource === 'users'}
              onClick={() => chooseRecipientSource('users')}
            >
              Users <span>{userOptions.length}</span>
            </button>
            <button
              className={recipientSource === 'economic' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={recipientSource === 'economic'}
              onClick={() => chooseRecipientSource('economic')}
            >
              Customers <span>{economicCustomerOptions.length}</span>
            </button>
          </div>

          <div className="field admin-email-recipient-search">
            <label>Find recipient</label>
            <input
              value={recipientSearch}
              onChange={event => setRecipientSearch(event.target.value)}
              placeholder={recipientSource === 'economic' ? 'Name, email, or customer number' : 'Name, email, or role'}
            />
          </div>

          <div className="admin-email-recipient-count">
            {filteredRecipients.length} {recipientSource === 'economic' ? 'customers' : 'users'}
          </div>

          <div className="admin-email-recipient-list">
            {filteredRecipients.slice(0, 10).map(recipient => (
              <button
                className={emailForm.to === recipient.email ? 'selected' : ''}
                type="button"
                key={recipient.key}
                onClick={() => selectRecipient(recipient)}
              >
                <strong>{recipient.label}</strong>
                <span>{recipient.email}</span>
                <small>{recipient.detail}</small>
              </button>
            ))}
            {filteredRecipients.length === 0 && (
              <div className="profile-empty">No recipients match your search.</div>
            )}
          </div>
        </aside>

        <form className="admin-product-form admin-email-form" onSubmit={sendEmail}>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="field">
            <label>To</label>
            <input
              type="email"
              value={emailForm.to}
              onChange={event => updateEmailField('to', event.target.value)}
              placeholder="customer@inbox.dk"
              list="admin-email-recipients"
              required
            />
            <datalist id="admin-email-recipients">
              {[...userOptions, ...economicCustomerOptions].map(recipient => (
                <option value={recipient.email} key={recipient.key}>
                  {recipient.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="field">
            <label>Subject</label>
            <input
              value={emailForm.subject}
              onChange={event => updateEmailField('subject', event.target.value)}
              placeholder="Your request from Morgendagens Maaltid"
              required
            />
          </div>

          <div className="field">
            <label>Message</label>
            <textarea
              value={emailForm.body}
              onChange={event => updateEmailField('body', event.target.value)}
              placeholder="Write the customer email here"
              rows="8"
              required
            />
          </div>

          <div className="admin-email-actions">
            <button className="btn btn-blue" type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send email'}
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

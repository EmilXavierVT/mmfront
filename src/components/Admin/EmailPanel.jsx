import { useMemo, useState } from 'react';
import { emailApi } from '../../api/email.js';
import { Icon } from '../Icon.jsx';

const initialEmailForm = {
  to: '',
  subject: '',
  body: '',
};

export function EmailPanel({ customers = [], selectedCustomer = null, senderEmail = '' }) {
  const [emailForm, setEmailForm] = useState(initialEmailForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const customerOptions = useMemo(
    () => customers
      .filter(customer => customer.email && customer.email !== 'Unknown')
      .map(customer => ({
        email: customer.email,
        label: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email,
      })),
    [customers],
  );

  const updateEmailField = (field, value) => {
    setEmailForm(current => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const useSelectedCustomer = () => {
    if (!selectedCustomer?.email || selectedCustomer.email === 'Unknown') return;
    updateEmailField('to', selectedCustomer.email);
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
          <h2>{customerOptions.length}</h2>
          <p>Known customer emails available from the user API.</p>
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

      <form className="admin-product-form admin-email-form" onSubmit={sendEmail}>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="field-row">
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
              {customerOptions.map(customer => (
                <option value={customer.email} key={customer.email}>
                  {customer.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="admin-product-submit">
            <button
              className="btn btn-cream"
              type="button"
              onClick={useSelectedCustomer}
              disabled={!selectedCustomer?.email || selectedCustomer.email === 'Unknown'}
            >
              Use selected user
              <Icon name="check" size={18} />
            </button>
          </div>
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
    </section>
  );
}

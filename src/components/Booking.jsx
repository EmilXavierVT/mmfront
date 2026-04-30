import { useRef, useState } from 'react';
import { registerAccount } from '../api/client.js';
import { emailApi } from '../api/email.js';
import { productInRequestApi, quoteRequestApi } from '../api/requests.js';
import { toDateTimePayload, toTimePayload } from '../lib/datetime.js';
import { Calendar } from './Calendar.jsx';
import { Icon } from './Icon.jsx';

const BOOKING_USER_TEMP_PASSWORD = 'changeMe!';
const EMAIL_LOGO_MARK = `
  <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Morgendagens Maaltid">
    <path d="M72.4649 18.1727C76.5256 13.0209 87.4918 21.9996 86.9431 27.2562C86.3626 32.8358 72.3693 49.9003 69.9676 56.4761C66.7596 59.2221 56.442 54.6803 56.7214 50.1616C56.8314 48.3859 70.926 20.1221 72.4634 18.1727H72.4649Z" fill="#FF1DFF"/>
    <path d="M65.4291 8.40591C73.8372 14.6429 63.5457 20.91 62.3007 28.4188C59.1824 25.0082 53.7623 23.3072 47.8789 20.7837C50.9277 11.139 53.5162 -0.432112 65.4291 8.40591Z" fill="#FF1DFF"/>
    <path d="M26.6982 11.1003C28.1589 -2.49334 37.7034 -2.50482 46.9034 5.16044L42.1058 19.5909C38.1725 18.3622 26.2002 15.7296 26.6982 11.0989V11.1003Z" fill="#FF1DFF"/>
    <path d="M38.2201 97.1995C30.2594 95.6521 25.5182 94.2181 23.6145 91.1692C15.1065 77.5383 7.51055 61.7398 0 47.4801L20.974 15.5674L56.0295 28.8223C57.5162 29.5558 57.8029 30.4658 57.3787 31.4807C50.2127 46.0777 36.7015 40.7824 24.4513 37.1722L30.7617 43.8585L23.4104 52.6405C35.5521 47.5935 39.7938 59.2278 45.8031 67.1012L46.8179 64.0293C54.4428 74.32 58.88 100.105 38.2172 97.1995H38.2201Z" fill="#FF1DFF"/>
    <path d="M78.1081 99.9972C63.3201 95.3104 57.7161 95.8157 55.7994 78.856C55.2797 74.2525 58.246 82.7431 58.8077 81.5575C58.2358 71.8912 53.305 63.1207 47.3638 55.7597C53.2602 54.8913 55.9963 60.3158 61.8825 61.4886C65.2368 62.1575 68.9704 61.3795 71.6297 62.1503C75.2012 63.1867 80.614 72.3778 87.6773 66.7954C89.636 65.2465 91.1604 59.9584 94.215 58.8488C93.8574 73.9511 87.9378 88.6371 78.1096 100L78.1081 99.9972Z" fill="#FF1DFF"/>
    <path d="M99.9174 42.4446C99.6887 43.7035 86.8116 63.1509 85.6983 63.7997C82.0096 65.9485 74.169 59.7489 74.9363 55.6679C75.233 54.086 87.6208 33.72 88.9845 32.4898C94.4423 27.5691 100.8 37.5742 99.9174 42.4432V42.4446Z" fill="#FF1DFF"/>
  </svg>
`;

function formatDateTime(value) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-DK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRequestConfirmationEmail({
  service,
  createdRequest,
  startDate,
  startTime,
  endDate,
  endTime,
  location,
  guests,
  selectedDishes,
  cart,
  allergies,
}) {
  const serviceName = service === 'cleaning' ? 'cleaning' : 'catering';
  const requestId = createdRequest?.id ? `#${createdRequest.id}` : '';
  const detailRows = [
    ['Service', escapeHtml(serviceName)],
    ['Location', escapeHtml(location)],
    ['Start', formatDateTime(toDateTimePayload(startDate, startTime))],
    ['End', formatDateTime(toDateTimePayload(endDate, endTime))],
  ];
  const sections = [];

  if (service === 'catering') {
    detailRows.push(['Guests', escapeHtml(guests)]);

    if (selectedDishes.length > 0) {
      sections.push(`
        <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Menu</h2>
        <ul style="margin:0;padding-left:20px;color:#374151;">
          ${selectedDishes.map(dish => `<li>${escapeHtml(dish.name)} x ${escapeHtml(cart[dish.id] || 0)}</li>`).join('')}
        </ul>
      `);
    }

    if (allergies.trim()) {
      sections.push(`
        <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Allergies / dietary notes</h2>
        <p style="margin:0;color:#374151;">${escapeHtml(allergies.trim())}</p>
      `);
    }
  } else {
    detailRows.push(['Rooms / size estimate', escapeHtml(guests)]);
  }

  return {
    subject: `We received your ${serviceName} request`,
    body: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:640px;margin:0 auto;background:#ffffff;">
        <div style="background:#1A171B;padding:28px 24px;border-radius:18px 18px 0 0;text-align:center;">
          <div style="display:inline-block;width:72px;height:72px;margin-bottom:14px;">${EMAIL_LOGO_MARK}</div>
          <div style="font-size:13px;letter-spacing:1.8px;text-transform:uppercase;color:#EFEFEF;font-weight:700;">Morgendagens Maaltid</div>
          <div style="width:72px;height:3px;background:#FF1DFF;margin:14px auto 0;border-radius:999px;"></div>
        </div>
        <div style="padding:24px;">
        <h1 style="font-size:24px;margin:0 0 16px;color:#1A171B;">Thanks for your ${serviceName} request${requestId ? ` ${requestId}` : ''}</h1>
        <p style="margin:0 0 24px;color:#374151;">We have received it and will get back to you with a quote within 24 hours.</p>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;">
          <tbody>
            ${detailRows.map(([label, value]) => `
              <tr>
                <th style="text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;width:40%;">${label}</th>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#111827;">${value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${sections.join('')}
        <p style="margin:28px 0 0;color:#374151;">Best regards,<br />Morgendagens Maaltid</p>
        </div>
      </div>
    `,
  };
}

export function Booking({
  cart,
  dishes,
  onClearCart,
  initialService = 'catering',
  user = null,
  onRequireAuth,
}) {
  const [service, setService] = useState(initialService);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState(20);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');
  const [location, setLocation] = useState('Copenhagen');
  const [allergies, setAllergies] = useState('');
  const [zip, setZip] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [emailNotice, setEmailNotice] = useState('');
  const [accountNotice, setAccountNotice] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const addressRef = useRef(null);
  const selectedDishes = dishes.filter(d => cart[d.id]);
  const selectedProductIds = selectedDishes.map(d => d.id);
  const itemsTotal = dishes.reduce((sum, d) => sum + d.price * (cart[d.id]||0), 0);
  const cateringSubtotal = itemsTotal * guests;
  const cleaningHours = Math.max(2, Math.ceil(guests/2));
  const cleaningTotal = cleaningHours * 400;
  const updateGuests = (value) => {
    const nextGuests = Number(value);
    setGuests(Number.isFinite(nextGuests) ? Math.max(15, Math.floor(nextGuests)) : 15);
  };

  const submit = async (e) => {
    e.preventDefault();

    const requestEmail = (user?.email || email).trim();

    if (!startDate || !endDate || !requestEmail || !location.trim()) return;
    if (service === 'catering' && selectedProductIds.length === 0) {
      setSubmitError('Choose at least one menu item before requesting a catering quote.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setEmailNotice('');
    setAccountNotice('');

    try {
      const startDateTime = toDateTimePayload(startDate, startTime);
      const endDateTime = toDateTimePayload(endDate, endTime);
      const quoteRequest = {
        tenantId: 1,
        startDate: startDateTime,
        endDate: endDateTime,
        location: location.trim(),
        status: 1,
        type: service === 'cleaning' ? 2 : 1,
        allergies: service === 'catering' && allergies.trim() ? allergies.trim() : null,
        productInRequestIds: selectedProductIds,
        email: requestEmail,
        userEmail: requestEmail,
        weatherDTO: null,
      };
      const createdRequest = await quoteRequestApi.create(quoteRequest);

      if (createdRequest?.id && selectedDishes.length > 0) {
        await Promise.all(selectedDishes.map(d => productInRequestApi.create({
          requestId: createdRequest.id,
          productId: d.id,
          time: toTimePayload(startTime),
          amount: guests,
        })));
      }

      try {
        const confirmationEmail = buildRequestConfirmationEmail({
          service,
          createdRequest,
          startDate,
          startTime,
          endDate,
          endTime,
          location: location.trim(),
          guests,
          selectedDishes,
          cart,
          allergies,
        });

        await emailApi.send({
          to: requestEmail,
          subject: confirmationEmail.subject,
          body: confirmationEmail.body,
          html: true,
        });
      } catch (err) {
        const message = err.message ? ` ${err.message}` : '';
        setEmailNotice(`Request saved, but the confirmation email could not be sent.${message}`);
      }

      if (!user) {
        try {
          await registerAccount({
            email: requestEmail,
            password: BOOKING_USER_TEMP_PASSWORD,
          });
          setAccountNotice(`We created an account for ${requestEmail}. Temporary password: ${BOOKING_USER_TEMP_PASSWORD}`);
        } catch {
          setAccountNotice(`Request saved. ${requestEmail} may already have an account, so log in to see it in your profile.`);
          if (onRequireAuth) onRequireAuth(requestEmail);
        }
      }

      setSubmitted(true);
      setSuccessOpen(true);
      onClearCart();
      setTimeout(()=>setSubmitted(false), 4000);
    } catch (err) {
      setSubmitError(err.message || 'Could not create request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="section" id="book">
      <div className="section-eyebrow">Book it</div>
      <h2 className="section-title">Lock in a <span className="pink">date</span>.</h2>
      <p className="section-sub">No card required to request. We'll send a real quote from a real person within 24 hours.</p>
      <div className="book-grid">
        <form className="book-form" onSubmit={submit}>
          <h3>Request a quote</h3>
          <div className="sub">Free, no commitment, 24h reply.</div>

          <div className="field">
            <label>Service</label>
            <div className="segmented">
              <button type="button" className={`seg ${service==='catering'?'active':''}`} onClick={()=>setService('catering')}>Catering</button>
              <button type="button" className={`seg ${service==='cleaning'?'active':''}`} onClick={()=>setService('cleaning')}>Cleaning</button>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Date range</label>
              <Calendar
                start={startDate}
                end={endDate}
                onRangeChange={(nextStart, nextEnd) => {
                  setStartDate(nextStart);
                  setEndDate(nextEnd);
                }}
              />
            </div>
            <div>
              <div className="field">
                <label>{service==='catering'?'Guests':'Rooms / size (m²÷10)'}</label>
                <div className="guest-stepper">
                  <button type="button" onClick={()=>updateGuests(guests-1)}><Icon name="minus" size={16}/></button>
                  <input
                    className="count"
                    type="number"
                    min="15"
                    step="1"
                    inputMode="numeric"
                    value={guests}
                    onChange={e=>updateGuests(e.target.value)}
                    aria-label={service==='catering'?'Guests':'Rooms / size estimate'}
                  />
                  <button type="button" onClick={()=>updateGuests(guests+1)}><Icon name="plus" size={16}/></button>
                </div>
              </div>
              <div className="field">
                <label>Start time</label>
                <select value={startTime} onChange={e=>setStartTime(e.target.value)}>
                  {['09:00','12:00','14:00','17:00','18:00','19:00','20:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>End time</label>
                <select value={endTime} onChange={e=>setEndTime(e.target.value)}>
                  {['11:00','14:00','16:00','19:00','20:00','22:00','23:00'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Postcode</label>
                <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="2200" maxLength={4}/>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Location</label>
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Copenhagen" required/>
          </div>

          {service === 'catering' && (
            <div className="field">
              <label>Allergies / dietary notes</label>
              <textarea ref={addressRef} value={allergies} onChange={e=>setAllergies(e.target.value)} rows={2} placeholder="Two pescetarians, one gluten-free, no peanuts."/>
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={user?.email || email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@inbox.dk"
              readOnly={Boolean(user?.email)}
              required
            />
          </div>

          {submitError && <div className="form-error">{submitError}</div>}
          {emailNotice && <div className="form-error">{emailNotice}</div>}
          {accountNotice && <div className="form-success">{accountNotice}</div>}

          <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={submitting}>
            {submitting ? <>Sending...</> : submitted ? <><Icon name="check" size={18}/> Request sent</> : <>Request a quote <Icon name="arrow" size={18}/></>}
          </button>
        </form>

        <aside className="book-summary">
          <h4>Your order</h4>
          {service === 'catering' ? (
            <ul className="summary-list">
              {selectedDishes.length === 0 ? (
                <li className="cart-empty" style={{display:'block', borderBottom:'none'}}>
                  No dishes yet. Browse the menu above and tap <b>+ Add</b>.
                </li>
              ) : selectedDishes.map(d => (
                <li key={d.id}>
                  <span>{d.name} <small style={{opacity:0.5}}>× {cart[d.id]}</small></span>
                  <b>{d.price * cart[d.id]} kr/p</b>
                </li>
              ))}
              {selectedDishes.length > 0 && <>
                <li><span>Subtotal per guest</span><b>{itemsTotal} kr</b></li>
                <li><span>Guests</span><b>× {guests}</b></li>
                <li><span>Service & delivery</span><b>included</b></li>
                <li className="total"><span>Estimated total</span><b>{cateringSubtotal.toLocaleString()} kr</b></li>
              </>}
            </ul>
          ) : (
            <ul className="summary-list">
              <li><span>Deep-clean crew</span><b>400 kr/hr</b></li>
              <li><span>Estimated hours</span><b>{cleaningHours}h</b></li>
              <li><span>Products & supplies</span><b>included</b></li>
              <li><span>Travel within Cph</span><b>included</b></li>
              <li className="total"><span>Estimated total</span><b>{cleaningTotal.toLocaleString()} kr</b></li>
            </ul>
          )}
          <div style={{display:'flex', gap:10, marginTop:'auto', position:'relative'}}>
            <button type="button" className="btn btn-ghost" style={{flex:1, justifyContent:'center', fontSize:13, padding:'12px 16px'}} onClick={onClearCart}>
              Clear
            </button>
          </div>
          <div style={{marginTop:18, fontSize:12, opacity:0.6, fontWeight:500, position:'relative'}}>
            * Prices indicative. Final quote includes any custom asks.
          </div>
        </aside>
      </div>
      </section>

      {successOpen && (
        <div className="booking-success-shell" role="dialog" aria-modal="true" aria-labelledby="booking-success-title">
          <button
            className="booking-success-backdrop"
            type="button"
            aria-label="Close request confirmation"
            onClick={() => setSuccessOpen(false)}
          />
          <div className="booking-success-modal">
            <div className="booking-success-mark">
              <Icon name="check" size={30} />
            </div>
            <div>
              <div className="section-eyebrow">Request sent</div>
              <h2 id="booking-success-title">We received your request.</h2>
              <p>
                We will get back to you with a quote within 24 hours. A confirmation email has been sent
                to {user?.email || email}.
              </p>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => setSuccessOpen(false)}>
              Got it <Icon name="check" size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

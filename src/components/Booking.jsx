import { useRef, useState } from 'react';
import { productInRequestApi, quoteRequestApi } from '../api/requests.js';
import { toDateTimePayload, toTimePayload } from '../lib/datetime.js';
import { Calendar } from './Calendar.jsx';
import { Icon } from './Icon.jsx';

export function Booking({ cart, dishes, onClearCart, initialService = 'catering' }) {
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

  const addressRef = useRef(null);
  const selectedDishes = dishes.filter(d => cart[d.id]);
  const selectedProductIds = selectedDishes.map(d => d.id);
  const itemsTotal = dishes.reduce((sum, d) => sum + d.price * (cart[d.id]||0), 0);
  const cateringSubtotal = itemsTotal * guests;
  const cleaningHours = Math.max(2, Math.ceil(guests/2));
  const cleaningTotal = cleaningHours * 400;

  const submit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !email || !location.trim()) return;
    if (service === 'catering' && selectedProductIds.length === 0) {
      setSubmitError('Choose at least one menu item before requesting a catering quote.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const quoteRequest = {
        tenantId: 1,
        startDate: toDateTimePayload(startDate, startTime),
        endDate: toDateTimePayload(endDate, endTime),
        location: location.trim(),
        status: 1,
        type: service === 'cleaning' ? 2 : 1,
        allergies: service === 'catering' && allergies.trim() ? allergies.trim() : null,
        productInRequestIds: selectedProductIds,
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

      setSubmitted(true);
      onClearCart();
      setTimeout(()=>setSubmitted(false), 4000);
    } catch (err) {
      setSubmitError(err.message || 'Could not create request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
                  <button type="button" onClick={()=>setGuests(Math.max(2, guests-2))}><Icon name="minus" size={16}/></button>
                  <div className="count">{guests}</div>
                  <button type="button" onClick={()=>setGuests(guests+2)}><Icon name="plus" size={16}/></button>
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
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@inbox.dk" required/>
          </div>

          {submitError && <div className="form-error">{submitError}</div>}

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
  );
}

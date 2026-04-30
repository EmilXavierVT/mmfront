import { Icon } from './Icon.jsx';
import { Booking } from './Booking.jsx';
import { Menu } from './Menu.jsx';
import prepBowlsUrl from '../assets/IMG_3653.webp';
import eventRoomUrl from '../assets/IMG_1313.webp';
import kitchenCrewUrl from '../assets/IMG_3682.webp';
import pastryPlatesUrl from '../assets/IMG_0561.webp';
import sildHeroUrl from '../assets/SILD_20311.webp';
import sildTomatoUrl from '../assets/SILD_20465.webp';
import sildWholeUrl from '../assets/SILD_20277.webp';
import sildAsparagusUrl from '../assets/SILD_20496.webp';
import sildBreadUrl from '../assets/SILD_20420.webp';

const formats = [
  {
    title: 'Dinner parties',
    body: 'Shared plates, plated courses, late snacks, and the calm feeling that someone else has the timing.',
    meta: '10-60 guests',
  },
  {
    title: 'Company days',
    body: 'Lunches, receptions, launches, workshops, and sturdy food that does not taste like a spreadsheet.',
    meta: '20-200 guests',
  },
  {
    title: 'Big moments',
    body: 'Weddings, birthdays, confirmations, and long-table evenings built around the room, not a fixed template.',
    meta: 'Custom menus',
  },
];

const sildPhotos = [
  { src: sildTomatoUrl, alt: 'Sild served with tomato, peppers, and bread' },
  { src: sildWholeUrl, alt: 'Whole grilled sild plated with potatoes and tomatoes' },
  { src: sildAsparagusUrl, alt: 'Sild with white asparagus, herbs, and green oil' },
  { src: sildBreadUrl, alt: 'Sild served with bread and herbs' },
];

export function Catering({
  cart,
  dishes,
  products,
  loading,
  error,
  user,
  onAdd,
  onRetry,
  onClearCart,
  onBook,
  onRequireAuth,
}) {
  return (
    <main className="catering-page">
      <section className="catering-hero">
        <img src={sildHeroUrl} alt="Sild plated with rice, shiso, and herbs" />
        <div className="catering-hero-overlay" />
        <div className="catering-hero-copy">
          <div className="hero-eyebrow"><span className="dot" />Catering in Copenhagen</div>
          <h1>Catering that feels cooked, not copied.</h1>
          <p>
            Seasonal food for dinners, offices, launches, weddings, and nights where the table needs
            to do more than behave.
          </p>
          <div className="catering-actions">
            <button className="btn btn-primary" type="button" onClick={onBook}>
              Build a menu <Icon name="arrow" size={18} />
            </button>
            <a className="btn btn-ghost" href="mailto:emil@morgendagensmaaltid.dk">
              Talk to a human
            </a>
          </div>
        </div>
       
      </section>

      <section className="section catering-intro">
        <div>
          <div className="section-eyebrow">What we cater</div>
          <h2 className="section-title">Menus for rooms with <span className="pink">pulse</span>.</h2>
        </div>
        <p>
          We build every quote around the event: time of day, headcount, dietary notes, venue limits,
          and how much hosting you actually want to do yourself.
        </p>
      </section>

      <section className="catering-formats" aria-label="Catering formats">
        {formats.map((format, index) => (
          <article className="catering-format" key={format.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{format.title}</h3>
            <p>{format.body}</p>
            <strong>{format.meta}</strong>
          </article>
        ))}
      </section>

      <section className="catering-image-band" aria-label="Catering kitchen and events">
        <img src={prepBowlsUrl} alt="Prepared dishes lined up before service" />
        <img src={eventRoomUrl} alt="A bright dining room prepared for a catered event" />
        <img src={kitchenCrewUrl} alt="Kitchen crew preparing food before service" />
        <img src={pastryPlatesUrl} alt="Desserts plated for a catered event" />
      </section>

      <section className="section catering-sild">
        <div className="section-eyebrow">From the table</div>
        <h2 className="section-title">Sild with a <span className="pink">point</span> of view.</h2>
        <p className="section-sub">Clean, seasonal plates that can sit inside a larger menu or lead the whole lunch.</p>
        <div className="sild-grid">
          {sildPhotos.map((photo) => (
            <img src={photo.src} alt={photo.alt} key={photo.src} />
          ))}
        </div>
      </section>

      <Menu
        cart={cart}
        products={products}
        loading={loading}
        error={error}
        onAdd={onAdd}
        onRetry={onRetry}
      />

      <Booking
        cart={cart}
        dishes={dishes}
        user={user}
        onClearCart={onClearCart}
        onRequireAuth={onRequireAuth}
      />
    </main>
  );
}

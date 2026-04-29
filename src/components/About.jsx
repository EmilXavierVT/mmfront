import { Icon } from './Icon.jsx';
import platedSpreadUrl from '../assets/IMG_1415.webp';
import venueTableUrl from '../assets/IMG_0232.webp';
import prepBowlsUrl from '../assets/IMG_3653.webp';
import kitchenCrewUrl from '../assets/IMG_3682.webp';
import eventRoomUrl from '../assets/IMG_1313.webp';
import pastryPlatesUrl from '../assets/IMG_0561.webp';
import dinnerTableUrl from '../assets/IMG_7325.webp';
import portraitDishUrl from '../assets/IMG_5542.webp';
import portraitPrepUrl from '../assets/IMG_5190.webp';
import earlyKitchenUrl from '../assets/154316603_128326595865464_1268109346495848041_n.webp';
import tableMomentUrl from '../assets/IMG_0475.webp';
import holidayPrepUrl from '../assets/IMG_4605.webp';
import portraitServiceUrl from '../assets/IMG_3026.webp';

const values = [
  {
    title: 'Local by default',
    body: 'Menus are built around Copenhagen suppliers, seasonal produce, and a bias for things that taste alive.',
  },
  {
    title: 'Human first',
    body: 'Every quote is checked by a real person, so allergies, timing, stairs, and tiny event details get handled properly.',
  },
  {
    title: 'Less waste',
    body: 'Plant-forward food, compostable packaging, refillable cleaning products, and crews trained to leave less behind.',
  },
];

const stats = [
  ['2021', 'Started in Copenhagen'],
  ['24h', 'Quote reply target'],
  ['0', 'Single-use plastic goal'],
];

const photoWall = [
  { src: pastryPlatesUrl, alt: 'Desserts plated for service' },
  { src: dinnerTableUrl, alt: 'Guests eating around a candlelit dinner table' },
  { src: portraitDishUrl, alt: 'A finished dish photographed close up' },
  { src: portraitPrepUrl, alt: 'Kitchen prep photographed before service' },
  { src: earlyKitchenUrl, alt: 'A Morgendagens Maaltid kitchen moment' },
  { src: tableMomentUrl, alt: 'A catered table setting with shared food' },
  { src: holidayPrepUrl, alt: 'Holiday food prepared for service' },
  { src: portraitServiceUrl, alt: 'Service prep in the kitchen' },
];

export function About({ onBook }) {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="section-eyebrow">About us</div>
          <h1>Food, cleaning, and the strange joy of doing things properly.</h1>
          <p>
            Morgendagens Maaltid is a Copenhagen service company for people who want the party fed,
            the home reset, and the whole thing handled with taste, care, and a little backbone.
          </p>
          <div className="about-actions">
            <button className="btn btn-primary" type="button" onClick={() => onBook('catering')}>
              Book catering <Icon name="arrow" size={18} />
            </button>
            <button className="btn btn-blue" type="button" onClick={() => onBook('cleaning')}>
              Book cleaning <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
        <div className="about-hero-media" aria-label="Morgendagens Maaltid catering and cleaning">
          <img src={platedSpreadUrl} alt="Rows of plated dishes prepared for a Morgendagens Maaltid event" />
          <img src={venueTableUrl} alt="A long event table set for dinner in Copenhagen" />
          <div className="about-stamp">Built in<br />København</div>
        </div>
      </section>

      <section className="about-strip" aria-label="Company highlights">
        {stats.map(([number, label]) => (
          <div className="about-stat" key={label}>
            <strong>{number}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="section about-story">
        <div>
          <div className="section-eyebrow">The idea</div>
          <h2 className="section-title">Tomorrow should taste <span className="pink">better</span>.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            We started with a simple frustration: everyday service had become too anonymous. Catering
            could feel generic. Cleaning could feel rushed. So we built one place for both, with the
            same standard across every booking.
          </p>
          <p>
            That standard is practical. Clear prices. Seasonal food. Allergy-aware planning.
            Eco-certified products. Vetted people. Fast replies. No theatrical fuss when the work
            itself can be excellent.
          </p>
        </div>
      </section>

      <section className="about-gallery" aria-label="Morgendagens Maaltid events and kitchen">
        <img src={prepBowlsUrl} alt="Prepared small dishes lined up in the kitchen" />
        <img src={eventRoomUrl} alt="A bright dining room prepared for a catered event" />
        <img src={kitchenCrewUrl} alt="Kitchen crew preparing fish before service" />
      </section>

      <section className="section">
        <div className="section-eyebrow">What we care about</div>
        <h2 className="section-title">Small details, loud <span className="blue">standards</span>.</h2>
        <div className="about-values">
          {values.map((value, index) => (
            <article className="about-value" key={value.title}>
              <div className="num">{String(index + 1).padStart(2, '0')}</div>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-photo-wall" aria-label="More Morgendagens Maaltid photos">
        {photoWall.map((photo, index) => (
          <img src={photo.src} alt={photo.alt} key={photo.src} className={`photo-${index + 1}`} />
        ))}
      </section>

      <section className="about-note">
        <h2>We are not trying to be the biggest.</h2>
        <p>
          We are trying to be the company people remember because the food landed, the room worked,
          the home felt lighter, and no one had to chase us twice.
        </p>
      </section>
    </main>
  );
}

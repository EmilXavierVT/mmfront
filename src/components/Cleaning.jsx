import { Booking } from './Booking.jsx';
import { Icon } from './Icon.jsx';
import cleaningHeroUrl from '../assets/cleaning-hero.jpg';

const services = [
  {
    title: 'Weekly reset',
    body: 'Kitchen, bathrooms, floors, surfaces, and the invisible maintenance that keeps a home from drifting.',
    meta: 'Recurring',
  },
  {
    title: 'Deep clean',
    body: 'The corners, buildup, oven, fridge, limescale, baseboards, and everything that needs more than a quick pass.',
    meta: 'One-off',
  },
  {
    title: 'Post-event',
    body: 'After dinner, launch, birthday, or house party. We restore the room while you keep the good parts.',
    meta: 'Same-week',
  },
];

const standards = ['Eco-certified products', 'Vetted crews', 'Own tools', 'Copenhagen-based'];

export function Cleaning({ products, loading, error, onRetry, onBook, onClearCart }) {
  return (
    <main className="cleaning-page">
      <section className="cleaning-hero">
        <div className="cleaning-hero-copy">
          <div className="hero-eyebrow"><span className="dot" />Cleaning in Copenhagen</div>
          <h1>Homes that feel reset, not just wiped.</h1>
          <p>
            Eco-minded cleaning for apartments, houses, offices, move-outs, and post-event mornings
            where yesterday should not still be on the floor.
          </p>
          <div className="cleaning-actions">
            <button className="btn btn-blue" type="button" onClick={onBook}>
              Book a crew <Icon name="arrow" size={18} />
            </button>
            <a className="btn btn-ghost" href="mailto:emil@morgendagensmaaltid.dk">
              Talk to a human
            </a>
          </div>
        </div>
        <div className="cleaning-hero-media">
          <img src={cleaningHeroUrl} alt="A clean, bright home interior" />
          <div className="cleaning-stamp">From<br />400 kr<br />/hr</div>
        </div>
      </section>

      <section className="cleaning-standards" aria-label="Cleaning standards">
        {standards.map((standard) => (
          <span key={standard}>{standard}</span>
        ))}
      </section>

      <section className="section cleaning-intro">
        <div>
          <div className="section-eyebrow">What we clean</div>
          <h2 className="section-title">Sharp crews, soft <span className="blue">products</span>.</h2>
        </div>
        <p>
          Tell us the size, postcode, timing, and what needs attention. We match the job with a crew,
          bring the products, and send a clear quote before anyone starts moving furniture.
        </p>
      </section>

      <section className="cleaning-services" aria-label="Cleaning service types">
        {services.map((service, index) => (
          <article className="cleaning-service" key={service.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{service.title}</h3>
            <p>{service.body}</p>
            <strong>{service.meta}</strong>
          </article>
        ))}
      </section>

      <section className="section cleaning-products">
        <div className="section-eyebrow">Cleaning plans</div>
        <h2 className="section-title">Pick the <span className="pink">level</span>.</h2>
        <p className="section-sub">Cleaning-only products live here, away from the catering menu.</p>

        {loading && <div className="menu-state">Loading cleaning plans...</div>}
        {error && (
          <div className="menu-state error">
            <span>{error}</span>
            <button type="button" onClick={onRetry}>Retry</button>
          </div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="menu-state">No cleaning plans available yet.</div>
        )}
        {products.length > 0 && (
          <div className="cleaning-product-grid">
            {products.map((product) => (
              <article className="cleaning-product" key={product.id}>
                <h3>{product.name}</h3>
                <p>{product.desc || 'Custom cleaning plan quoted around the size and state of the space.'}</p>
                <strong>{product.price} kr</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <Booking cart={{}} dishes={[]} onClearCart={onClearCart} initialService="cleaning" />
    </main>
  );
}

import { Icon } from './Icon.jsx';
import heroCoverUrl from '../assets/hero-cover.jpg';
import cateringHeroUrl from '../assets/catering-hero.jpg';
import cleaningHeroUrl from '../assets/cleaning-hero.jpg';

const HERO_IMAGES = {
  'hero-cover.jpg': heroCoverUrl,
  'catering-hero.jpg': cateringHeroUrl,
  'cleaning-hero.jpg': cleaningHeroUrl,
};

export function Hero({ tweaks, onBook }) {
  const variants = {
    bold: {
      eyebrow: 'Now booking — Apr & May',
      title: <>Feed the <span className="pink">rebellion.</span><br/><span className="underline-mark">Clean</span> the rest.</>,
    },
    warm: {
      eyebrow: 'Family-run since 2019',
      title: <>Real food.<br/>Real clean.<br/><span className="pink">No compromise.</span></>,
    },
    punchy: {
      eyebrow: 'Local · Sustainable · Loud',
      title: <>Catering with <span className="pink">attitude.</span><br/>Cleaning with <span className="underline-mark">conscience.</span></>,
    },
  };
  const v = variants[tweaks.heroVariant] || variants.bold;
  const heroImageUrl = HERO_IMAGES[tweaks.heroImage] || heroCoverUrl;

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroImageUrl})` }}>
      <div className="hero-content">
        <div>
          <div className="hero-eyebrow"><span className="dot"/>{v.eyebrow}</div>
        </div>
        <div>
          <h1 className="hero-title">{v.title}</h1>
          <div className="hero-bottom" style={{marginTop: 24}}>
            <div className="hero-cta-row">
              <button className="btn btn-primary" onClick={()=>onBook('catering')}>
                Book catering <Icon name="arrow" size={18}/>
              </button>
              <button className="btn btn-blue" onClick={()=>onBook('cleaning')}>
                Book cleaning <Icon name="arrow" size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

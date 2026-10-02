import { Icon } from '../Shared/Icon.jsx';
import heroCoverUrl from '../../assets/hero-cover.webp';
import cateringHeroUrl from '../../assets/catering-hero.webp';
import cleaningHeroUrl from '../../assets/cleaning-hero.webp';

const HERO_IMAGES = {
  'hero-cover.webp': heroCoverUrl,
  'catering-hero.webp': cateringHeroUrl,
  'cleaning-hero.webp': cleaningHeroUrl,
};

export function Hero({ tweaks, onBook }) {
  const variants = {
    bold: {
      eyebrow: 'Now booking — Apr & May',
      title: <>Food for <span className="pink">tomorrow.</span><br/><span className="underline-mark">Clean</span> spaces after.</>,
    },
    warm: {
      eyebrow: 'Family-run since 2019',
      title: <>Real food.<br/>Real clean.<br/><span className="pink">No compromise.</span></>,
    },
    punchy: {
      eyebrow: 'Local · Sustainable · Thoughtful',
      title: <>Catering with <span className="pink">character.</span><br/>Cleaning with <span className="underline-mark">care.</span></>,
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
              <button type="button" className="btn btn-primary" onClick={()=>onBook('catering')}>
                Book catering <Icon name="arrow" size={18}/>
              </button>
              <button type="button" className="btn btn-blue" onClick={()=>onBook('cleaning')}>
                Book cleaning <Icon name="arrow" size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

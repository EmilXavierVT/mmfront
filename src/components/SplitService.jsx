import { Icon } from './Icon.jsx';
import cateringHeroUrl from '../assets/catering-hero.jpg';
import cleaningHeroUrl from '../assets/cleaning-hero.jpg';

export function SplitService({ onBook }) {
  return (
    <section className="section">
      <div className="section-eyebrow">What we do</div>
      <h2 className="section-title">Pick your <span className="pink">poison</span>.</h2>
      <p className="section-sub">Two services. Same obsession with doing the small things radically well.</p>
      <div className="split">
        <div className="split-card" onClick={()=>onBook('catering')}>
          <div className="img" style={{backgroundImage:`url(${cateringHeroUrl})`}}/>
          <div className="veil"/>
          <div className="stone-mark">From<br/>89 kr<br/>/pers</div>
          <div className="body">
            <h3>Catering.</h3>
            <p className="lede">Allergy-aware menus, seasonal Nordic ingredients, plant-forward by default. Built for parties of 10–200.</p>
            <div className="row">
              <button className="btn btn-primary">Build a menu <Icon name="arrow" size={16}/></button>
              <span className="price">Avg. ticket <b>4 200 kr</b></span>
            </div>
          </div>
        </div>
        <div className="split-card cleaning" onClick={()=>onBook('cleaning')}>
          <div className="img" style={{backgroundImage:`url(${cleaningHeroUrl})`}}/>
          <div className="veil"/>
          <div className="stone-mark">From<br/>400 kr<br/>/hr</div>
          <div className="body">
            <h3>Cleaning.</h3>
            <p className="lede">Eco-certified products, vetted crews, weekly or one-off. Move-out, deep, post-event — pick your level.</p>
            <div className="row">
              <button className="btn btn-blue">Book a crew <Icon name="arrow" size={16}/></button>
              <span className="price">Same-week <b>availability</b></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

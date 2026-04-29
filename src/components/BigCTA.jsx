import { Icon } from './Icon.jsx';

export function BigCTA({ onBook }) {
  return (
    <section className="big-cta">
      <div className="big-cta-inner">
        <h2>Got a date?<br/>We've got the rest.</h2>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          <button className="btn btn-cream" onClick={onBook}>Start a booking <Icon name="arrow" size={18}/></button>
          <button className="btn btn-ghost" style={{borderColor:'#fff', color:'#fff'}}>Talk to a human</button>
        </div>
      </div>
    </section>
  );
}

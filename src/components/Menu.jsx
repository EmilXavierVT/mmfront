import { useMemo, useState } from 'react';
import { PRODUCT_TYPE_LABELS } from '../lib/products.js';

export function Menu({ cart, products, loading, error, onAdd, onRetry }) {
  const groups = useMemo(() => {
    return products.reduce((acc, product) => {
      const label = PRODUCT_TYPE_LABELS[product.type] || `Type ${product.type ?? 'other'}`;
      acc[label] = [...(acc[label] || []), product];
      return acc;
    }, {});
  }, [products]);
  const tabs = Object.keys(groups);
  const [tab, setTab] = useState('');
  const activeTab = tabs.includes(tab) ? tab : tabs[0] || '';
  const items = groups[activeTab] || [];

  return (
    <section className="section">
      <div className="section-eyebrow">The Menu</div>
      <h2 className="section-title">Built for <span className="pink">opinionated</span> eaters.</h2>
      <p className="section-sub">Our stables. Here to STAY. Allergies and swaps are the rule, not the exception — just tell us.</p>
      {loading && <div className="menu-state">Loading menu...</div>}
      {error && (
        <div className="menu-state error">
          <span>{error}</span>
          <button type="button" onClick={onRetry}>Retry</button>
        </div>
      )}
      {!loading && !error && tabs.length === 0 && (
        <div className="menu-state">No products available yet.</div>
      )}
      {tabs.length > 0 && (
        <div className="menu-tabs">
          {tabs.map(k => (
            <button key={k} className={`menu-tab ${activeTab===k?'active':''}`} onClick={()=>setTab(k)}>{k}</button>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="menu-grid">
          {items.map(d => {
            const inCart = cart[d.id] > 0;
            return (
              <div className="dish" key={d.id} onClick={()=>onAdd(d)}>
                <div className="swatch">
                  <div className="blob" style={{background: d.color}}>
                    {d.name.split(' ')[0].slice(0,1).toUpperCase()}
                  </div>
                </div>
                <div className="body">
                  <h5>{d.name}</h5>
                  <p className="desc">{d.desc}</p>
                  <div className="tags">
                    {d.tags.map(t => <span key={t} className={`tag ${t}`}>{t}</span>)}
                  </div>
                  <div className="meta">
                    <div className="price">{d.price} kr <small>/ pers</small></div>
                    <button className={`add ${inCart?'added':''}`} onClick={(e)=>{e.stopPropagation(); onAdd(d);}}>
                      {inCart ? `× ${cart[d.id]} added` : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

import { useRef, useState } from 'react';
import { searchYouthProducts } from '../../lib/youthIsland.js';

export function ProductPicker({ id, products, value, selectedName, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const matches = searchYouthProducts(products, query);
  const active = Math.min(activeIndex, matches.length - 1);
  const selected = products.find(product => product.economicProductNumber === value);

  function choose(product) {
    onChange(product.economicProductNumber);
    inputRef.current.setCustomValidity('');
    setOpen(false);
    setQuery('');
  }

  function moveActive(index) {
    const next = Math.max(0, Math.min(index, matches.length - 1));
    setActiveIndex(next);
    document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: 'nearest' });
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      moveActive(open ? active + (event.key === 'ArrowDown' ? 1 : -1) : 0);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (matches[active]) choose(matches[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="youth-product-picker">
      <label htmlFor={id}>e-conomic produkt</label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        aria-activedescendant={open && matches[active] ? `${id}-option-${active}` : undefined}
        autoComplete="off"
        placeholder={disabled ? 'Henter produkter...' : 'Søg efter produktnavn eller nummer'}
        value={open ? query : selected?.name || selectedName || ''}
        disabled={disabled}
        required
        onFocus={() => {
          setOpen(true);
          setQuery('');
          setActiveIndex(0);
        }}
        onChange={event => {
          setQuery(event.target.value);
          setActiveIndex(0);
          inputRef.current.setCustomValidity('Vælg et produkt fra listen.');
          onChange('');
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      {open && (
        <ul id={`${id}-options`} className="youth-product-options" role="listbox" aria-label="Produkter">
          {matches.map((product, index) => (
            <li key={product.economicProductNumber} role="presentation">
              <button
                id={`${id}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === active}
                tabIndex={-1}
                onPointerDown={event => event.preventDefault()}
                onClick={() => choose(product)}
              >
                <span>{product.name}</span>
                <small>#{product.economicProductNumber}</small>
              </button>
            </li>
          ))}
          {!matches.length && <li className="youth-product-no-results" role="presentation">Ingen produkter matcher din søgning.</li>}
        </ul>
      )}
    </div>
  );
}

export function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/></>,
    cart: <><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h3l2.4 12h11l2-8H7"/></>,
    chev: <path d="M9 6l6 6-6 6"/>,
    chevUp: <path d="m18 15-6-6-6 6"/>,
    chevL: <path d="M15 6l-6 6 6 6"/>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    check: <path d="M5 12l5 5L20 7"/>,
    fork: <><path d="M5 3v8a3 3 0 003 3v7"/><path d="M9 3v6"/><path d="M16 3c-1 3-1 6 0 9v9"/></>,
    spray: <><rect x="9" y="9" width="9" height="12" rx="1"/><path d="M9 9V5h6"/><path d="M4 7c2-2 4-2 6 0M4 11c2-2 4-2 6 0"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export function Footer({ onNav }) {
  const navigate = (event, page) => {
    event.preventDefault();
    onNav(page);
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="brand">MORGENDAGENS<br/>MÅLTID</div>
          <div className="tag">Hyper-niche catering & radically clean homes — built in Copenhagen, fed by the rebellion.</div>
        </div>
        <div>
          <h6>Services</h6>
          <ul>
            <li><a className="footer-link" href="/catering" onClick={(event) => navigate(event, 'catering')}>Catering</a></li>
            <li><a className="footer-link" href="/cleaning" onClick={(event) => navigate(event, 'cleaning')}>Cleaning</a></li>
            <li>Recurring plans</li>
            <li>Corporate</li>
          </ul>
        </div>
        <div>
          <h6>Company</h6>
          <ul>
            <li><a className="footer-link" href="/about" onClick={(event) => navigate(event, 'about')}>About</a></li>
            <li>Sustainability</li>
            <li>Press</li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <h6>Contact</h6>
          <ul>
            <li>emil@morgendagensmaaltid.dk</li>
            <li>+45 27 82 88 67</li>
            <li>Bremmensgade 10</li>
            <li>2300 København </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div>CVR 46 16 41 64 · © 2026 Morgendagens Maaltid</div>
        <div>Eco-certified · Local-sourced · Loud</div>
      </div>
    </footer>
  );
}

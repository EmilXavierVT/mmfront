import { Link } from 'react-router-dom';

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
            <li><Link className="footer-link" to="/catering" onClick={(event) => navigate(event, 'catering')}>Catering</Link></li>
            <li><Link className="footer-link" to="/cleaning" onClick={(event) => navigate(event, 'cleaning')}>Cleaning</Link></li>
            <li>Recurring plans</li>
            <li>Corporate</li>
          </ul>
        </div>
        <div>
          <h6>Company</h6>
          <ul>
            <li><Link className="footer-link" to="/about" onClick={(event) => navigate(event, 'about')}>About</Link></li>
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

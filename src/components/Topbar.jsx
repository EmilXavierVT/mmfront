import { Icon } from './Icon.jsx';

export function Topbar({ active, onNav, user, isAdmin = false, onAccount }) {
  return (
    <header className="topbar">
      <div className="nav-left">
        <button className="icon-btn" onClick={() => onNav('home')} aria-label="Home"><Icon name="home" /></button>
        <button className={`nav-link ${active==='catering'?'active':''}`} onClick={()=>onNav('catering')}>
          <Icon name="fork" size={16}/><span>Catering</span>
        </button>
        <button className={`nav-link ${active==='cleaning'?'active':''}`} onClick={()=>onNav('cleaning')}>
          <Icon name="spray" size={16}/><span>Cleaning</span>
        </button>
        {isAdmin && (
          <button className={`nav-link ${active==='admin'?'active':''}`} onClick={()=>onNav('admin')}>
            <Icon name="user" size={16}/><span>Admin</span>
          </button>
        )}
      </div>
      <button
        className={`brand-mark ${active === 'about' ? 'active' : ''}`}
        type="button"
        onClick={() => onNav('about')}
        aria-label="About Morgendagens Måltid"
      >
        <span className="brand-wordmark">MORGENDAGENS<br/>MÅLTID</span>
        <svg className="brand-mobile-mark" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M72.4649 18.1727C76.5256 13.0209 87.4918 21.9996 86.9431 27.2562C86.3626 32.8358 72.3693 49.9003 69.9676 56.4761C66.7596 59.2221 56.442 54.6803 56.7214 50.1616C56.8314 48.3859 70.926 20.1221 72.4634 18.1727H72.4649Z" fill="#FF1DFF"/>
          <path d="M65.4291 8.40591C73.8372 14.6429 63.5457 20.91 62.3007 28.4188C59.1824 25.0082 53.7623 23.3072 47.8789 20.7837C50.9277 11.139 53.5162 -0.432112 65.4291 8.40591Z" fill="#FF1DFF"/>
          <path d="M26.6982 11.1003C28.1589 -2.49334 37.7034 -2.50482 46.9034 5.16044L42.1058 19.5909C38.1725 18.3622 26.2002 15.7296 26.6982 11.0989V11.1003Z" fill="#FF1DFF"/>
          <path d="M38.2201 97.1995C30.2594 95.6521 25.5182 94.2181 23.6145 91.1692C15.1065 77.5383 7.51055 61.7398 0 47.4801L20.974 15.5674L56.0295 28.8223C57.5162 29.5558 57.8029 30.4658 57.3787 31.4807C50.2127 46.0777 36.7015 40.7824 24.4513 37.1722L30.7617 43.8585L23.4104 52.6405C35.5521 47.5935 39.7938 59.2278 45.8031 67.1012L46.8179 64.0293C54.4428 74.32 58.88 100.105 38.2172 97.1995H38.2201Z" fill="#FF1DFF"/>
          <path d="M78.1081 99.9972C63.3201 95.3104 57.7161 95.8157 55.7994 78.856C55.2797 74.2525 58.246 82.7431 58.8077 81.5575C58.2358 71.8912 53.305 63.1207 47.3638 55.7597C53.2602 54.8913 55.9963 60.3158 61.8825 61.4886C65.2368 62.1575 68.9704 61.3795 71.6297 62.1503C75.2012 63.1867 80.614 72.3778 87.6773 66.7954C89.636 65.2465 91.1604 59.9584 94.215 58.8488C93.8574 73.9511 87.9378 88.6371 78.1096 100L78.1081 99.9972Z" fill="#FF1DFF"/>
          <path d="M99.9174 42.4446C99.6887 43.7035 86.8116 63.1509 85.6983 63.7997C82.0096 65.9485 74.169 59.7489 74.9363 55.6679C75.233 54.086 87.6208 33.72 88.9845 32.4898C94.4423 27.5691 100.8 37.5742 99.9174 42.4432V42.4446Z" fill="#FF1DFF"/>
        </svg>
      </button>
      <div className="nav-right">
        {user ? (
          <button className={`account-pill ${active === 'profile' ? 'active' : ''}`} type="button" onClick={() => onNav('profile')} aria-label="Profile">
            <span>{user.email}</span>
            <Icon name="user" size={17} />
          </button>
        ) : (
          <button className="icon-btn" type="button" aria-label="Account" onClick={onAccount}><Icon name="user" /></button>
        )}
      </div>
    </header>
  );
}

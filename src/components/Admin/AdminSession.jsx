import { Icon } from '../Icon.jsx';

export function AdminSession({ user, onLogout }) {
  return (
    <section className="admin-logout-panel">
      <div>
        <span>Session</span>
        <p>{user?.email}</p>
      </div>
      <button className="btn btn-cream" type="button" onClick={onLogout}>
        Log out <Icon name="logout" size={18} />
      </button>
    </section>
  );
}

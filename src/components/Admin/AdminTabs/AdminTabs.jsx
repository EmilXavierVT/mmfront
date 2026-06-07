const adminTabs = [
  ['requests', 'Requests'],
  ['products', 'Products'],
  ['calendar', 'Calendar'],
  ['users', 'Users'],
  ['email', 'Email'],
  ['history', 'History'],
];

export function AdminTabs({ adminTab, onTabChange }) {
  return (
    <div className="admin-tabs" role="tablist" aria-label="Admin sections">
      {adminTabs.map(([value, label]) => (
        <button
          className={`admin-tab ${adminTab === value ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={adminTab === value}
          onClick={() => onTabChange(value)}
          key={value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

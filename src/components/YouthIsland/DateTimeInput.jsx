import { useRef } from 'react';
import { Icon } from '../Shared/Icon.jsx';

export function DateTimeInput({ id, value, onChange, label, required = false }) {
  const inputRef = useRef(null);
  return (
    <div className="youth-datetime-control">
      <input
        ref={inputRef}
        id={id}
        type="datetime-local"
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
      />
      <button
        className="youth-datetime-picker"
        type="button"
        aria-label={`Vælg ${label.toLocaleLowerCase('da')}`}
        onClick={() => {
          const input = inputRef.current;
          input.focus();
          try {
            input.showPicker?.();
          } catch {
            // The input remains editable in browsers without a supported native picker.
          }
        }}
      >
        <Icon name="calendar" size={18} />
      </button>
    </div>
  );
}

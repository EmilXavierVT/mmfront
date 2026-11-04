import { useState } from 'react';
import { youthIslandBookingApi } from '../../api/youthIslandBookings.js';
import { buildYouthOrderSheet } from '../../lib/youthIslandOrder.js';
import { YouthOrderSheet } from './YouthOrderSheet.jsx';

function localDateTime(value) {
  if (!value) return 'Ikke angivet';
  const [date, time] = String(value).split('T');
  return `${date.split('-').reverse().join('.')}${time ? ` kl. ${time.slice(0, 5)}` : ''}`;
}

function recordedTime(edit) {
  return edit.recordedAt
    ? new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Copenhagen' }).format(new Date(edit.recordedAt))
    : localDateTime(edit.editedAt);
}

function displayValue(value, field) {
  if (value == null || value === '') return 'Ikke angivet';
  if (typeof value === 'object') {
    return [
      `${value.productName} (${value.productNumber})`,
      `${value.guestCount} personer · ${localDateTime(value.servingDateTime)}`,
      value.menu ? `Menu: ${value.menu}` : '',
      value.room ? `Lokale: ${value.room}` : '',
      value.unitPriceOverride != null ? `Pris: ${displayValue(value.unitPriceOverride, 'unitPriceOverride')}` : '',
    ].filter(Boolean).join('\n');
  }
  if (['startDateTime', 'endDateTime', 'servingDateTime', 'orderDate'].includes(field)) return localDateTime(value);
  if (field === 'unitPriceOverride') return `${Number(value).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr.`;
  return String(value);
}

function servingContext(edit, change) {
  if (!change.itemId) return '';
  const item = [...(edit.afterSnapshot?.items || []), ...(edit.beforeSnapshot?.items || [])]
    .find(item => item.id === change.itemId);
  return `${change.itemName}${item ? ` · ${localDateTime(item.servingDateTime)}` : ''}`;
}

export function BookingHistory({ booking }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await youthIslandBookingApi.getHistory(booking.id);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Historikken kunne ikke hentes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="youth-booking-audit" onToggle={event => {
      if (event.target === event.currentTarget && event.currentTarget.open && history === null && !loading) load();
    }}>
      <summary>Ændringshistorik · version {booking.version || (booking.editHistory?.length || 0) + 1}</summary>
      <div className="youth-audit-content">
        {loading && <p>Henter historik...</p>}
        {error && <div className="form-error" role="alert">{error} <button className="btn btn-cream" type="button" onClick={load}>Prøv igen</button></div>}
        {!loading && history?.length === 0 && <p>Bestillingen er ikke redigeret endnu.</p>}
        {history && [...history].reverse().map((edit, index) => (
          <details className="youth-audit-entry" key={edit.id} open={index === 0}>
            <summary>
              <strong>Version {edit.version} · {edit.editedByName || edit.editedByEmail}</strong>
              <time dateTime={edit.recordedAt || edit.editedAt}>{recordedTime(edit)}</time>
            </summary>
            <div className="youth-audit-entry-body">
              <p className="youth-audit-person">{edit.editedByEmail}</p>
              {!edit.detailsAvailable && <p>For denne tidligere redigering blev kun person og tidspunkt gemt. Ændringsdetaljer er ikke tilgængelige.</p>}
              {edit.detailsAvailable && !edit.changes?.length && <p>Gemt uden ændringer i indholdet.</p>}
              {!!edit.changes?.length && (
                <div className="youth-audit-table-wrap">
                  <table className="youth-audit-table">
                    <thead><tr><th>Felt / servering</th><th>Før</th><th>Efter</th></tr></thead>
                    <tbody>
                      {edit.changes.map((change, changeIndex) => (
                        <tr key={`${change.itemId || 'booking'}-${change.field}-${changeIndex}`}>
                          <th scope="row">{change.label}<small>{servingContext(edit, change)}</small></th>
                          <td>{displayValue(change.before, change.field)}</td>
                          <td>{displayValue(change.after, change.field)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {edit.afterSnapshot && (
                <details className="youth-audit-snapshot">
                  <summary>Vis hele version {edit.version}</summary>
                  <YouthOrderSheet sheet={buildYouthOrderSheet(edit.afterSnapshot, {
                    name: edit.afterSnapshot.orderedByName, email: edit.afterSnapshot.orderedByEmail,
                  })} />
                </details>
              )}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

import { useEffect, useState } from 'react';
import { cleaningListApi } from '../../api/cleaningLists.js';
import { CleaningVisitTasks } from './CleaningVisitChecklistPanel.jsx';
import './CleaningCustomersPanel.css';

export function CleaningAssignmentChecklist({ appointment }) {
  const [state, setState] = useState({ loading: true, list: null, error: '' });
  const customerKey = appointment.economicCustomerNumber
    ? `economic:${appointment.economicCustomerNumber}` : `client:${appointment.cleaningClientId}`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await cleaningListApi.get(customerKey);
        if (!cancelled) setState({ loading: false, list, error: '' });
      } catch (error) {
        if (!cancelled) setState({ loading: false, list: null, error: error.message || 'Could not load the customer cleaning list.' });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [customerKey]);

  if (state.loading) return <div className="profile-empty" role="status">Loading customer cleaning list...</div>;
  if (state.error) return <div className="form-error" role="alert">{state.error}</div>;
  if (!state.list?.id) return null;
  return <CleaningVisitTasks key={appointment.id} customerKey={customerKey} template={state.list} visit={{ id: appointment.id }} />;
}

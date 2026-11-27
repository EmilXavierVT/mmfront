import { useEffect, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { cleaningListApi } from '../../api/cleaningLists.js';

function visitLabel(visit) {
  const date = new Date(visit.appointmentTime);
  const label = Number.isNaN(date.getTime()) ? 'Unscheduled visit' : new Intl.DateTimeFormat('en-DK', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
  return `${label} · ${visit.staffName || 'Unassigned'}`;
}

function defaultVisit(visits) {
  const now = Date.now();
  const today = new Date().toDateString();
  return visits.find(visit => visit.canComplete && new Date(visit.appointmentTime).toDateString() === today)
    || [...visits].reverse().find(visit => visit.canComplete && new Date(visit.appointmentTime).getTime() >= now)
    || visits[0];
}

export function CleaningVisitTasks({ customerKey, template, visit, autoStart = false }) {
  const [state, setState] = useState({ checklist: null, loading: Boolean(visit), error: '', revision: 0 });
  const [pending, setPending] = useState([]);
  const [starting, setStarting] = useState(false);
  const [revision, setRevision] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const visitId = visit?.id;

  useEffect(() => {
    if (!visitId) return;
    let cancelled = false;
    async function load() {
      try {
        let checklist = await cleaningListApi.getChecklist(customerKey, visitId);
        if (!checklist.id && checklist.canComplete && autoStart) checklist = await cleaningListApi.startChecklist(customerKey, visitId);
        if (!cancelled) setState({ checklist, loading: false, error: '', revision });
      } catch (error) {
        if (!cancelled) setState({ checklist: null, loading: false, error: error.message || 'Could not load visit progress.', revision });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [autoStart, customerKey, revision, visitId]);

  async function start() {
    setStarting(true);
    setSaveError('');
    try {
      const checklist = await cleaningListApi.startChecklist(customerKey, visitId);
      setState({ checklist, loading: false, error: '', revision });
    } catch (error) {
      setSaveError(error.message || 'Could not start this visit checklist.');
    } finally { setStarting(false); }
  }

  async function toggle(taskId, completed) {
    setPending(current => [...current, taskId]);
    setSaveError('');
    setSaved(false);
    try {
      const updated = await cleaningListApi.completeTask(customerKey, visitId, taskId, completed);
      setState(current => ({ ...current, checklist: { ...current.checklist, sections: current.checklist.sections.map(section => ({
        ...section, tasks: section.tasks.map(task => task.id === updated.id ? updated : task),
      })) } }));
      setSaved(true);
    } catch (error) {
      setSaveError(error.message || 'Could not save this checkmark. Please try again.');
    } finally { setPending(current => current.filter(id => id !== taskId)); }
  }

  const loading = Boolean(visit) && (state.loading || state.revision !== revision);
  const checklist = state.checklist;
  const active = Boolean(checklist?.id);
  const sections = active ? checklist.sections : template.sections.map((section, index) => ({
    title: section.title, tasks: section.tasks.map((text, taskIndex) => ({ id: `preview-${index}-${taskIndex}`, text, completed: false })),
  }));
  const tasks = sections.flatMap(section => section.tasks);
  const completed = tasks.filter(task => task.completed).length;
  const notes = active ? checklist.notes : template.notes;

  return (
    <div className="cleaning-list-content">
      {loading && <div className="profile-empty" role="status">Loading visit checklist...</div>}
      {state.error && <div className="form-error" role="alert">{state.error} <button className="btn btn-cream" type="button" onClick={() => setRevision(value => value + 1)}>Try again</button></div>}
      {!loading && !state.error && (
        <>
          <h3>{active ? checklist.title : template.title}</h3>
          {active ? (
            <div className="cleaning-visit-progress">
              <strong>{completed} of {tasks.length} tasks completed</strong>
              <progress value={completed} max={tasks.length || 1} aria-label="Cleaning visit completion" />
              <p role="status">{pending.length ? 'Saving progress...' : saved ? 'Progress saved.' : checklist.canComplete ? 'Check off tasks as you finish. Progress saves automatically for this visit.' : 'Saved progress for this visit.'}</p>
            </div>
          ) : (
            <div className="cleaning-visit-instructions">
              <p>{visit ? 'This visit has a fresh checklist. Completed tasks stay with this visit.' : 'Choose a cleaning visit to save completed tasks.'}</p>
              {checklist?.canComplete && <button className="btn btn-blue" type="button" disabled={starting} onClick={start}>{starting ? 'Starting...' : 'Start visit checklist'}</button>}
            </div>
          )}
          {saveError && <div className="form-error" role="alert">{saveError}</div>}
          {notes && <div className="cleaning-list-care"><strong>Care notes</strong><p>{notes}</p></div>}
          {sections.map((section, index) => (
            <section className="cleaning-list-room" key={index}>
              <h3>{section.title}</h3>
              <div className="cleaning-visit-tasks">
                {section.tasks.map(task => (
                  <label className={`cleaning-visit-task ${task.completed ? 'completed' : ''} ${/^note\b/i.test(task.text) ? 'cleaning-list-note' : ''}`} key={task.id}>
                    <input type="checkbox" checked={task.completed} disabled={!active || !checklist.canComplete || pending.includes(task.id)} onChange={event => toggle(task.id, event.target.checked)} />
                    <span className="cleaning-visit-task-text">{task.text}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export function CleaningVisitChecklistPanel({ customer, template, staffUser, initialVisitId }) {
  const [state, setState] = useState({ loading: true, visits: [], error: '' });
  const [selectedId, setSelectedId] = useState(initialVisitId ? String(initialVisitId) : null);
  const [autoStartId, setAutoStartId] = useState(initialVisitId ? String(initialVisitId) : null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [duration, setDuration] = useState('120');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const visits = await cleaningListApi.getVisits(customer.key);
        if (!cancelled) setState({ loading: false, visits, error: '' });
      } catch (error) {
        if (!cancelled) setState({ loading: false, visits: [], error: error.message || 'Could not load cleaning visits.' });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [customer.key]);

  const selected = selectedId === 'template' ? null : state.visits.find(visit => String(visit.id) === selectedId) || defaultVisit(state.visits);

  async function createToday(event) {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    try {
      const appointment = await cleaningAppointmentApi.create({
        cleaningClientId: customer.cleaningClientId || null,
        economicCustomerNumber: customer.customerNumber || null,
        economicCustomerName: customer.customerNumber ? customer.name : null,
        projectName: `${customer.name} cleaning project`,
        cleaningStaffId: Number(staffUser.id || staffUser.userId),
        appointmentTime: `${today}T${time}:00`,
        durationMinutes: Number(duration),
        vacation: false,
        tasks: [],
      });
      const visit = { id: appointment.id, appointmentTime: appointment.appointmentTime, staffName: 'You', canComplete: true };
      setState(current => ({ ...current, visits: [visit, ...current.visits] }));
      setAutoStartId(String(visit.id));
      setSelectedId(String(visit.id));
    } catch (error) {
      setCreateError(error.message || 'Could not create today’s assignment.');
    } finally { setCreating(false); }
  }

  return (
    <div className="cleaning-visit-panel">
      {staffUser && (
        <form className="cleaning-today-assignment" onSubmit={createToday}>
          <strong>Create today’s assignment for {customer.name}</strong>
          <p>You will be assigned to the visit and its checklist will open below.</p>
          <div className="cleaning-today-fields">
            <div className="field"><label htmlFor="cleaning-today-time">Start time today</label><input id="cleaning-today-time" type="time" value={time} required disabled={creating} onChange={event => setTime(event.target.value)} /></div>
            <div className="field"><label htmlFor="cleaning-today-duration">Duration</label><select id="cleaning-today-duration" value={duration} disabled={creating} onChange={event => setDuration(event.target.value)}>{Array.from({ length: 16 }, (_, index) => (index + 1) * 30).map(minutes => <option key={minutes} value={minutes}>{minutes / 60} h</option>)}</select></div>
            <button className="btn btn-blue" type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create today’s assignment'}</button>
          </div>
          {createError && <div className="form-error" role="alert">{createError}</div>}
        </form>
      )}
      <div className="field cleaning-visit-picker">
        <label htmlFor="cleaning-visit-select">Cleaning visit</label>
        <select id="cleaning-visit-select" value={selected?.id || 'template'} disabled={state.loading || creating} onChange={event => setSelectedId(event.target.value)}>
          <option value="template">Customer cleaning list</option>
          {state.visits.map(visit => <option key={visit.id} value={visit.id}>{visitLabel(visit)}</option>)}
        </select>
      </div>
      {state.loading ? <div className="profile-empty" role="status">Loading cleaning visits...</div> : state.error ? <div className="form-error" role="alert">{state.error}</div> : (
        <CleaningVisitTasks key={`${selected?.id || 'template'}-${template.version}`} customerKey={customer.key} template={template} visit={selected} autoStart={String(selected?.id) === autoStartId} />
      )}
    </div>
  );
}

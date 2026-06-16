import { useEffect, useMemo, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { userApi } from '../../api/users.js';
import { Icon } from '../Shared/Icon.jsx';
import {
  formatCalendarDay,
  formatCalendarMonth,
  formatDate,
  getDateKey,
  getMonthDays,
  getUserEmail,
  getUserFirstName,
  getUserId,
  getUserLastName,
  isCleaningClientUser,
} from '../Admin/adminUtils.js';

const DURATION_OPTIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30);

function pad(part) {
  return String(part).padStart(2, '0');
}

function toInputDateTime(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
      return normalized.slice(0, 16);
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDateTime(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

function buildInitialForm(cleaningClients, dateKey = '') {
  return {
    id: null,
    cleaningClientId: cleaningClients[0]?.id ? String(cleaningClients[0].id) : '',
    appointmentTime: `${dateKey || getDateKey(new Date())}T09:00`,
    durationMinutes: '120',
    vacation: false,
    repeatWeekly: false,
    recurrenceWeeks: '1',
  };
}

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 'Not set';

  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder} min`;
}

function formatTimeOnly(value) {
  if (!value) return 'No time';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-DK', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getClientName(client) {
  const name = [client?.firstName, client?.lastName].filter(Boolean).join(' ');
  return name || client?.email || 'Unknown cleaning client';
}

function buildCleaningClientSummaries(users) {
  return users
    .filter(isCleaningClientUser)
    .map((user) => ({
      id: getUserId(user),
      email: getUserEmail(user),
      firstName: getUserFirstName(user),
      lastName: getUserLastName(user),
    }))
    .filter((user) => user.id)
    .sort((a, b) => getClientName(a).localeCompare(getClientName(b)));
}

function buildRecurringTimes(appointmentTime, recurrenceWeeks) {
  const times = [appointmentTime];
  const totalWeeks = Number(recurrenceWeeks);
  if (!Number.isInteger(totalWeeks) || totalWeeks <= 1) return times;

  const startDate = new Date(appointmentTime);
  if (Number.isNaN(startDate.getTime())) {
    return times;
  }

  for (let weekIndex = 1; weekIndex < totalWeeks; weekIndex += 1) {
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + weekIndex * 7);
    times.push(toInputDateTime(nextDate));
  }

  return times;
}

function parseOptionalId(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeAppointment(appointment) {
  return {
    ...appointment,
    id: parseOptionalId(appointment?.id),
    cleaningClientId: parseOptionalId(appointment?.cleaningClientId),
    cleaningStaffId: parseOptionalId(appointment?.cleaningStaffId),
    durationMinutes: Number(appointment?.durationMinutes) || 0,
    vacation: Boolean(appointment?.vacation),
  };
}

function isVisibleToCleaningStaff(appointment, cleaningStaffId) {
  return appointment?.cleaningStaffId == null || appointment.cleaningStaffId === cleaningStaffId;
}

export function CleaningSchedulePanel({ user }) {
  const cleaningStaffId = Number(user?.id || user?.userId);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState(() => buildInitialForm([], getDateKey(new Date())));

  const cleaningClients = useMemo(() => buildCleaningClientSummaries(users), [users]);
  const cleaningClientsById = useMemo(
    () => Object.fromEntries(cleaningClients.map((client) => [String(client.id), client])),
    [cleaningClients],
  );

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.appointmentTime || 0) - new Date(b.appointmentTime || 0)),
    [appointments],
  );

  const appointmentsByDay = useMemo(() => (
    sortedAppointments.reduce((groups, appointment) => {
      const key = getDateKey(appointment.appointmentTime);
      if (!key) return groups;
      groups[key] = groups[key] || [];
      groups[key].push(appointment);
      return groups;
    }, {})
  ), [sortedAppointments]);

  const calendarDays = useMemo(() => getMonthDays(calendarCursor), [calendarCursor]);
  const selectedAppointment = useMemo(
    () => sortedAppointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [selectedAppointmentId, sortedAppointments],
  );
  const selectedDayAppointments = appointmentsByDay[selectedDateKey] || [];
  const unassignedAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => appointment.cleaningStaffId == null),
    [sortedAppointments],
  );
  const selectedDayLabel = formatCalendarDay(selectedDateKey);

  useEffect(() => {
    if (!cleaningStaffId) return;

    let ignore = false;

    async function loadSchedule() {
      setScheduleLoading(true);
      setScheduleError('');

      try {
        const [userData, appointmentData] = await Promise.all([
          userApi.getAll(),
          cleaningAppointmentApi.getAll(),
        ]);

        if (ignore) return;

        const nextUsers = Array.isArray(userData) ? userData : [];
        const nextAppointments = Array.isArray(appointmentData)
          ? appointmentData
            .map(normalizeAppointment)
            .filter((appointment) => isVisibleToCleaningStaff(appointment, cleaningStaffId))
          : [];

        setUsers(nextUsers);
        setAppointments(nextAppointments);
      } catch (err) {
        if (!ignore) {
          setScheduleError(err.message || 'Could not load your cleaning schedule.');
        }
      } finally {
        if (!ignore) {
          setScheduleLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      ignore = true;
    };
  }, [cleaningStaffId]);

  useEffect(() => {
    if (selectedAppointment && getDateKey(selectedAppointment.appointmentTime) === selectedDateKey) {
      return;
    }

    if (selectedAppointment) {
      setSelectedDateKey(getDateKey(selectedAppointment.appointmentTime));
    }
  }, [selectedAppointment, selectedDateKey]);

  useEffect(() => {
    if (!selectedAppointmentId) return;

    if (!sortedAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
      setSelectedAppointmentId(null);
    }
  }, [selectedAppointmentId, sortedAppointments]);

  useEffect(() => {
    if (!cleaningClients.length) return;

    setAppointmentForm((current) => {
      if (current.cleaningClientId) return current;
      return {
        ...current,
        cleaningClientId: String(cleaningClients[0].id),
      };
    });
  }, [cleaningClients]);

  function startCreateAppointment(dateKey = selectedDateKey) {
    setSelectedAppointmentId(null);
    setAppointmentForm(buildInitialForm(cleaningClients, dateKey));
  }

  function startEditAppointment(appointment) {
    if (!appointment) return;

    setSelectedAppointmentId(appointment.id);
    setSelectedDateKey(getDateKey(appointment.appointmentTime));
    setCalendarCursor(new Date(appointment.appointmentTime));
    setAppointmentForm({
      id: appointment.id,
      cleaningClientId: appointment.cleaningClientId ? String(appointment.cleaningClientId) : '',
      appointmentTime: toInputDateTime(appointment.appointmentTime),
      durationMinutes: String(appointment.durationMinutes || 120),
      vacation: Boolean(appointment.vacation),
      repeatWeekly: false,
      recurrenceWeeks: '1',
    });
  }

  async function refreshSchedule(successMessage = '') {
    if (!cleaningStaffId) return [];

    setScheduleLoading(true);
    setScheduleError('');

    try {
      const appointmentData = await cleaningAppointmentApi.getAll();
      const nextAppointments = Array.isArray(appointmentData)
        ? appointmentData
          .map(normalizeAppointment)
          .filter((appointment) => isVisibleToCleaningStaff(appointment, cleaningStaffId))
        : [];
      setAppointments(nextAppointments);
      setScheduleSuccess(successMessage);
      return nextAppointments;
    } catch (err) {
      setScheduleError(err.message || 'Could not refresh your cleaning schedule.');
      return [];
    } finally {
      setScheduleLoading(false);
    }
  }

  function updateAppointmentField(field, value) {
    setAppointmentForm((current) => ({
      ...current,
      [field]: value,
    }));
    setScheduleError('');
    setScheduleSuccess('');
  }

  function validateForm() {
    if (!appointmentForm.cleaningClientId) {
      return 'Choose a cleaning client.';
    }

    if (!appointmentForm.appointmentTime) {
      return 'Add an appointment time.';
    }

    const appointmentDate = new Date(appointmentForm.appointmentTime);
    if (Number.isNaN(appointmentDate.getTime())) {
      return 'Add a valid appointment time.';
    }

    const durationMinutes = Number(appointmentForm.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes % 30 !== 0) {
      return 'Duration must be in 30 minute increments.';
    }

    if (!appointmentForm.id && appointmentForm.repeatWeekly) {
      const recurrenceWeeks = Number(appointmentForm.recurrenceWeeks);
      if (!Number.isInteger(recurrenceWeeks) || recurrenceWeeks < 1) {
        return 'Add a valid number of weeks for the weekly recurrence.';
      }
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setScheduleError(validationError);
      setScheduleSuccess('');
      return;
    }

    setSavingAction(appointmentForm.id ? 'update' : 'create');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      const appointmentTimes = appointmentForm.id || !appointmentForm.repeatWeekly
        ? [appointmentForm.appointmentTime]
        : buildRecurringTimes(appointmentForm.appointmentTime, appointmentForm.recurrenceWeeks);

      const payloads = appointmentTimes.map((appointmentTime) => ({
        cleaningClientId: Number(appointmentForm.cleaningClientId),
        cleaningStaffId,
        appointmentTime: toApiDateTime(appointmentTime),
        durationMinutes: Number(appointmentForm.durationMinutes),
        vacation: Boolean(appointmentForm.vacation),
      }));

      if (appointmentForm.id) {
        await cleaningAppointmentApi.update(appointmentForm.id, {
          id: appointmentForm.id,
          ...payloads[0],
        });
        await refreshSchedule('Appointment updated.');
        setSelectedAppointmentId(appointmentForm.id);
      } else {
        const createdAppointments = [];

        for (let index = 0; index < payloads.length; index += 1) {
          createdAppointments.push(await cleaningAppointmentApi.create(payloads[index]));
        }

        const nextAppointments = await refreshSchedule(
          createdAppointments.length === 1
            ? 'Appointment created.'
            : `${createdAppointments.length} appointments created.`,
        );
        const createdId = Number(createdAppointments[0]?.id);
        const matchedAppointment = Number.isFinite(createdId)
          ? nextAppointments.find((appointment) => appointment.id === createdId)
          : nextAppointments.find((appointment) => (
            String(appointment.cleaningClientId) === String(payloads[0].cleaningClientId)
            && String(appointment.appointmentTime) === String(payloads[0].appointmentTime)
          ));

        if (matchedAppointment) {
          startEditAppointment(matchedAppointment);
        } else {
          startCreateAppointment(getDateKey(appointmentForm.appointmentTime));
        }
      }

      setSelectedDateKey(getDateKey(appointmentForm.appointmentTime));
      setCalendarCursor(new Date(appointmentForm.appointmentTime));
    } catch (err) {
      setScheduleError(err.message || 'Could not save the cleaning appointment.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleDeleteAppointment() {
    if (!selectedAppointment?.id || savingAction) return;
    if (!window.confirm('Delete this cleaning appointment?')) return;

    setSavingAction('delete');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await cleaningAppointmentApi.delete(selectedAppointment.id);
      const dayKey = getDateKey(selectedAppointment.appointmentTime);
      const nextAppointments = await refreshSchedule('Appointment deleted.');
      const nextDayAppointments = nextAppointments.filter((appointment) => getDateKey(appointment.appointmentTime) === dayKey);

      setSelectedAppointmentId(nextDayAppointments[0]?.id || null);
      setSelectedDateKey(dayKey);

      if (nextDayAppointments[0]) {
        startEditAppointment(nextDayAppointments[0]);
      } else {
        startCreateAppointment(dayKey);
      }
    } catch (err) {
      setScheduleError(err.message || 'Could not delete the cleaning appointment.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleAssignToSelf() {
    if (!selectedAppointment?.id || savingAction || !cleaningStaffId) return;

    setSavingAction('assign');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await cleaningAppointmentApi.update(selectedAppointment.id, {
        id: selectedAppointment.id,
        cleaningClientId: selectedAppointment.cleaningClientId,
        cleaningStaffId,
        appointmentTime: selectedAppointment.appointmentTime,
        durationMinutes: selectedAppointment.durationMinutes,
        vacation: selectedAppointment.vacation,
      });
      await refreshSchedule('Appointment assigned to you.');
      setSelectedAppointmentId(selectedAppointment.id);
    } catch (err) {
      setScheduleError(err.message || 'Could not assign the appointment to you.');
    } finally {
      setSavingAction('');
    }
  }

  return (
    <section className="profile-requests employee-worklogs">
      <section className="profile-grid admin-grid">
        <div className="profile-panel">
          <span>Appointments</span>
          <h2>{sortedAppointments.length}</h2>
          <p>Cleaning appointments assigned to you and waiting to be claimed.</p>
        </div>

        <div className="profile-panel accent">
          <span>Unassigned</span>
          <h2>{unassignedAppointments.length}</h2>
          <p>Appointments without staff assignment that you can claim.</p>
        </div>

        <div className="profile-panel accent">
          <span>Clients</span>
          <h2>{cleaningClients.length}</h2>
          <p>Cleaning clients available for scheduling.</p>
        </div>
      </section>
      <br />

      <div className="profile-section-head">
        <div>
          <div className="section-eyebrow">Cleaning</div>
          <h2>Schedule cleaning visits</h2>
        </div>
        <button className="btn btn-blue" type="button" onClick={() => refreshSchedule()} disabled={scheduleLoading}>
          Refresh <Icon name="arrow" size={18} />
        </button>
      </div>

      {!cleaningStaffId && (
        <div className="profile-empty">We could not find your user id in the login session.</div>
      )}

      {scheduleError && <div className="form-error employee-feedback">{scheduleError}</div>}
      {scheduleSuccess && <div className="form-success employee-feedback">{scheduleSuccess}</div>}

      {cleaningStaffId && (
        <>
          <section className="employee-cleaning-unassigned-section">
            <div className="profile-section-head">
              <div>
                <div className="section-eyebrow">Unassigned</div>
                <h2>Appointments waiting for staff</h2>
              </div>
            </div>

            {unassignedAppointments.length === 0 ? (
              <div className="profile-empty">No unassigned appointments are currently returned by the API.</div>
            ) : (
              <div className="employee-cleaning-day-list">
                {unassignedAppointments.map((appointment) => {
                  const isSelected = selectedAppointment?.id === appointment.id;
                  const client = cleaningClientsById[String(appointment.cleaningClientId)];

                  return (
                    <button
                      className={`employee-history-row employee-cleaning-day-row ${isSelected ? 'selected' : ''}`}
                      type="button"
                      key={appointment.id || `${appointment.appointmentTime}-${appointment.cleaningClientId || 'unassigned-top'}`}
                      onClick={() => startEditAppointment(appointment)}
                    >
                      <span>Unassigned visit</span>
                      <strong>{formatCalendarDay(appointment.appointmentTime)} · {formatTimeOnly(appointment.appointmentTime)}</strong>
                      <small>{getClientName(client)}{client?.email ? ` · ${client.email}` : ''}</small>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <form className="admin-product-form employee-cleaning-form" onSubmit={handleSubmit}>
            <div className="employee-cleaning-form-head">
              <div>
                <span>{appointmentForm.id ? 'Edit appointment' : 'New appointment'}</span>
                <h3>{appointmentForm.id ? `Appointment #${appointmentForm.id}` : 'Add cleaning visit'}</h3>
                <p>
                  {appointmentForm.id
                    ? 'Update the selected appointment or delete it if it should be removed.'
                    : 'Create one visit or repeat the same visit every week for a chosen number of weeks.'}
                </p>
              </div>
              {appointmentForm.id && (
                <button className="btn btn-ghost" type="button" onClick={() => startCreateAppointment()}>
                  New appointment <Icon name="plus" size={18} />
                </button>
              )}
            </div>

            <div className="field-row">
              <div className="field">
                <label>Cleaning client</label>
                <select
                  value={appointmentForm.cleaningClientId}
                  onChange={(event) => updateAppointmentField('cleaningClientId', event.target.value)}
                  disabled={!cleaningClients.length}
                >
                  {!cleaningClients.length && <option value="">No cleaning clients available</option>}
                  {cleaningClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientName(client)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Appointment time</label>
                <input
                  type="datetime-local"
                  value={appointmentForm.appointmentTime}
                  onChange={(event) => updateAppointmentField('appointmentTime', event.target.value)}
                />
              </div>
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Duration</label>
                <select
                  value={appointmentForm.durationMinutes}
                  onChange={(event) => updateAppointmentField('durationMinutes', event.target.value)}
                >
                  {DURATION_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                  ))}
                </select>
              </div>

              <div className="field employee-cleaning-checkbox-field">
                <label className="employee-cleaning-checkbox">
                  <input
                    type="checkbox"
                    checked={appointmentForm.vacation}
                    onChange={(event) => updateAppointmentField('vacation', event.target.checked)}
                  />
                  <span>Mark as vacation visit</span>
                </label>
              </div>
            </div>

            {!appointmentForm.id && (
              <div className="employee-cleaning-recurring">
                <label className="employee-cleaning-checkbox">
                  <input
                    type="checkbox"
                    checked={appointmentForm.repeatWeekly}
                    onChange={(event) => updateAppointmentField('repeatWeekly', event.target.checked)}
                  />
                  <span>Repeat weekly</span>
                </label>

                <div className="field employee-cleaning-end-date">
                  <label>Number of weeks</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={appointmentForm.recurrenceWeeks}
                    onChange={(event) => updateAppointmentField('recurrenceWeeks', event.target.value)}
                    disabled={!appointmentForm.repeatWeekly}
                  />
                </div>
              </div>
            )}

            <div className="employee-actions">
              <button className="btn btn-blue" type="submit" disabled={savingAction === 'create' || savingAction === 'update' || !cleaningClients.length}>
                {savingAction === 'create' || savingAction === 'update'
                  ? 'Saving...'
                  : appointmentForm.id
                    ? 'Save changes'
                    : 'Create appointment'}
                <Icon name={appointmentForm.id ? 'arrow' : 'plus'} size={18} />
              </button>

              {appointmentForm.id && (
                <button className="btn btn-ghost" type="button" onClick={handleDeleteAppointment} disabled={savingAction === 'delete'}>
                  {savingAction === 'delete' ? 'Deleting...' : 'Delete appointment'}
                  <Icon name="x" size={18} />
                </button>
              )}
            </div>
          </form>

          {scheduleLoading && sortedAppointments.length === 0 && (
            <div className="profile-empty">Loading your cleaning schedule...</div>
          )}

          <div className="admin-calendar-layout employee-cleaning-layout">
            <section className="admin-calendar-board" aria-label="Cleaning appointment calendar">
              <div className="admin-calendar-head">
                <button className="admin-calendar-nav" type="button" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month">
                  <Icon name="chevL" size={18} />
                </button>
                <h3>{formatCalendarMonth(calendarCursor)}</h3>
                <button className="admin-calendar-nav" type="button" onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month">
                  <Icon name="chev" size={18} />
                </button>
              </div>

              <div className="admin-calendar-weekdays" aria-hidden="true">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="admin-calendar-grid">
                {calendarDays.map((day) => {
                  const dayAppointments = appointmentsByDay[day.key] || [];
                  const isSelectedDay = day.key === selectedDateKey;

                  return (
                    <div
                      className={`admin-calendar-day ${day.inMonth ? '' : 'muted'} ${isSelectedDay ? 'employee-cleaning-day-selected' : ''}`}
                      key={day.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedDateKey(day.key);
                        setCalendarCursor(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                        if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                          setSelectedAppointmentId(dayAppointments[0]?.id || null);
                        }
                        if (!dayAppointments.length) {
                          startCreateAppointment(day.key);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedDateKey(day.key);
                          setCalendarCursor(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                          if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                            setSelectedAppointmentId(dayAppointments[0]?.id || null);
                          }
                          if (!dayAppointments.length) {
                            startCreateAppointment(day.key);
                          }
                        }
                      }}
                    >
                      <span className="admin-calendar-date">{day.date.getDate()}</span>
                      <div className="admin-calendar-events">
                        {dayAppointments.map((appointment) => {
                          const isSelected = selectedAppointment?.id === appointment.id;
                          const client = cleaningClientsById[String(appointment.cleaningClientId)];

                          return (
                            <button
                              className={`admin-calendar-event ${isSelected ? 'selected' : ''}`}
                              type="button"
                              key={appointment.id || `${appointment.appointmentTime}-${appointment.cleaningClientId}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditAppointment(appointment);
                              }}
                            >
                              <strong>{formatTimeOnly(appointment.appointmentTime)}</strong>
                              <small>{getClientName(client)}</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <article className="employee-history-detail employee-cleaning-detail">
              <div className="employee-history-head">
                <div>
                  <span>{selectedAppointment ? 'Selected appointment' : 'Selected day'}</span>
                  <h3>{selectedAppointment ? getClientName(cleaningClientsById[String(selectedAppointment.cleaningClientId)]) : selectedDayLabel}</h3>
                </div>
                <div className="employee-status-pill">
                  {selectedAppointment
                    ? (selectedAppointment.vacation ? 'Vacation' : 'Scheduled')
                    : `${selectedDayAppointments.length} visit${selectedDayAppointments.length === 1 ? '' : 's'}`}
                </div>
              </div>

              {selectedAppointment ? (
                <>
                  <dl className="employee-history-grid">
                    <div>
                      <dt>Appointment</dt>
                      <dd>#{selectedAppointment.id || 'New'}</dd>
                    </div>
                    <div>
                      <dt>Client</dt>
                      <dd>{getClientName(cleaningClientsById[String(selectedAppointment.cleaningClientId)])}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{cleaningClientsById[String(selectedAppointment.cleaningClientId)]?.email || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt>Day</dt>
                      <dd>{formatCalendarDay(selectedAppointment.appointmentTime)}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{formatDate(selectedAppointment.appointmentTime)}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{formatDuration(selectedAppointment.durationMinutes)}</dd>
                    </div>
                    <div>
                      <dt>Assigned staff</dt>
                      <dd>{selectedAppointment.cleaningStaffId ? 'You' : 'Unassigned'}</dd>
                    </div>
                  </dl>

                  {!selectedAppointment.cleaningStaffId && (
                    <div className="employee-actions">
                      <button
                        className="btn btn-blue"
                        type="button"
                        onClick={handleAssignToSelf}
                        disabled={savingAction === 'assign'}
                      >
                        {savingAction === 'assign' ? 'Assigning...' : 'Assign to me'}
                        <Icon name="check" size={18} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="profile-empty employee-cleaning-empty">
                  {selectedDayAppointments.length
                    ? 'Choose an appointment below to edit it.'
                    : 'No cleaning visits are booked for this day yet. Use the form above to add one.'}
                </div>
              )}

              <div className="employee-cleaning-day-section">
                <div className="employee-cleaning-day-head">
                  <h4>{selectedDayLabel}</h4>
                  <button className="btn btn-ghost" type="button" onClick={() => startCreateAppointment(selectedDateKey)}>
                    Add on this day <Icon name="plus" size={18} />
                  </button>
                </div>

                {selectedDayAppointments.length === 0 ? (
                  <div className="request-products-state">No appointments on this day.</div>
                ) : (
                  <div className="employee-cleaning-day-list">
                    {selectedDayAppointments.map((appointment) => {
                      const isSelected = selectedAppointment?.id === appointment.id;
                      const client = cleaningClientsById[String(appointment.cleaningClientId)];

                      return (
                        <button
                          className={`employee-history-row employee-cleaning-day-row ${isSelected ? 'selected' : ''}`}
                          type="button"
                          key={appointment.id}
                          onClick={() => startEditAppointment(appointment)}
                        >
                          <span>{appointment.cleaningStaffId ? (appointment.vacation ? 'Vacation visit' : 'Cleaning visit') : 'Unassigned visit'}</span>
                          <strong>{formatTimeOnly(appointment.appointmentTime)} · {formatDuration(appointment.durationMinutes)}</strong>
                          <small>{getClientName(client)}{client?.email ? ` · ${client.email}` : ''}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="employee-cleaning-day-section">
                <div className="employee-cleaning-day-head">
                  <h4>Unassigned appointments</h4>
                </div>

                {unassignedAppointments.length === 0 ? (
                  <div className="request-products-state">No unassigned appointments right now.</div>
                ) : (
                  <div className="employee-cleaning-day-list">
                    {unassignedAppointments.map((appointment) => {
                      const isSelected = selectedAppointment?.id === appointment.id;
                      const client = cleaningClientsById[String(appointment.cleaningClientId)];

                      return (
                        <button
                          className={`employee-history-row employee-cleaning-day-row ${isSelected ? 'selected' : ''}`}
                          type="button"
                          key={appointment.id || `${appointment.appointmentTime}-${appointment.cleaningClientId || 'unassigned'}`}
                          onClick={() => startEditAppointment(appointment)}
                        >
                          <span>Unassigned visit</span>
                          <strong>{formatCalendarDay(appointment.appointmentTime)} · {formatTimeOnly(appointment.appointmentTime)}</strong>
                          <small>{getClientName(client)}{client?.email ? ` · ${client.email}` : ''}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

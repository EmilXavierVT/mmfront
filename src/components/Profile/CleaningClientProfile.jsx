import { useEffect, useMemo, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { userApi } from '../../api/users.js';
import { formatCalendarDay, formatCalendarMonth, formatDate, getDateKey, getMonthDays, getUserEmail, getUserFirstName, getUserId, getUserLastName } from '../Admin/adminUtils.js';
import { ChangePasswordPanel } from '../Auth/ChangePasswordPanel.jsx';
import { Icon } from '../Shared/Icon.jsx';
import { AccountDetailsPanel } from './AccountDetailsPanel.jsx';

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

function getNowInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
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

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 'Not set';

  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder} min`;
}

function normalizeAppointment(appointment) {
  return {
    ...appointment,
    id: Number(appointment?.id),
    cleaningClientId: Number(appointment?.cleaningClientId),
    cleaningStaffId: Number(appointment?.cleaningStaffId),
    durationMinutes: Number(appointment?.durationMinutes) || 0,
    cancellationTime: appointment?.cancellationTime || null,
    vacation: Boolean(appointment?.vacation),
  };
}

function canManageAppointment(appointmentTime) {
  const appointmentDate = new Date(appointmentTime);
  if (Number.isNaN(appointmentDate.getTime())) return false;

  return appointmentDate.getTime() - Date.now() >= 7 * 24 * 60 * 60 * 1000;
}

function isWithinLastYear(value, referenceDate = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const end = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(end.getTime())) return false;

  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);

  return date >= start && date <= end;
}

function getStaffName(staff) {
  const name = [staff?.firstName, staff?.lastName].filter(Boolean).join(' ');
  return name || staff?.email || 'Unassigned staff';
}

function getCancellationTone(cancellationTime) {
  if (!cancellationTime) return 'normal';

  const deadline = new Date(cancellationTime);
  if (Number.isNaN(deadline.getTime())) return 'normal';

  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return 'critical';
  if (diff <= 2 * 24 * 60 * 60 * 1000) return 'warning';
  return 'normal';
}

function buildCreateForm(dateKey = '') {
  return {
    appointmentTime: `${dateKey || getDateKey(new Date())}T09:00`,
    durationMinutes: '120',
  };
}

export function CleaningClientProfile({ user, onLogout, onUserUpdated }) {
  const userId = Number(user?.id || user?.userId);
  const [activeTab, setActiveTab] = useState('calendar');
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [appointmentTimeInput, setAppointmentTimeInput] = useState('');
  const [createForm, setCreateForm] = useState(() => buildCreateForm(getDateKey(new Date())));

  const tabs = [
    ['calendar', 'Calendar'],
    ['vacation', 'Vacation'],
    ['profile', 'Profile'],
  ];

  const staffById = useMemo(() => (
    Object.fromEntries((Array.isArray(users) ? users : []).map((staffUser) => [String(getUserId(staffUser)), {
      id: getUserId(staffUser),
      email: getUserEmail(staffUser),
      firstName: getUserFirstName(staffUser),
      lastName: getUserLastName(staffUser),
    }]))
  ), [users]);

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
  const recentVacationAppointments = useMemo(
    () => sortedAppointments
      .filter((appointment) => appointment.vacation && isWithinLastYear(appointment.appointmentTime))
      .sort((a, b) => new Date(b.appointmentTime || 0) - new Date(a.appointmentTime || 0)),
    [sortedAppointments],
  );
  const vacationsRemaining = Math.max(0, 4 - recentVacationAppointments.length);
  const vacationEligibleAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => canManageAppointment(appointment.appointmentTime)),
    [sortedAppointments],
  );

  function getVacationUsageForAppointment(appointment) {
    const appointmentDate = new Date(appointment?.appointmentTime);
    if (Number.isNaN(appointmentDate.getTime())) return 4;

    const windowStart = new Date(appointmentDate);
    windowStart.setFullYear(windowStart.getFullYear() - 1);

    return sortedAppointments.filter((item) => {
      if (!item?.vacation) return false;
      if (item.id === appointment?.id) return false;

      const itemDate = new Date(item.appointmentTime);
      if (Number.isNaN(itemDate.getTime())) return false;

      return itemDate >= windowStart && itemDate <= appointmentDate;
    }).length;
  }

  function canSetVacationForAppointment(appointment) {
    if (!appointment) return false;
    if (!canManageAppointment(appointment.appointmentTime)) return false;
    if (appointment.vacation) return true;

    return getVacationUsageForAppointment(appointment) < 4;
  }

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    async function loadAppointments() {
      setLoading(true);
      setError('');

      try {
        const [appointmentData, userData] = await Promise.all([
          cleaningAppointmentApi.getAll(),
          userApi.getAll(),
        ]);

        if (ignore) return;

        const nextAppointments = Array.isArray(appointmentData)
          ? appointmentData
            .map(normalizeAppointment)
            .filter((appointment) => String(appointment.cleaningClientId) === String(userId))
          : [];

        setAppointments(nextAppointments);
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Could not load your cleaning appointments.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      ignore = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedAppointmentId && sortedAppointments.length) {
      setSelectedAppointmentId(sortedAppointments[0].id);
      setSelectedDateKey(getDateKey(sortedAppointments[0].appointmentTime));
    }
  }, [selectedAppointmentId, sortedAppointments]);

  useEffect(() => {
    if (!selectedAppointment) {
      setAppointmentTimeInput('');
      return;
    }

    setAppointmentTimeInput(toInputDateTime(selectedAppointment.appointmentTime));
  }, [selectedAppointment]);

  async function refreshAppointments(successMessage = '') {
    if (!userId) return [];

    setLoading(true);
    setError('');

    try {
      const appointmentData = await cleaningAppointmentApi.getAll();
      const nextAppointments = Array.isArray(appointmentData)
        ? appointmentData
          .map(normalizeAppointment)
          .filter((appointment) => String(appointment.cleaningClientId) === String(userId))
        : [];
      setAppointments(nextAppointments);
      setSuccess(successMessage);
      return nextAppointments;
    } catch (err) {
      setError(err.message || 'Could not refresh your cleaning appointments.');
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAppointment(event) {
    event.preventDefault();

    if (!createForm.appointmentTime) {
      setError('Add an appointment time.');
      setSuccess('');
      return;
    }

    const appointmentDate = new Date(createForm.appointmentTime);
    if (Number.isNaN(appointmentDate.getTime())) {
      setError('Add a valid appointment time.');
      setSuccess('');
      return;
    }

    const durationMinutes = Number(createForm.durationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes % 30 !== 0) {
      setError('Duration must be in 30 minute increments.');
      setSuccess('');
      return;
    }

    setSavingAction('create');
    setError('');
    setSuccess('');

    try {
      const createdAppointment = await cleaningAppointmentApi.create({
        cleaningClientId: userId,
        appointmentTime: toApiDateTime(createForm.appointmentTime),
        durationMinutes,
        vacation: false,
      });
      const nextAppointments = await refreshAppointments('Appointment created.');
      const createdId = Number(createdAppointment?.id);
      const nextAppointment = Number.isFinite(createdId)
        ? nextAppointments.find((appointment) => appointment.id === createdId)
        : nextAppointments.find((appointment) => (
          String(appointment.appointmentTime) === String(toApiDateTime(createForm.appointmentTime))
        ));

      if (nextAppointment) {
        setSelectedAppointmentId(nextAppointment.id);
      }
      setSelectedDateKey(getDateKey(createForm.appointmentTime));
      setCalendarCursor(new Date(createForm.appointmentTime));
      setCreateForm(buildCreateForm(getDateKey(createForm.appointmentTime)));
    } catch (err) {
      setError(err.message || 'Could not create the appointment.');
    } finally {
      setSavingAction('');
    }
  }

  async function updateAppointment(appointment, changes, successMessage, actionName) {
    if (!appointment?.id) return;
    if (!canManageAppointment(appointment.appointmentTime)) {
      setError('Appointments can only be changed when they are at least one week away.');
      setSuccess('');
      return;
    }

    setSavingAction(actionName);
    setError('');
    setSuccess('');

    try {
      await cleaningAppointmentApi.update(appointment.id, {
        id: appointment.id,
        cleaningClientId: appointment.cleaningClientId,
        cleaningStaffId: appointment.cleaningStaffId,
        appointmentTime: changes.appointmentTime || appointment.appointmentTime,
        durationMinutes: appointment.durationMinutes,
        vacation: typeof changes.vacation === 'boolean' ? changes.vacation : appointment.vacation,
      });
      await refreshAppointments(successMessage);
    } catch (err) {
      setError(err.message || 'Could not update the appointment.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleCancelAppointment(appointment) {
    if (!appointment?.id || savingAction) return;
    if (!window.confirm('Cancel this cleaning appointment?')) return;

    setSavingAction(`cancel-${appointment.id}`);
    setError('');
    setSuccess('');

    try {
      const nextAppointments = await cleaningAppointmentApi.delete(appointment.id).then(() => refreshAppointments('Appointment cancelled.'));

      if (selectedAppointmentId === appointment.id) {
        const nextSelected = nextAppointments[0] || null;
        setSelectedAppointmentId(nextSelected?.id || null);
        if (nextSelected) {
          setSelectedDateKey(getDateKey(nextSelected.appointmentTime));
          setCalendarCursor(new Date(nextSelected.appointmentTime));
        }
      }
    } catch (err) {
      setError(err.message || 'Could not cancel the appointment.');
    } finally {
      setSavingAction('');
    }
  }

  function handleSaveAppointmentTime() {
    if (!selectedAppointment) return;

    if (!appointmentTimeInput) {
      setError('Add a valid appointment time.');
      setSuccess('');
      return;
    }

    const nextDate = new Date(appointmentTimeInput);
    if (Number.isNaN(nextDate.getTime())) {
      setError('Add a valid appointment time.');
      setSuccess('');
      return;
    }

    if (!canManageAppointment(appointmentTimeInput)) {
      setError('Appointment changes must stay at least one week in the future.');
      setSuccess('');
      return;
    }

    updateAppointment(
      selectedAppointment,
      { appointmentTime: toApiDateTime(appointmentTimeInput) },
      'Appointment updated.',
      'save-time',
    );
  }

  function handleUseCurrentAppointmentTime() {
    if (!selectedAppointment) return;

    const nextTime = getNowInputValue();
    setAppointmentTimeInput(nextTime);

    updateAppointment(
      selectedAppointment,
      { appointmentTime: toApiDateTime(nextTime) },
      'Appointment updated.',
      'save-time-now',
    );
  }

  function handleSetVacation(appointment, vacation) {
    if (vacation && !canSetVacationForAppointment(appointment)) {
      setError('You have already used 4 vacation appointments in the relevant 1 year period.');
      setSuccess('');
      return;
    }

    updateAppointment(
      appointment,
      { vacation },
      vacation ? 'Appointment marked as vacation.' : 'Vacation removed from appointment.',
      `vacation-${appointment.id}`,
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Cleaning customer</div>
          <h1>Your cleaning plan.</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-cream" type="button" onClick={onLogout}>
          Log out <Icon name="logout" size={18} />
        </button>
      </section>

      <div className="employee-tabs" role="tablist" aria-label="Cleaning customer sections">
        {tabs.map(([value, label]) => (
          <button
            className={`employee-tab ${activeTab === value ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => setActiveTab(value)}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="form-error employee-feedback">{error}</div>}
      {success && <div className="form-success employee-feedback">{success}</div>}

      {activeTab === 'calendar' && (
        <section className="profile-requests employee-worklogs">
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Appointments</span>
              <h2>{sortedAppointments.length}</h2>
              <p>Your upcoming and past cleaning visits.</p>
            </div>

            <div className="profile-panel accent">
              <span>Vacations left</span>
              <h2>{vacationsRemaining}</h2>
              <p>You can use up to 4 vacation appointments across a rolling one year history.</p>
            </div>
          </section>
          <br />

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Calendar</div>
              <h2>Your cleaning appointments</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={() => refreshAppointments()} disabled={loading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          <form className="admin-product-form employee-cleaning-form" onSubmit={handleCreateAppointment}>
            <div className="employee-cleaning-form-head">
              <div>
                <span>New appointment</span>
                <h3>Book a cleaning visit</h3>
                <p>Create a new appointment for yourself. Staff assignment happens afterwards, and you can still view all visits even when they are too close to edit.</p>
              </div>
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Appointment time</label>
                <input
                  type="datetime-local"
                  value={createForm.appointmentTime}
                  onChange={(event) => setCreateForm((current) => ({ ...current, appointmentTime: event.target.value }))}
                />
              </div>
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Duration</label>
                <select
                  value={createForm.durationMinutes}
                  onChange={(event) => setCreateForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                >
                  {DURATION_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="employee-actions">
              <button className="btn btn-blue" type="submit" disabled={savingAction === 'create'}>
                {savingAction === 'create' ? 'Saving...' : 'Create appointment'}
                <Icon name="plus" size={18} />
              </button>
            </div>
          </form>

          {!userId && (
            <div className="profile-empty">We could not find your user id in the login session.</div>
          )}

          {userId && loading && sortedAppointments.length === 0 && (
            <div className="profile-empty">Loading appointments...</div>
          )}

          {userId && !loading && sortedAppointments.length === 0 && !error && (
            <div className="profile-empty">No cleaning appointments yet.</div>
          )}

          {sortedAppointments.length > 0 && (
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
                          if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                            setSelectedAppointmentId(dayAppointments[0]?.id || null);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedDateKey(day.key);
                            if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                              setSelectedAppointmentId(dayAppointments[0]?.id || null);
                            }
                          }
                        }}
                      >
                        <span className="admin-calendar-date">{day.date.getDate()}</span>
                        <div className="admin-calendar-events">
                          {dayAppointments.map((appointment) => {
                            const isSelected = selectedAppointment?.id === appointment.id;

                            return (
                              <button
                                className={`admin-calendar-event ${isSelected ? 'selected' : ''}`}
                                type="button"
                                key={appointment.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedAppointmentId(appointment.id);
                                  setSelectedDateKey(day.key);
                                }}
                              >
                                <strong>{formatTimeOnly(appointment.appointmentTime)}</strong>
                                <small>{appointment.vacation ? 'Vacation' : 'Cleaning visit'}</small>
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
                {selectedAppointment ? (
                  <>
                    {selectedAppointment.cancellationTime && (
                      <div className={`employee-cancellation-banner ${getCancellationTone(selectedAppointment.cancellationTime)}`}>
                        <span>Cancellation deadline</span>
                        <strong>{formatDate(selectedAppointment.cancellationTime)}</strong>
                      </div>
                    )}

                    <div className="employee-history-head">
                      <div>
                        <span>Selected appointment</span>
                        <h3>{formatCalendarDay(selectedAppointment.appointmentTime)}</h3>
                      </div>
                      <div className="employee-status-pill">
                        {selectedAppointment.vacation ? 'Vacation' : 'Scheduled'}
                      </div>
                    </div>

                    <dl className="employee-history-grid">
                      <div>
                        <dt>Appointment</dt>
                        <dd>#{selectedAppointment.id}</dd>
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
                        <dt>Staff</dt>
                        <dd>{getStaffName(staffById[String(selectedAppointment.cleaningStaffId)])}</dd>
                      </div>
                      <div>
                        <dt>Staff email</dt>
                        <dd>{staffById[String(selectedAppointment.cleaningStaffId)]?.email || 'Not available'}</dd>
                      </div>
                      <div>
                        <dt>Can change</dt>
                        <dd>{canManageAppointment(selectedAppointment.appointmentTime) ? 'Yes' : 'No'}</dd>
                      </div>
                      <div>
                        <dt>Can use vacation</dt>
                        <dd>{canSetVacationForAppointment(selectedAppointment) ? 'Yes' : 'No'}</dd>
                      </div>
                      {selectedAppointment.cancellationTime && (
                        <div>
                          <dt>Cancellation time</dt>
                          <dd>{formatDate(selectedAppointment.cancellationTime)}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="employee-actions">
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => handleCancelAppointment(selectedAppointment)}
                        disabled={savingAction === `cancel-${selectedAppointment.id}`}
                      >
                        {savingAction === `cancel-${selectedAppointment.id}` ? 'Cancelling...' : 'Cancel appointment'}
                        <Icon name="x" size={18} />
                      </button>
                    </div>

                    {canManageAppointment(selectedAppointment.appointmentTime) && (
                      <div className="profile-panel employee-editor-panel employee-client-editor-panel">
                        <span>Change appointment</span>
                        <h2>Move this visit</h2>
                        <p>Visits can only be changed when they are at least one week in the future.</p>

                        <div className="field-row compact">
                          <div className="field">
                            <label>Appointment time</label>
                            <input
                              type="datetime-local"
                              value={appointmentTimeInput}
                              onChange={(event) => setAppointmentTimeInput(event.target.value)}
                            />
                          </div>
                        </div>

                        <div className="employee-actions">
                          <button
                            className="btn btn-blue"
                            type="button"
                            onClick={handleSaveAppointmentTime}
                            disabled={savingAction === 'save-time' || savingAction === 'save-time-now'}
                          >
                            {savingAction === 'save-time' ? 'Saving...' : 'Save changes'}
                            <Icon name="arrow" size={18} />
                          </button>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={handleUseCurrentAppointmentTime}
                            disabled={savingAction === 'save-time' || savingAction === 'save-time-now'}
                          >
                            {savingAction === 'save-time-now' ? 'Saving...' : 'Use current time'}
                            <Icon name="check" size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="profile-empty">Choose an appointment to see details.</div>
                )}

                <div className="employee-cleaning-day-section">
                  <div className="employee-cleaning-day-head">
                    <h4>All appointments</h4>
                  </div>

                  {sortedAppointments.length === 0 ? (
                    <div className="request-products-state">No appointments yet.</div>
                  ) : (
                    <div className="employee-cleaning-day-list">
                      {sortedAppointments.map((appointment) => (
                        <button
                          className={`employee-history-row employee-cleaning-day-row ${selectedAppointment?.id === appointment.id ? 'selected' : ''}`}
                          type="button"
                          key={appointment.id}
                          onClick={() => {
                            setSelectedAppointmentId(appointment.id);
                            setSelectedDateKey(getDateKey(appointment.appointmentTime));
                            setCalendarCursor(new Date(appointment.appointmentTime));
                          }}
                        >
                          <span>{appointment.vacation ? 'Vacation visit' : 'Cleaning visit'}</span>
                          <strong>{formatCalendarDay(appointment.appointmentTime)} · {formatTimeOnly(appointment.appointmentTime)}</strong>
                          <small>{formatDuration(appointment.durationMinutes)} · {getStaffName(staffById[String(appointment.cleaningStaffId)])}</small>
                          {appointment.cancellationTime && (
                            <small className={`employee-cancellation-inline ${getCancellationTone(appointment.cancellationTime)}`}>
                              Cancel by: {formatDate(appointment.cancellationTime)}
                            </small>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
      )}

      {activeTab === 'vacation' && (
        <section className="profile-requests employee-worklogs">
          <section className="profile-grid admin-grid">
            <div className="profile-panel">
              <span>Vacations left</span>
              <h2>{vacationsRemaining}</h2>
              <p>You can use up to 4 vacation appointments in a rolling one year period.</p>
            </div>

            <div className="profile-panel accent">
              <span>Last year</span>
              <h2>{recentVacationAppointments.length}</h2>
              <p>Vacation appointments recorded in your latest one year history.</p>
            </div>
          </section>
          <br />

          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Vacation</div>
              <h2>Mark visits as vacation</h2>
            </div>
          </div>

          <div className="employee-history-detail employee-client-vacation-card">
            <div className="employee-history-head">
              <div>
                <span>One year history</span>
                <h3>Latest vacations</h3>
              </div>
              <div className="employee-status-pill">{recentVacationAppointments.length} used</div>
            </div>

            {recentVacationAppointments.length === 0 ? (
              <div className="request-products-state">No vacation appointments in the last year.</div>
            ) : (
              <div className="employee-cleaning-day-list">
                {recentVacationAppointments.map((appointment) => (
                  <button
                    className={`employee-history-row employee-cleaning-day-row ${selectedAppointment?.id === appointment.id ? 'selected' : ''}`}
                    type="button"
                    key={appointment.id}
                    onClick={() => {
                      setActiveTab('calendar');
                      setSelectedAppointmentId(appointment.id);
                      setSelectedDateKey(getDateKey(appointment.appointmentTime));
                      setCalendarCursor(new Date(appointment.appointmentTime));
                    }}
                  >
                    <span>Vacation visit</span>
                    <strong>{formatCalendarDay(appointment.appointmentTime)} · {formatTimeOnly(appointment.appointmentTime)}</strong>
                    <small>{formatDuration(appointment.durationMinutes)} · {getStaffName(staffById[String(appointment.cleaningStaffId)])}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          {vacationEligibleAppointments.length === 0 ? (
            <div className="profile-empty">No appointments are far enough in the future to change right now.</div>
          ) : (
            <div className="employee-cleaning-day-list">
              {vacationEligibleAppointments.map((appointment) => (
                <div className="employee-history-detail employee-client-vacation-card" key={appointment.id}>
                  <div className="employee-history-head">
                    <div>
                      <span>Appointment #{appointment.id}</span>
                      <h3>{formatCalendarDay(appointment.appointmentTime)}</h3>
                    </div>
                    <div className="employee-status-pill">
                      {appointment.vacation ? 'Vacation' : 'Scheduled'}
                    </div>
                  </div>

                  <dl className="employee-history-grid">
                    <div>
                      <dt>Time</dt>
                      <dd>{formatDate(appointment.appointmentTime)}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{formatDuration(appointment.durationMinutes)}</dd>
                    </div>
                    <div>
                      <dt>Staff</dt>
                      <dd>{getStaffName(staffById[String(appointment.cleaningStaffId)])}</dd>
                    </div>
                  </dl>

                  <div className="employee-actions">
                    <button
                      className="btn btn-blue"
                      type="button"
                      onClick={() => handleSetVacation(appointment, true)}
                      disabled={savingAction === `vacation-${appointment.id}` || appointment.vacation || !canSetVacationForAppointment(appointment)}
                    >
                      {savingAction === `vacation-${appointment.id}` ? 'Saving...' : 'Set as vacation'}
                      <Icon name="check" size={18} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => handleSetVacation(appointment, false)}
                      disabled={savingAction === `vacation-${appointment.id}` || !appointment.vacation}
                    >
                      Remove vacation <Icon name="x" size={18} />
                    </button>
                  </div>

                  {!appointment.vacation && !canSetVacationForAppointment(appointment) && (
                    <div className="request-products-state error">
                      4 vacation appointments have already been used in the rolling year window for this visit.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="profile-requests employee-worklogs">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Profile</div>
              <h2>Account settings</h2>
            </div>
          </div>

          <section className="profile-grid profile-account-grid">
            <AccountDetailsPanel user={user} onUserUpdated={onUserUpdated} />
            <ChangePasswordPanel />
          </section>
        </section>
      )}
    </main>
  );
}

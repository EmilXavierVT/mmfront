import { useEffect, useMemo, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { subscriptionDealApi } from '../../api/subscriptionDeals.js';
import { userApi } from '../../api/users.js';
import { formatCalendarDay, formatCalendarMonth, formatDate, getDateKey, getMonthDays, getUserEmail, getUserFirstName, getUserId, getUserLastName, isCleaningStaffUser } from '../Admin/adminUtils.js';
import { ChangePasswordPanel } from '../Auth/ChangePasswordPanel.jsx';
import { Icon } from '../Shared/Icon.jsx';
import { AccountDetailsPanel } from './AccountDetailsPanel.jsx';

const DURATION_OPTIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30);
const FLEX_DURATION_OPTIONS = DURATION_OPTIONS.filter((minutes) => minutes >= 120);
const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 17;

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

function getNowApiDateTime() {
  return toApiDateTime(getNowInputValue());
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
    cancellationTime: appointment?.cancellationTime || null,
    vacation: Boolean(appointment?.vacation),
  };
}

function canManageAppointment(appointmentTime) {
  const appointmentDate = new Date(appointmentTime);
  if (Number.isNaN(appointmentDate.getTime())) return false;

  return appointmentDate.getTime() - Date.now() >= 7 * 24 * 60 * 60 * 1000;
}

function canRescheduleAppointment(appointmentTime) {
  const appointmentDate = new Date(appointmentTime);
  if (Number.isNaN(appointmentDate.getTime())) return false;

  return appointmentDate.getTime() - Date.now() >= 4 * 24 * 60 * 60 * 1000;
}

function getUserRoles(user) {
  return [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
    .flatMap(value => String(value || '').split(','))
    .map(value => value.trim().replace(/^ROLE_/i, '').toUpperCase())
    .filter(Boolean);
}

function getCancellationChargeMessage(appointmentTime) {
  const appointmentDate = new Date(appointmentTime);
  if (Number.isNaN(appointmentDate.getTime())) return '';

  const hoursUntilAppointment = (appointmentDate.getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursUntilAppointment < 24) return 'Calling in sick now means 100% charge applies.';
  if (hoursUntilAppointment < 48) return 'Calling in sick now means 50% charge applies.';
  return '';
}

function appointmentsOverlap(startA, durationA, startB, durationB) {
  const aStart = new Date(startA).getTime();
  const bStart = new Date(startB).getTime();
  if (Number.isNaN(aStart) || Number.isNaN(bStart)) return false;

  const aEnd = aStart + Number(durationA || 0) * 60 * 1000;
  const bEnd = bStart + Number(durationB || 0) * 60 * 1000;
  return aStart < bEnd && bStart < aEnd;
}

function buildDaySlotTime(dateKey, hour, minute) {
  return `${dateKey}T${pad(hour)}:${pad(minute)}`;
}

function getAppointmentLabel(appointment) {
  if (appointment?.cancellationTime) return 'Sick';
  if (appointment?.vacation) return 'Vacation';
  return 'Cleaning visit';
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  if (data && typeof data === 'object') {
    const nestedList = Object.values(data).find(Array.isArray);
    if (nestedList) return nestedList;
    if (data.id != null) return [data];
  }
  return [];
}

function getSubscriptionDealUserId(deal) {
  return deal?.userId
    ?? deal?.userDTO?.id
    ?? deal?.user?.id
    ?? deal?.cleaningClientId
    ?? deal?.cleaningClientDTO?.id
    ?? null;
}

function getSubscriptionDealVisitsPerMonth(deal) {
  return deal?.visitsPerMonth
    ?? deal?.visits_per_month
    ?? deal?.monthlyVisits
    ?? deal?.visits
    ?? null;
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

function buildCreateForm() {
  return {
    appointmentTime: '',
    durationMinutes: '120',
  };
}

export function CleaningClientProfile({ user, onLogout, onUserUpdated }) {
  const userId = Number(user?.id || user?.userId);
  const userRoles = useMemo(() => getUserRoles(user), [user]);
  const isSubscriber = userRoles.includes('SUBSCRIBER');
  const isFlex = userRoles.includes('FLEX') || !isSubscriber;
  const [activeTab, setActiveTab] = useState('calendar');
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptionDeal, setSubscriptionDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [appointmentTimeInput, setAppointmentTimeInput] = useState('');
  const [createForm, setCreateForm] = useState(() => buildCreateForm(getDateKey(new Date())));

  const tabs = isSubscriber
    ? [
      ['calendar', 'Calendar'],
      ['vacation', 'Vacation'],
      ['profile', 'Profile'],
    ]
    : [
      ['calendar', 'Calendar'],
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

  const cleaningStaff = useMemo(() => (
    (Array.isArray(users) ? users : [])
      .filter(isCleaningStaffUser)
      .map((staffUser) => ({
        id: getUserId(staffUser),
        email: getUserEmail(staffUser),
        firstName: getUserFirstName(staffUser),
        lastName: getUserLastName(staffUser),
      }))
      .filter((staffUser) => staffUser.id)
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
  const recentVacationAppointments = useMemo(
    () => sortedAppointments
      .filter((appointment) => appointment.vacation && isWithinLastYear(appointment.appointmentTime))
      .sort((a, b) => new Date(b.appointmentTime || 0) - new Date(a.appointmentTime || 0)),
    [sortedAppointments],
  );
  const vacationLimit = isSubscriber ? Number(getSubscriptionDealVisitsPerMonth(subscriptionDeal)) || 0 : 0;
  const vacationsRemaining = Math.max(0, vacationLimit - recentVacationAppointments.length);
  const vacationEligibleAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => !appointment.cancellationTime && canManageAppointment(appointment.appointmentTime)),
    [sortedAppointments],
  );

  function getVacationUsageForAppointment(appointment) {
    const appointmentDate = new Date(appointment?.appointmentTime);
    if (Number.isNaN(appointmentDate.getTime())) return vacationLimit;

    const vacationDates = sortedAppointments
      .filter((item) => item?.vacation && item.id !== appointment?.id)
      .map((item) => new Date(item.appointmentTime))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);

    const currentWindowAnchor = vacationDates.find((date) => {
      const windowEnd = new Date(date);
      windowEnd.setFullYear(windowEnd.getFullYear() + 1);
      return appointmentDate >= date && appointmentDate < windowEnd;
    }) || appointmentDate;

    const windowEnd = new Date(currentWindowAnchor);
    windowEnd.setFullYear(windowEnd.getFullYear() + 1);

    return vacationDates.filter((date) => date >= currentWindowAnchor && date < windowEnd).length;
  }

  function canSetVacationForAppointment(appointment) {
    if (!isSubscriber || !vacationLimit) return false;
    if (!appointment) return false;
    if (!canManageAppointment(appointment.appointmentTime)) return false;
    if (appointment.cancellationTime) return false;
    if (appointment.vacation) return true;

    return getVacationUsageForAppointment(appointment) < vacationLimit;
  }

  const availableSlots = useMemo(() => {
    if (!isFlex || !selectedDateKey || !cleaningStaff.length) return [];

    const durationMinutes = Number(createForm.durationMinutes) || 120;
    const dayStart = new Date(`${selectedDateKey}T${pad(WORKDAY_START_HOUR)}:00`);
    const dayEnd = new Date(`${selectedDateKey}T${pad(WORKDAY_END_HOUR)}:00`);
    const slots = [];

    for (let slotStart = new Date(dayStart); slotStart.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime(); slotStart.setMinutes(slotStart.getMinutes() + 30)) {
      const appointmentTime = buildDaySlotTime(selectedDateKey, slotStart.getHours(), slotStart.getMinutes());
      const availableStaff = cleaningStaff.find((staff) => !allAppointments.some((appointment) => (
        !appointment.cancellationTime
        && !appointment.vacation
        && String(appointment.cleaningStaffId) === String(staff.id)
        && appointmentsOverlap(appointmentTime, durationMinutes, appointment.appointmentTime, appointment.durationMinutes)
      )));

      if (availableStaff) {
        slots.push({
          appointmentTime,
          staffId: availableStaff.id,
          label: formatTimeOnly(appointmentTime),
        });
      }
    }

    return slots;
  }, [allAppointments, cleaningStaff, createForm.durationMinutes, isFlex, selectedDateKey]);

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    async function loadAppointments() {
      setLoading(true);
      setError('');

      try {
        const [appointmentData, userData, subscriptionDealData] = await Promise.all([
          cleaningAppointmentApi.getAll(),
          userApi.getAll(),
          isSubscriber ? subscriptionDealApi.getAll() : Promise.resolve([]),
        ]);

        if (ignore) return;

        const nextAppointmentData = normalizeListResponse(appointmentData);
        const nextUserData = normalizeListResponse(userData);
        const nextSubscriptionDealData = normalizeListResponse(subscriptionDealData);
        const nextAppointments = nextAppointmentData.length
          ? nextAppointmentData
            .map(normalizeAppointment)
            .filter((appointment) => String(appointment.cleaningClientId) === String(userId))
          : [];

        setAllAppointments(nextAppointmentData.map(normalizeAppointment));
        setAppointments(nextAppointments);
        setUsers(nextUserData);
        setSubscriptionDeal(nextSubscriptionDealData.find((deal) => String(getSubscriptionDealUserId(deal)) === String(userId)) || null);
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
  }, [isSubscriber, userId]);

  useEffect(() => {
    if (!selectedAppointmentId && sortedAppointments.length) {
      const timeout = window.setTimeout(() => {
        setSelectedAppointmentId(sortedAppointments[0].id);
        setSelectedDateKey(getDateKey(sortedAppointments[0].appointmentTime));
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [selectedAppointmentId, sortedAppointments]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!selectedAppointment) {
        setAppointmentTimeInput('');
        return;
      }

      setAppointmentTimeInput(toInputDateTime(selectedAppointment.appointmentTime));
    }, 0);

    return () => window.clearTimeout(timeout);
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
      setAllAppointments(Array.isArray(appointmentData) ? appointmentData.map(normalizeAppointment) : []);
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

    if (!isFlex) {
      setError('Subscribers cannot create cleaning appointments from the profile.');
      setSuccess('');
      return;
    }

    if (!createForm.appointmentTime) {
      setError('Choose an available time slot.');
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
    if (!Number.isFinite(durationMinutes) || durationMinutes < 120 || durationMinutes % 30 !== 0) {
      setError('Duration must be at least 120 minutes in 30 minute increments.');
      setSuccess('');
      return;
    }

    const selectedSlot = availableSlots.find((slot) => slot.appointmentTime === createForm.appointmentTime);
    if (!selectedSlot) {
      setError('Choose an available time slot.');
      setSuccess('');
      return;
    }

    setSavingAction('create');
    setError('');
    setSuccess('');

    try {
      const createdAppointment = await cleaningAppointmentApi.create({
        cleaningClientId: userId,
        cleaningStaffId: selectedSlot.staffId,
        appointmentTime: toApiDateTime(createForm.appointmentTime),
        durationMinutes,
        cancellationTime: null,
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

  async function updateAppointment(appointment, changes, successMessage, actionName, options = {}) {
    if (!appointment?.id) return;
    if (options.requireVacationWindow && !canManageAppointment(appointment.appointmentTime)) {
      setError('Appointments can only be changed when they are at least one week away.');
      setSuccess('');
      return;
    }

    if (options.requireRescheduleWindow && !canRescheduleAppointment(appointment.appointmentTime)) {
      setError('Appointments can only be rescheduled when they are at least 4 days away.');
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
        cancellationTime: Object.prototype.hasOwnProperty.call(changes, 'cancellationTime') ? changes.cancellationTime : appointment.cancellationTime,
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
    if (appointment.cancellationTime) {
      setError('This appointment is already marked as sick.');
      setSuccess('');
      return;
    }

    const chargeMessage = getCancellationChargeMessage(appointment.appointmentTime);
    const confirmMessage = chargeMessage
      ? `Call in sick for this cleaning appointment? ${chargeMessage}`
      : 'Call in sick for this cleaning appointment?';
    if (!window.confirm(confirmMessage)) return;

    setSavingAction(`cancel-${appointment.id}`);
    setError('');
    setSuccess('');

    try {
      await cleaningAppointmentApi.update(appointment.id, {
        id: appointment.id,
        cleaningClientId: appointment.cleaningClientId,
        cleaningStaffId: appointment.cleaningStaffId,
        appointmentTime: appointment.appointmentTime,
        durationMinutes: appointment.durationMinutes,
        cancellationTime: getNowApiDateTime(),
        vacation: false,
      });
      await refreshAppointments('Appointment marked as sick.');
      setSelectedAppointmentId(appointment.id);
    } catch (err) {
      setError(err.message || 'Could not mark the appointment as sick.');
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

    if (!canRescheduleAppointment(appointmentTimeInput)) {
      setError('Appointment changes must stay at least 4 days in the future.');
      setSuccess('');
      return;
    }

    updateAppointment(
      selectedAppointment,
      { appointmentTime: toApiDateTime(appointmentTimeInput) },
      'Appointment updated.',
      'save-time',
      { requireRescheduleWindow: true },
    );
  }

  function handleSetVacation(appointment, vacation) {
    if (vacation && !canSetVacationForAppointment(appointment)) {
      setError(`You have already used ${vacationLimit} vacation appointments in the relevant 1 year period.`);
      setSuccess('');
      return;
    }

    updateAppointment(
      appointment,
      { vacation },
      vacation ? 'Appointment marked as vacation.' : 'Vacation removed from appointment.',
      `vacation-${appointment.id}`,
      { requireVacationWindow: true },
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Cleaning customer</div>
          <h1>{isSubscriber ? 'Your subscription plan.' : 'Your flex cleaning plan.'}</h1>
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
              <span>{isSubscriber ? 'Vacations left' : 'Available staff'}</span>
              <h2>{isSubscriber ? vacationsRemaining : cleaningStaff.length}</h2>
              <p>{isSubscriber ? `You can use up to ${vacationLimit} vacation appointments across your yearly vacation window.` : 'Available slots are based on cleaning staff calendars.'}</p>
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

          {isFlex && (
          <form className="admin-product-form employee-cleaning-form" onSubmit={handleCreateAppointment}>
            <div className="employee-cleaning-form-head">
              <div>
                <span>New appointment</span>
                <h3>Book a cleaning visit</h3>
                <p>Choose a day, duration, and one of the available staff-backed time slots.</p>
              </div>
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Selected day</label>
                <input value={formatCalendarDay(selectedDateKey)} readOnly />
              </div>
            </div>

            <div className="field-row compact">
              <div className="field">
                <label>Duration</label>
                <select
                  value={createForm.durationMinutes}
                  onChange={(event) => setCreateForm((current) => ({ ...current, durationMinutes: event.target.value, appointmentTime: '' }))}
                >
                  {FLEX_DURATION_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="employee-cleaning-day-section">
              <div className="employee-cleaning-day-head">
                <h4>Available slots</h4>
              </div>

              {availableSlots.length === 0 ? (
                <div className="request-products-state">No available slots for this day and duration.</div>
              ) : (
                <div className="employee-cleaning-day-list">
                  {availableSlots.map((slot) => (
                    <button
                      className={`employee-history-row employee-cleaning-day-row ${createForm.appointmentTime === slot.appointmentTime ? 'selected' : ''}`}
                      type="button"
                      key={`${slot.appointmentTime}-${slot.staffId}`}
                      onClick={() => setCreateForm((current) => ({ ...current, appointmentTime: slot.appointmentTime }))}
                    >
                      <span>Available</span>
                      <strong>{slot.label}</strong>
                      <small>{formatDuration(createForm.durationMinutes)} · {getStaffName(staffById[String(slot.staffId)])}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="employee-actions">
              <button className="btn btn-blue" type="submit" disabled={savingAction === 'create' || !createForm.appointmentTime}>
                {savingAction === 'create' ? 'Saving...' : 'Create appointment'}
                <Icon name="plus" size={18} />
              </button>
            </div>
          </form>
          )}

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
                          setCreateForm((current) => ({ ...current, appointmentTime: '' }));
                          if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                            setSelectedAppointmentId(dayAppointments[0]?.id || null);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedDateKey(day.key);
                            setCreateForm((current) => ({ ...current, appointmentTime: '' }));
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
                                <small>{getAppointmentLabel(appointment)}</small>
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
                        <span>Called in sick</span>
                        <strong>{formatDate(selectedAppointment.cancellationTime)}</strong>
                      </div>
                    )}

                    <div className="employee-history-head">
                      <div>
                        <span>Selected appointment</span>
                        <h3>{formatCalendarDay(selectedAppointment.appointmentTime)}</h3>
                      </div>
                      <div className="employee-status-pill">
                        {getAppointmentLabel(selectedAppointment)}
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
                        <dd>{isFlex && canRescheduleAppointment(selectedAppointment.appointmentTime) && !selectedAppointment.cancellationTime ? 'Yes' : 'No'}</dd>
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
                        disabled={savingAction === `cancel-${selectedAppointment.id}` || Boolean(selectedAppointment.cancellationTime)}
                      >
                        {savingAction === `cancel-${selectedAppointment.id}` ? 'Saving...' : selectedAppointment.cancellationTime ? 'Already sick' : 'Call in sick'}
                        <Icon name="x" size={18} />
                      </button>
                    </div>

                    {!selectedAppointment.cancellationTime && getCancellationChargeMessage(selectedAppointment.appointmentTime) && (
                      <div className="request-products-state error">
                        {getCancellationChargeMessage(selectedAppointment.appointmentTime)}
                      </div>
                    )}

                    {isFlex && canRescheduleAppointment(selectedAppointment.appointmentTime) && !selectedAppointment.cancellationTime && (
                      <div className="profile-panel employee-editor-panel employee-client-editor-panel">
                        <span>Change appointment</span>
                        <h2>Move this visit</h2>
                        <p>Flex visits can only be rescheduled when they are at least 4 days in the future.</p>

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
                            disabled={savingAction === 'save-time'}
                          >
                            {savingAction === 'save-time' ? 'Saving...' : 'Save changes'}
                            <Icon name="arrow" size={18} />
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
                          <span>{getAppointmentLabel(appointment)}</span>
                          <strong>{formatCalendarDay(appointment.appointmentTime)} · {formatTimeOnly(appointment.appointmentTime)}</strong>
                          <small>{formatDuration(appointment.durationMinutes)} · {getStaffName(staffById[String(appointment.cleaningStaffId)])}</small>
                          {appointment.cancellationTime && (
                            <small className={`employee-cancellation-inline ${getCancellationTone(appointment.cancellationTime)}`}>
                              Called in sick: {formatDate(appointment.cancellationTime)}
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
              <p>You can use up to {vacationLimit} vacation appointments in your yearly vacation window.</p>
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
                      {vacationLimit} vacation appointments have already been used in the yearly vacation window for this visit.
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

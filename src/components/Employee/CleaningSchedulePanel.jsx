import { useEffect, useMemo, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { economicCustomerApi } from '../../api/economicCustomers.js';
import { userApi } from '../../api/users.js';
import { Icon } from '../Shared/Icon.jsx';
import {
  formatCalendarDay,
  formatDate,
  getDateKey,
  getUserEmail,
  getUserFirstName,
  getUserId,
  getUserLastName,
} from '../Admin/adminUtils.js';

const DEFAULT_TASKS = ['Kitchen surfaces', 'Bathroom reset', 'Floors', 'Final walkthrough'];
const CLEANING_CUSTOMER_GROUP_NUMBER = 5;
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30);

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 'Not set';

  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  const hourLabel = remainder ? (totalMinutes / 60).toFixed(1) : String(hours);

  return `${hourLabel} h`;
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

function toInputDateTime(value) {
  if (!value) return '';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value.trim())) {
    return value.trim().slice(0, 16);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDateTime(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

function addWeeksToDateTime(value, weeks) {
  const date = new Date(value);
  const weekCount = Number(weeks);
  if (Number.isNaN(date.getTime()) || !Number.isFinite(weekCount)) return '';

  date.setDate(date.getDate() + weekCount * 7);
  return toInputDateTime(date);
}

function getClientName(client) {
  const name = [client?.firstName, client?.lastName].filter(Boolean).join(' ');
  return name || client?.name || 'Unknown cleaning customer';
}

function getStaffName(staff) {
  const name = [staff?.firstName, staff?.lastName].filter(Boolean).join(' ');
  return name || staff?.email || 'Unassigned';
}

function splitCustomerName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1),
  };
}

function getCustomerGroupName(customer) {
  return customer?.customerGroup?.name || customer?.customerGroupName || '';
}

function getCustomerGroupNumber(customer) {
  return customer?.customerGroup?.customerGroupNumber ?? customer?.customerGroupNumber ?? null;
}

function isCleaningEconomicCustomer(customer) {
  const groupName = getCustomerGroupName(customer)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const groupNumber = Number(getCustomerGroupNumber(customer));

  return groupNumber === CLEANING_CUSTOMER_GROUP_NUMBER
    || groupName.includes('cleaning')
    || groupName.includes('rengoring')
    || groupName.includes('rengoering');
}

function buildCleaningClientSummaries(economicCustomers) {
  return economicCustomers
    .filter(isCleaningEconomicCustomer)
    .map((customer) => {
      const { firstName, lastName } = splitCustomerName(customer?.name);
      return {
        id: customer?.customerNumber,
        customerNumber: customer?.customerNumber,
        name: customer?.name || '',
        firstName,
        lastName,
        groupName: getCustomerGroupName(customer),
        groupNumber: getCustomerGroupNumber(customer),
      };
    })
    .filter((customer) => customer.customerNumber)
    .sort((a, b) => getClientName(a).localeCompare(getClientName(b), 'da'));
}

function buildCleaningStaffSummaries(users) {
  return users
    .filter((user) => {
      const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
      return roles
        .flatMap((role) => String(role || '').split(','))
        .map((role) => role.trim().replace(/^ROLE_/i, '').toUpperCase())
        .includes('CLEANING_STAFF');
    })
    .map((user) => ({
      id: getUserId(user),
      email: getUserEmail(user),
      firstName: getUserFirstName(user),
      lastName: getUserLastName(user),
    }))
    .filter((user) => user.id)
    .sort((a, b) => getStaffName(a).localeCompare(getStaffName(b)));
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
    economicCustomerNumber: appointment?.economicCustomerNumber ?? null,
    economicCustomerName: appointment?.economicCustomerName || '',
    projectId: parseOptionalId(appointment?.projectId),
    projectName: appointment?.projectName || '',
    durationMinutes: Number(appointment?.durationMinutes) || 0,
    cancellationTime: appointment?.cancellationTime || null,
    vacation: Boolean(appointment?.vacation),
    tasks: normalizeTasks(appointment?.tasks),
  };
}

function getAppointmentCustomerKey(appointment) {
  return appointment?.economicCustomerNumber != null
    ? String(appointment.economicCustomerNumber)
    : String(appointment?.cleaningClientId || '');
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .filter((task) => task?.title)
    .map((task, index) => ({
      id: parseOptionalId(task.id),
      title: String(task.title).trim(),
      completed: Boolean(task.completed),
      sortOrder: Number(task.sortOrder) || index + 1,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function buildTasksFromText(taskText, existingTasks = []) {
  const existingByTitle = Object.fromEntries(existingTasks.map((task) => [task.title.toLowerCase(), task]));

  return String(taskText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title, index) => {
      const existing = existingByTitle[title.toLowerCase()];
      return {
        id: existing?.id || null,
        title,
        completed: Boolean(existing?.completed),
        sortOrder: index + 1,
      };
    });
}

function buildTasksForCopy(tasks) {
  const sourceTasks = tasks?.length ? tasks : buildTasksFromText(DEFAULT_TASKS.join('\n'));

  return sourceTasks.map((task, index) => ({
    id: null,
    title: task.title,
    completed: false,
    sortOrder: Number(task.sortOrder) || index + 1,
  }));
}

function getWeekStart(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();

  date.setHours(0, 0, 0, 0);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function getWeekDays(value) {
  const startDate = getWeekStart(value);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: getDateKey(date),
      isToday: getDateKey(date) === getDateKey(new Date()),
    };
  });
}

function formatWeekRange(value) {
  const days = getWeekDays(value);
  const [firstDay] = days;
  const lastDay = days.at(-1);

  const dateFormatter = new Intl.DateTimeFormat('en-DK', {
    day: 'numeric',
    month: 'short',
  });

  return `${dateFormatter.format(firstDay.date)} - ${dateFormatter.format(lastDay.date)} ${lastDay.date.getFullYear()}`;
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

export function CleaningSchedulePanel({ user }) {
  const cleaningStaffId = Number(user?.id || user?.userId);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [economicCustomers, setEconomicCustomers] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [editCustomerNumber, setEditCustomerNumber] = useState('');
  const [editAppointmentTime, setEditAppointmentTime] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState('');
  const [copyIntervalWeeks, setCopyIntervalWeeks] = useState('1');

  const cleaningClients = useMemo(() => buildCleaningClientSummaries(economicCustomers), [economicCustomers]);
  const cleaningClientsById = useMemo(
    () => Object.fromEntries(cleaningClients.map((client) => [String(client.customerNumber), client])),
    [cleaningClients],
  );
  const cleaningStaff = useMemo(() => buildCleaningStaffSummaries(users), [users]);
  const cleaningStaffById = useMemo(
    () => Object.fromEntries(cleaningStaff.map((staff) => [String(staff.id), staff])),
    [cleaningStaff],
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

  const weekDays = useMemo(() => getWeekDays(calendarCursor), [calendarCursor]);
  const weekRangeLabel = useMemo(() => formatWeekRange(calendarCursor), [calendarCursor]);
  const weeklyAppointmentCount = useMemo(() => (
    weekDays.reduce((count, day) => count + (appointmentsByDay[day.key]?.length || 0), 0)
  ), [appointmentsByDay, weekDays]);
  const selectedAppointment = useMemo(
    () => sortedAppointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [selectedAppointmentId, sortedAppointments],
  );
  const selectedAppointmentCanBeEdited = !selectedAppointment
    || selectedAppointment.cleaningStaffId == null
    || selectedAppointment.cleaningStaffId === cleaningStaffId;
  const selectedDayLabel = formatCalendarDay(selectedDateKey);
  useEffect(() => {
    if (!cleaningStaffId) return;

    let ignore = false;

    async function loadSchedule() {
      setScheduleLoading(true);
      setScheduleError('');

      try {
        const [userData, appointmentData, economicCustomerData] = await Promise.all([
          userApi.getAll(),
          cleaningAppointmentApi.getAll(),
          economicCustomerApi.getAll(),
        ]);

        if (ignore) return;

        const nextUsers = normalizeListResponse(userData);
        const nextAppointmentData = normalizeListResponse(appointmentData);
        const nextEconomicCustomers = normalizeListResponse(economicCustomerData);
        const nextAppointments = nextAppointmentData.map(normalizeAppointment);

        setUsers(nextUsers);
        setEconomicCustomers(nextEconomicCustomers);
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
      const timeout = window.setTimeout(() => {
        setSelectedDateKey(getDateKey(selectedAppointment.appointmentTime));
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [selectedAppointment, selectedDateKey]);

  useEffect(() => {
    if (!selectedAppointmentId) return;

    if (!sortedAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
      const timeout = window.setTimeout(() => {
        setSelectedAppointmentId(null);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [selectedAppointmentId, sortedAppointments]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!selectedAppointment) {
        setEditCustomerNumber('');
        setEditAppointmentTime('');
        setEditDurationMinutes('');
        return;
      }

      setEditCustomerNumber(String(selectedAppointment.economicCustomerNumber || selectedAppointment.cleaningClientId || ''));
      setEditAppointmentTime(toInputDateTime(selectedAppointment.appointmentTime));
      setEditDurationMinutes(selectedAppointment.durationMinutes ? String(selectedAppointment.durationMinutes) : '');
    });
  }, [selectedAppointment]);

  function startEditAppointment(appointment) {
    if (!appointment) return;

    setSelectedAppointmentId(appointment.id);
    setSelectedDateKey(getDateKey(appointment.appointmentTime));
    setCalendarCursor(new Date(appointment.appointmentTime));
  }

  async function refreshSchedule(successMessage = '') {
    if (!cleaningStaffId) return [];

    setScheduleLoading(true);
    setScheduleError('');

    try {
      const appointmentData = await cleaningAppointmentApi.getAll();
      const nextAppointmentData = normalizeListResponse(appointmentData);
      const nextAppointments = nextAppointmentData.map(normalizeAppointment);
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

  async function handleAssignToSelf() {
    if (!selectedAppointment?.id || savingAction || !cleaningStaffId) return;

    setSavingAction('assign');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await cleaningAppointmentApi.update(selectedAppointment.id, {
        id: selectedAppointment.id,
        cleaningClientId: selectedAppointment.cleaningClientId || null,
        economicCustomerNumber: selectedAppointment.economicCustomerNumber || null,
        economicCustomerName: selectedAppointment.economicCustomerName || '',
        projectId: selectedAppointment.projectId || null,
        projectName: selectedAppointment.projectName || '',
        cleaningStaffId,
        appointmentTime: selectedAppointment.appointmentTime,
        durationMinutes: selectedAppointment.durationMinutes,
        vacation: selectedAppointment.vacation,
        tasks: selectedAppointment.tasks || [],
      });
      await refreshSchedule('Appointment assigned to you.');
      setSelectedAppointmentId(selectedAppointment.id);
    } catch (err) {
      setScheduleError(err.message || 'Could not assign the appointment to you.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleToggleTask(taskIndex, completed) {
    if (!selectedAppointment?.id || savingAction) return;
    if (selectedAppointment.cleaningStaffId && selectedAppointment.cleaningStaffId !== cleaningStaffId) {
      setScheduleError('This assignment belongs to another cleaning employee.');
      setScheduleSuccess('');
      return;
    }

    const nextTasks = (selectedAppointment.tasks?.length ? selectedAppointment.tasks : buildTasksFromText(DEFAULT_TASKS.join('\n')))
      .map((task, index) => (
        index === taskIndex
          ? { ...task, completed }
          : task
      ));

    setSavingAction('task');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await cleaningAppointmentApi.update(selectedAppointment.id, {
        id: selectedAppointment.id,
        cleaningClientId: selectedAppointment.cleaningClientId || null,
        economicCustomerNumber: selectedAppointment.economicCustomerNumber || null,
        economicCustomerName: selectedAppointment.economicCustomerName || '',
        projectId: selectedAppointment.projectId || null,
        projectName: selectedAppointment.projectName || '',
        cleaningStaffId: selectedAppointment.cleaningStaffId || cleaningStaffId,
        appointmentTime: selectedAppointment.appointmentTime,
        durationMinutes: selectedAppointment.durationMinutes,
        vacation: selectedAppointment.vacation,
        tasks: nextTasks,
      });
      await refreshSchedule('Task updated.');
      setSelectedAppointmentId(selectedAppointment.id);
    } catch (err) {
      setScheduleError(err.message || 'Could not update the task.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleSaveAssignment(event) {
    event.preventDefault();

    if (!selectedAppointment?.id || savingAction) return;
    if (!selectedAppointmentCanBeEdited) {
      setScheduleError('This assignment belongs to another cleaning employee.');
      setScheduleSuccess('');
      return;
    }

    const selectedClient = cleaningClientsById[String(editCustomerNumber)];
    if (!selectedClient) {
      setScheduleError('Choose a cleaning customer.');
      setScheduleSuccess('');
      return;
    }

    if (!editAppointmentTime) {
      setScheduleError('Choose a date and time.');
      setScheduleSuccess('');
      return;
    }

    const durationMinutes = Number(editDurationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes % 30 !== 0) {
      setScheduleError('Add a valid duration in half-hour increments.');
      setScheduleSuccess('');
      return;
    }

    setSavingAction('assignment');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      await cleaningAppointmentApi.update(selectedAppointment.id, {
        id: selectedAppointment.id,
        cleaningClientId: null,
        economicCustomerNumber: Number(editCustomerNumber),
        economicCustomerName: selectedClient.name || getClientName(selectedClient),
        projectId: selectedAppointment.projectId || null,
        projectName: `${selectedClient.name || getClientName(selectedClient)} cleaning project`,
        cleaningStaffId: selectedAppointment.cleaningStaffId || cleaningStaffId,
        appointmentTime: toApiDateTime(editAppointmentTime),
        durationMinutes,
        vacation: selectedAppointment.vacation,
        tasks: selectedAppointment.tasks || [],
      });
      await refreshSchedule('Assignment updated.');
      setSelectedAppointmentId(selectedAppointment.id);
      setSelectedDateKey(getDateKey(editAppointmentTime));
      setCalendarCursor(new Date(editAppointmentTime));
    } catch (err) {
      setScheduleError(err.message || 'Could not update the assignment.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleCopyAssignment() {
    if (!selectedAppointment?.id || savingAction) return;
    if (!selectedAppointmentCanBeEdited) {
      setScheduleError('This assignment belongs to another cleaning employee.');
      setScheduleSuccess('');
      return;
    }

    const selectedClient = cleaningClientsById[String(editCustomerNumber)];
    if (!selectedClient) {
      setScheduleError('Choose a cleaning customer.');
      setScheduleSuccess('');
      return;
    }

    if (!editAppointmentTime) {
      setScheduleError('Choose a date and time before copying.');
      setScheduleSuccess('');
      return;
    }

    const durationMinutes = Number(editDurationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes % 30 !== 0) {
      setScheduleError('Add a valid duration in half-hour increments.');
      setScheduleSuccess('');
      return;
    }

    const weeks = Number(copyIntervalWeeks);
    if (!Number.isFinite(weeks) || weeks < 1 || weeks > 4) {
      setScheduleError('Choose a copy interval from 1 to 4 weeks.');
      setScheduleSuccess('');
      return;
    }

    const copiedAppointmentTime = addWeeksToDateTime(editAppointmentTime, weeks);
    if (!copiedAppointmentTime) {
      setScheduleError('Could not calculate the copied appointment date.');
      setScheduleSuccess('');
      return;
    }

    setSavingAction('copy-assignment');
    setScheduleError('');
    setScheduleSuccess('');

    try {
      const createdAppointment = await cleaningAppointmentApi.create({
        cleaningClientId: null,
        economicCustomerNumber: Number(editCustomerNumber),
        economicCustomerName: selectedClient.name || getClientName(selectedClient),
        projectId: selectedAppointment.projectId || null,
        projectName: `${selectedClient.name || getClientName(selectedClient)} cleaning project`,
        cleaningStaffId: selectedAppointment.cleaningStaffId || cleaningStaffId,
        appointmentTime: toApiDateTime(copiedAppointmentTime),
        durationMinutes,
        vacation: false,
        tasks: buildTasksForCopy(selectedAppointment.tasks),
      });

      const nextAppointments = await refreshSchedule(`Assignment copied ${weeks} week${weeks === 1 ? '' : 's'} ahead.`);
      const createdId = parseOptionalId(createdAppointment?.id);
      if (createdId && nextAppointments.some((appointment) => appointment.id === createdId)) {
        setSelectedAppointmentId(createdId);
      }
      setSelectedDateKey(getDateKey(copiedAppointmentTime));
      setCalendarCursor(new Date(copiedAppointmentTime));
    } catch (err) {
      setScheduleError(err.message || 'Could not copy the assignment.');
    } finally {
      setSavingAction('');
    }
  }

  return (
    <section className="profile-requests employee-worklogs">
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
        <div className="employee-cleaning-stack">
          {scheduleLoading && sortedAppointments.length === 0 && (
            <div className="profile-empty">Loading your cleaning schedule...</div>
          )}

          <div className="employee-cleaning-layout employee-cleaning-schedule-flow">
            <section className="admin-calendar-board employee-cleaning-week-board" aria-label="Weekly cleaning appointment calendar">
              <div className="admin-calendar-head employee-cleaning-week-head">
                <button
                  className="admin-calendar-nav"
                  type="button"
                  onClick={() => setCalendarCursor((current) => {
                    const nextDate = new Date(current);
                    nextDate.setDate(nextDate.getDate() - 7);
                    return nextDate;
                  })}
                  aria-label="Previous week"
                >
                  <Icon name="chevL" size={18} />
                </button>
                <div>
                  <span>Weekly schedule</span>
                  <h3>{weekRangeLabel}</h3>
                  <p>{weeklyAppointmentCount} assignment{weeklyAppointmentCount === 1 ? '' : 's'} this week</p>
                </div>
                <div className="employee-cleaning-week-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setCalendarCursor(new Date())}>
                    Today
                  </button>
                  <button
                    className="admin-calendar-nav"
                    type="button"
                    onClick={() => setCalendarCursor((current) => {
                      const nextDate = new Date(current);
                      nextDate.setDate(nextDate.getDate() + 7);
                      return nextDate;
                    })}
                    aria-label="Next week"
                  >
                    <Icon name="chev" size={18} />
                  </button>
                </div>
              </div>

              <div className="employee-cleaning-week-grid">
                {weekDays.map((day) => {
                  const dayAppointments = appointmentsByDay[day.key] || [];
                  const isSelectedDay = day.key === selectedDateKey;

                  return (
                    <div
                      className={`employee-cleaning-week-day ${day.isToday ? 'today' : ''} ${isSelectedDay ? 'employee-cleaning-day-selected' : ''}`}
                      key={day.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedDateKey(day.key);
                        setCalendarCursor(day.date);
                        if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                          setSelectedAppointmentId(dayAppointments[0]?.id || null);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedDateKey(day.key);
                          setCalendarCursor(day.date);
                          if (!dayAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
                            setSelectedAppointmentId(dayAppointments[0]?.id || null);
                          }
                        }
                      }}
                    >
                      <div className="employee-cleaning-week-day-head">
                        <span>{new Intl.DateTimeFormat('en-DK', { weekday: 'short' }).format(day.date)}</span>
                        <strong>{day.date.getDate()}</strong>
                      </div>
                      <div className="employee-cleaning-week-events">
                        {dayAppointments.map((appointment) => {
                          const isSelected = selectedAppointment?.id === appointment.id;
                          const client = cleaningClientsById[getAppointmentCustomerKey(appointment)];

                          return (
                            <button
                              className={`admin-calendar-event ${isSelected ? 'selected' : ''}`}
                              type="button"
                              key={appointment.id || `${appointment.appointmentTime}-${getAppointmentCustomerKey(appointment)}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditAppointment(appointment);
                              }}
                            >
                              <strong>{formatTimeOnly(appointment.appointmentTime)}</strong>
                              <small>
                                {getClientName(client)}
                                {' · '}
                                {appointment.cleaningStaffId
                                  ? getStaffName(cleaningStaffById[String(appointment.cleaningStaffId)])
                                  : 'Unassigned'}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                      {dayAppointments.length === 0 && (
                        <div className="employee-cleaning-week-empty">No visits</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <article className="employee-history-detail employee-cleaning-detail employee-cleaning-detail-popup">
              <div className="employee-history-head">
                <div>
                  <span>{selectedAppointment ? 'Selected appointment' : 'Selected day'}</span>
                  <h3>{selectedAppointment ? getClientName(cleaningClientsById[getAppointmentCustomerKey(selectedAppointment)]) : selectedDayLabel}</h3>
                </div>
                <div className="employee-status-pill">
                  {selectedAppointment
                    ? (selectedAppointment.vacation ? 'Vacation' : selectedAppointment.projectName || 'Scheduled')
                    : 'No appointment selected'}
                </div>
              </div>

              {selectedAppointment ? (
                <>
                  <dl className="employee-history-grid">
                    <div>
                      <dt>Customer</dt>
                      <dd>{getClientName(cleaningClientsById[getAppointmentCustomerKey(selectedAppointment)])}</dd>
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
                      <dd>
                        {selectedAppointment.cleaningStaffId
                          ? getStaffName(cleaningStaffById[String(selectedAppointment.cleaningStaffId)])
                          : 'Unassigned'}
                      </dd>
                    </div>
                  </dl>

                  <form className="employee-cleaning-day-section employee-cleaning-assignment-edit" onSubmit={handleSaveAssignment}>
                    <div className="employee-cleaning-day-head">
                      <h4>Edit assignment</h4>
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label>Customer</label>
                        <select
                          value={editCustomerNumber}
                          onChange={(event) => setEditCustomerNumber(event.target.value)}
                          disabled={!selectedAppointmentCanBeEdited || !cleaningClients.length}
                        >
                          {!cleaningClients.length && <option value="">No cleaning customers available</option>}
                          {cleaningClients.map((client) => (
                            <option key={client.customerNumber} value={client.customerNumber}>
                              {getClientName(client)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Date and time</label>
                        <input
                          type="datetime-local"
                          value={editAppointmentTime}
                          onChange={(event) => setEditAppointmentTime(event.target.value)}
                          disabled={!selectedAppointmentCanBeEdited}
                        />
                      </div>

                      <div className="field">
                        <label>Duration</label>
                        <select
                          value={editDurationMinutes}
                          onChange={(event) => setEditDurationMinutes(event.target.value)}
                          disabled={!selectedAppointmentCanBeEdited}
                        >
                          {DURATION_OPTIONS.map((minutes) => (
                            <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Copy every</label>
                        <select
                          value={copyIntervalWeeks}
                          onChange={(event) => setCopyIntervalWeeks(event.target.value)}
                          disabled={!selectedAppointmentCanBeEdited}
                        >
                          {[1, 2, 3, 4].map((weeks) => (
                            <option key={weeks} value={weeks}>
                              {weeks} week{weeks === 1 ? '' : 's'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="employee-actions">
                      <button
                        className="btn btn-blue"
                        type="submit"
                        disabled={savingAction === 'assignment' || !selectedAppointmentCanBeEdited}
                      >
                        {savingAction === 'assignment' ? 'Saving...' : 'Save assignment'}
                        <Icon name="arrow" size={18} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={handleCopyAssignment}
                        disabled={savingAction === 'copy-assignment' || !selectedAppointmentCanBeEdited}
                      >
                        {savingAction === 'copy-assignment' ? 'Copying...' : 'Copy assignment'}
                        <Icon name="plus" size={18} />
                      </button>
                    </div>
                  </form>

                  <div className="employee-cleaning-day-section">
                    <div className="employee-cleaning-day-head">
                      <h4>Tasks</h4>
                    </div>
                    {(selectedAppointment.tasks?.length ? selectedAppointment.tasks : buildTasksFromText(DEFAULT_TASKS.join('\n'))).map((task, index) => (
                      <label className="employee-cleaning-checkbox employee-cleaning-task" key={task.id || `${task.title}-${index}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(task.completed)}
                          disabled={!selectedAppointmentCanBeEdited || savingAction === 'task'}
                          onChange={(event) => handleToggleTask(index, event.target.checked)}
                        />
                        <span>{task.title}</span>
                      </label>
                    ))}
                  </div>

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
                  Choose an appointment in the weekly calendar to see the visit details and task checklist.
                </div>
              )}

            </article>
          </div>
        </div>
      )}
    </section>
  );
}

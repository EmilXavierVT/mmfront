import { useEffect, useMemo, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { economicCustomerApi } from '../../api/economicCustomers.js';
import { workLogApi } from '../../api/worklogs.js';
import { ChangePasswordPanel } from '../Auth/ChangePasswordPanel.jsx';
import { AccountDetailsPanel } from '../Profile/AccountDetailsPanel.jsx';
import { CleaningSchedulePanel } from './CleaningSchedulePanel.jsx';
import { Icon } from '../Shared/Icon.jsx';

const ACTIVE_WORKLOG_STORAGE_KEY = 'mm_active_worklog_id';
const CLEANING_CUSTOMER_GROUP_NUMBER = 5;
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30);

function pad(part) {
  return String(part).padStart(2, '0');
}

function getNowInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getTodayDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

function getDateKey(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toAssignmentDateTime(dateValue) {
  if (!dateValue) return null;

  return `${dateValue}T09:00:00`;
}

function addSeconds(value, seconds) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  date.setSeconds(date.getSeconds() + seconds, 0);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateTime(value) {
  if (!value) return 'Not set';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('da-DK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOnly(value) {
  if (!value) return 'Not set';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleTimeString('da-DK', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return 'Duration not set';

  const hours = Math.floor(value / 60);
  const rest = value % 60;
  const hourLabel = rest ? (value / 60).toFixed(1) : String(hours);
  return `${hourLabel} h`;
}

function compareDateTimesDescending(a, b) {
  return new Date(b?.startTime || 0) - new Date(a?.startTime || 0);
}

function findMatchingWorkLog(workLogs, payload, userId) {
  if (!Array.isArray(workLogs)) return null;

  const startTime = payload?.startTime || null;
  const endTime = payload?.endTime || null;

  return workLogs.find((workLog) => (
    String(workLog?.userId ?? userId) === String(userId)
    && String(workLog?.startTime || '') === String(startTime || '')
    && String(workLog?.endTime || '') === String(endTime || '')
  )) || null;
}

function validateWorkLogTimes(startValue, endValue) {
  if (!startValue) {
    return 'Add a check-in time.';
  }

  if (!endValue) return '';

  const startDate = new Date(startValue);
  const endDate = new Date(endValue);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Add valid times.';
  }

  if (endDate < startDate) {
    return 'Check-out must be later than check-in.';
  }

  return '';
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

function getCleaningCustomerName(customer) {
  return customer?.name || 'Unknown cleaning customer';
}

function getAppointmentCustomerName(appointment) {
  return appointment?.economicCustomerName
    || appointment?.cleaningClientName
    || appointment?.projectName
    || 'Cleaning customer';
}

export function Employee({ user, onLogout, onUserUpdated }) {
  const isCleaningStaff = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
    .flatMap(value => String(value || '').split(','))
    .map(value => value.trim().replace(/^ROLE_/i, '').toUpperCase())
    .includes('CLEANING_STAFF');
  const [activeTab, setActiveTab] = useState('shift');
  const [workLogs, setWorkLogs] = useState([]);
  const [workLogsLoading, setWorkLogsLoading] = useState(false);
  const [workLogsError, setWorkLogsError] = useState('');
  const [workLogsSuccess, setWorkLogsSuccess] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [shiftStartInput, setShiftStartInput] = useState(getNowInputValue());
  const [shiftEndInput, setShiftEndInput] = useState('');
  const [selectedHistoryLogId, setSelectedHistoryLogId] = useState(null);
  const [historyStartInput, setHistoryStartInput] = useState('');
  const [historyEndInput, setHistoryEndInput] = useState('');
  const [assignmentCustomers, setAssignmentCustomers] = useState([]);
  const [assignmentCustomerNumber, setAssignmentCustomerNumber] = useState('');
  const [assignmentDate, setAssignmentDate] = useState(getTodayDateValue());
  const [assignmentDurationMinutes, setAssignmentDurationMinutes] = useState('120');
  const [cleaningAppointments, setCleaningAppointments] = useState([]);
  const [cleaningAppointmentsLoading, setCleaningAppointmentsLoading] = useState(false);
  const [selectedTodayAppointmentId, setSelectedTodayAppointmentId] = useState(null);
  const [activeWorkLogId, setActiveWorkLogId] = useState(() => {
    const stored = localStorage.getItem(ACTIVE_WORKLOG_STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const userId = user?.id || user?.userId;
  const employeeTabs = useMemo(() => ([
    ['shift', 'Current shift'],
    ...(isCleaningStaff ? [['cleaning', 'Cleaning schedule']] : []),
    ['history', 'Worklog history'],
    ['account', 'Account'],
  ]), [isCleaningStaff]);

  const sortedWorkLogs = useMemo(
    () => [...workLogs].sort(compareDateTimesDescending),
    [workLogs],
  );

  const activeWorkLog = useMemo(
    () => sortedWorkLogs.find(workLog => workLog.id === activeWorkLogId) || null,
    [activeWorkLogId, sortedWorkLogs],
  );

  const completedWorkLogs = useMemo(
    () => sortedWorkLogs.filter(workLog => workLog.id !== activeWorkLog?.id),
    [activeWorkLog?.id, sortedWorkLogs],
  );

  const selectedHistoryLog = useMemo(
    () => completedWorkLogs.find(workLog => workLog.id === selectedHistoryLogId) || completedWorkLogs[0] || null,
    [completedWorkLogs, selectedHistoryLogId],
  );
  const assignmentCustomersByNumber = useMemo(
    () => Object.fromEntries(assignmentCustomers.map((customer) => [String(customer.customerNumber), customer])),
    [assignmentCustomers],
  );
  const todayCleaningAppointments = useMemo(() => {
    if (!isCleaningStaff || !userId) return [];

    return cleaningAppointments
      .filter((appointment) => (
        String(appointment?.cleaningStaffId || '') === String(userId)
        && getDateKey(appointment?.appointmentTime) === getTodayDateValue()
        && !appointment?.cancellationTime
        && !appointment?.vacation
      ))
      .sort((a, b) => new Date(a.appointmentTime || 0) - new Date(b.appointmentTime || 0));
  }, [cleaningAppointments, isCleaningStaff, userId]);
  const selectedTodayAppointment = useMemo(
    () => todayCleaningAppointments.find((appointment) => String(appointment.id) === String(selectedTodayAppointmentId)) || todayCleaningAppointments[0] || null,
    [selectedTodayAppointmentId, todayCleaningAppointments],
  );

  useEffect(() => {
    if (employeeTabs.some(([tab]) => tab === activeTab)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveTab(employeeTabs[0][0]);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [activeTab, employeeTabs]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let ignore = false;

    async function loadWorkLogs() {
      setWorkLogsLoading(true);
      setWorkLogsError('');

      try {
        const data = await workLogApi.getByUserId(userId);
        if (!ignore) {
          setWorkLogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setWorkLogsError(err.message || 'Could not load your worklogs.');
        }
      } finally {
        if (!ignore) {
          setWorkLogsLoading(false);
        }
      }
    }

    loadWorkLogs();

    return () => {
      ignore = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!isCleaningStaff) return;

    let ignore = false;

    async function loadCleaningCustomers() {
      try {
        const data = await economicCustomerApi.getAll();
        if (ignore) return;

        const nextCustomers = normalizeListResponse(data)
          .filter(isCleaningEconomicCustomer)
          .filter((customer) => customer?.customerNumber)
          .sort((a, b) => getCleaningCustomerName(a).localeCompare(getCleaningCustomerName(b), 'da'));

        setAssignmentCustomers(nextCustomers);
        setAssignmentCustomerNumber((current) => current || String(nextCustomers[0]?.customerNumber || ''));
      } catch (err) {
        if (!ignore) {
          setWorkLogsError(err.message || 'Could not load cleaning customers.');
        }
      }
    }

    loadCleaningCustomers();

    return () => {
      ignore = true;
    };
  }, [isCleaningStaff]);

  useEffect(() => {
    if (!isCleaningStaff || !userId) return;

    let ignore = false;

    async function loadCleaningAppointments() {
      setCleaningAppointmentsLoading(true);

      try {
        const data = await cleaningAppointmentApi.getAll();
        if (!ignore) {
          setCleaningAppointments(normalizeListResponse(data));
        }
      } catch (err) {
        if (!ignore) {
          setWorkLogsError(err.message || 'Could not load your cleaning appointments.');
        }
      } finally {
        if (!ignore) {
          setCleaningAppointmentsLoading(false);
        }
      }
    }

    loadCleaningAppointments();

    return () => {
      ignore = true;
    };
  }, [isCleaningStaff, userId]);

  useEffect(() => {
    if (activeWorkLogId && !sortedWorkLogs.some(workLog => workLog.id === activeWorkLogId)) {
      Promise.resolve().then(() => {
        setActiveWorkLogId(null);
        localStorage.removeItem(ACTIVE_WORKLOG_STORAGE_KEY);
      });
    }
  }, [activeWorkLogId, sortedWorkLogs]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (activeWorkLog) {
        setShiftStartInput(toInputDateTime(activeWorkLog.startTime));
        setShiftEndInput('');
        return;
      }

      setShiftStartInput(getNowInputValue());
      setShiftEndInput('');
    });
  }, [activeWorkLog]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!completedWorkLogs.length) {
        setSelectedHistoryLogId(null);
        return;
      }

      setSelectedHistoryLogId((current) => (
        completedWorkLogs.some(workLog => workLog.id === current) ? current : completedWorkLogs[0].id
      ));
    });
  }, [completedWorkLogs]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!selectedHistoryLog) {
        setHistoryStartInput('');
        setHistoryEndInput('');
        return;
      }

      setHistoryStartInput(toInputDateTime(selectedHistoryLog.startTime));
      setHistoryEndInput(toInputDateTime(selectedHistoryLog.endTime));
    });
  }, [selectedHistoryLog]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!todayCleaningAppointments.length) {
        setSelectedTodayAppointmentId(null);
        return;
      }

      setSelectedTodayAppointmentId((current) => (
        todayCleaningAppointments.some((appointment) => String(appointment.id) === String(current))
          ? current
          : todayCleaningAppointments[0].id
      ));
    });
  }, [todayCleaningAppointments]);

  async function refreshWorkLogs(successMessage = '') {
    if (!userId) return;

    setWorkLogsLoading(true);
    setWorkLogsError('');

    try {
      const data = await workLogApi.getByUserId(userId);
      const nextWorkLogs = Array.isArray(data) ? data : [];
      setWorkLogs(nextWorkLogs);
      setWorkLogsSuccess(successMessage);
      return nextWorkLogs;
    } catch (err) {
      setWorkLogsError(err.message || 'Could not load your worklogs.');
      return [];
    } finally {
      setWorkLogsLoading(false);
    }
  }

  async function refreshCleaningAppointments() {
    if (!isCleaningStaff || !userId) return [];

    setCleaningAppointmentsLoading(true);

    try {
      const data = await cleaningAppointmentApi.getAll();
      const nextAppointments = normalizeListResponse(data);
      setCleaningAppointments(nextAppointments);
      return nextAppointments;
    } catch (err) {
      setWorkLogsError(err.message || 'Could not load your cleaning appointments.');
      return [];
    } finally {
      setCleaningAppointmentsLoading(false);
    }
  }

  function refreshCurrentShift() {
    refreshWorkLogs();
    refreshCleaningAppointments();
  }

  async function createWorkLog(payload, successMessage, actionName) {
    if (!userId) {
      setWorkLogsError('Your user id is missing from the session.');
      return;
    }

    setSavingAction(actionName);
    setWorkLogsError('');
    setWorkLogsSuccess('');

    try {
      const createdWorkLog = await workLogApi.create({ ...payload, userId });
      let nextActiveId = null;

      if (actionName === 'check-in-now' || actionName === 'save-shift-open') {
        const createdId = Number(createdWorkLog?.id);
        nextActiveId = Number.isFinite(createdId) ? createdId : null;
      }

      const nextWorkLogs = await refreshWorkLogs(successMessage);

      if ((actionName === 'check-in-now' || actionName === 'save-shift-open') && !nextActiveId) {
        const matchedWorkLog = findMatchingWorkLog(nextWorkLogs, payload, userId);
        const matchedId = Number(matchedWorkLog?.id);
        nextActiveId = Number.isFinite(matchedId) ? matchedId : null;
      }

      if (nextActiveId) {
        setActiveWorkLogId(nextActiveId);
        localStorage.setItem(ACTIVE_WORKLOG_STORAGE_KEY, String(nextActiveId));
      }
    } catch (err) {
      setWorkLogsError(err.message || 'Could not save your worklog.');
    } finally {
      setSavingAction('');
    }
  }

  async function updateWorkLog(workLogId, payload, successMessage, actionName) {
    setSavingAction(actionName);
    setWorkLogsError('');
    setWorkLogsSuccess('');

    try {
      await workLogApi.update(workLogId, payload);
      if (payload?.endTime) {
        setActiveWorkLogId((current) => {
          if (current !== workLogId) return current;
          localStorage.removeItem(ACTIVE_WORKLOG_STORAGE_KEY);
          return null;
        });
      }
      await refreshWorkLogs(successMessage);
    } catch (err) {
      setWorkLogsError(err.message || 'Could not update your worklog.');
    } finally {
      setSavingAction('');
    }
  }

  function handleCheckInNow() {
    if (isCleaningStaff && !selectedTodayAppointment) {
      setWorkLogsError('Create or choose an assignment for today before checking in.');
      setWorkLogsSuccess('');
      return;
    }

    const startTime = getNowInputValue();

    createWorkLog({
      startTime: toApiDateTime(startTime),
      // Backend currently requires endTime on create and it must be after startTime.
      endTime: addSeconds(startTime, 1),
    }, 'Checked in.', 'check-in-now');
  }

  function handleCheckOutNow() {
    if (!activeWorkLog) return;

    const endTime = getNowInputValue();
    const validationError = validateWorkLogTimes(shiftStartInput, endTime);
    if (validationError) {
      setWorkLogsError(validationError);
      setWorkLogsSuccess('');
      return;
    }

    updateWorkLog(activeWorkLog.id, {
      id: activeWorkLog.id,
      startTime: toApiDateTime(shiftStartInput),
      endTime: toApiDateTime(endTime),
      userId,
    }, 'Checked out.', 'check-out-now');
  }

  async function handleCreateCleaningAssignment(event) {
    event.preventDefault();

    if (!userId) {
      setWorkLogsError('Your user id is missing from the session.');
      setWorkLogsSuccess('');
      return;
    }

    if (!assignmentCustomerNumber) {
      setWorkLogsError('Choose a cleaning customer.');
      setWorkLogsSuccess('');
      return;
    }

    if (!assignmentDate) {
      setWorkLogsError('Choose an assignment date.');
      setWorkLogsSuccess('');
      return;
    }

    const durationMinutes = Number(assignmentDurationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes % 30 !== 0) {
      setWorkLogsError('Add a valid assignment duration in half-hour increments.');
      setWorkLogsSuccess('');
      return;
    }

    const customer = assignmentCustomersByNumber[String(assignmentCustomerNumber)];
    if (!customer) {
      setWorkLogsError('The selected cleaning customer is not available.');
      setWorkLogsSuccess('');
      return;
    }

    setSavingAction('create-assignment');
    setWorkLogsError('');
    setWorkLogsSuccess('');

    try {
      const createdAppointment = await cleaningAppointmentApi.create({
        economicCustomerNumber: Number(assignmentCustomerNumber),
        economicCustomerName: getCleaningCustomerName(customer),
        projectName: `${getCleaningCustomerName(customer)} cleaning project`,
        cleaningStaffId: Number(userId),
        appointmentTime: toAssignmentDateTime(assignmentDate),
        durationMinutes,
        vacation: false,
        tasks: [],
      });

      const nextAppointments = await refreshCleaningAppointments();
      const createdId = Number(createdAppointment?.id);
      if (
        Number.isFinite(createdId)
        && nextAppointments.some((appointment) => (
          String(appointment.id) === String(createdId)
          && String(appointment.cleaningStaffId || '') === String(userId)
          && getDateKey(appointment.appointmentTime) === getTodayDateValue()
        ))
      ) {
        setSelectedTodayAppointmentId(createdId);
      }
      await refreshWorkLogs('');

      setWorkLogsSuccess(
        assignmentDate === getTodayDateValue()
          ? 'Assignment created. You can check in now.'
          : 'Assignment created. You can check in when the assignment is for today.',
      );
    } catch (err) {
      setWorkLogsError(err.message || 'Could not create the cleaning assignment.');
    } finally {
      setSavingAction('');
    }
  }

  function handleSaveHistoryLog() {
    if (!selectedHistoryLog) return;

    const validationError = validateWorkLogTimes(historyStartInput, historyEndInput);
    if (validationError) {
      setWorkLogsError(validationError);
      setWorkLogsSuccess('');
      return;
    }

    updateWorkLog(selectedHistoryLog.id, {
      id: selectedHistoryLog.id,
      startTime: toApiDateTime(historyStartInput),
      endTime: toApiDateTime(historyEndInput),
      userId,
    }, 'Worklog updated.', 'save-history-log');
  }

  return (
    <main className="profile-page employee-page">
      <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Employee</div>
          <h1>{isCleaningStaff ? 'Work hours and cleaning.' : 'Work hours.'}</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-cream" type="button" onClick={onLogout}>
          Log out <Icon name="logout" size={18} />
        </button>
      </section>

      <div className="employee-tabs" role="tablist" aria-label="Employee sections">
        {employeeTabs.map(([value, label]) => (
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

      {activeTab === 'shift' && (
        <section className="profile-requests employee-worklogs">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Shift</div>
              <h2>{activeWorkLog ? 'Manage current shift' : 'Check in for today'}</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={refreshCurrentShift} disabled={workLogsLoading || cleaningAppointmentsLoading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          {!userId && (
            <div className="profile-empty">We could not find your user id in the login session.</div>
          )}

          {userId && workLogsLoading && sortedWorkLogs.length === 0 && (
            <div className="profile-empty">Loading worklogs...</div>
          )}

          {userId && (
            <>
              <div className="profile-panel employee-editor-panel">
                {activeWorkLog ? (
                  <>
                    <span>Current shift</span>
                    <h2>Check out or correct time</h2>
                    <p>Use check-out now to capture the current moment. Older worklogs can be corrected from the history tab.</p>

                    <div className="field-row">
                      <div className="field">
                        <label>Check-in time</label>
                        <input
                          type="datetime-local"
                          value={shiftStartInput}
                          onChange={(event) => setShiftStartInput(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Check-out time</label>
                        <input
                          type="datetime-local"
                          value={shiftEndInput}
                          onChange={(event) => setShiftEndInput(event.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="employee-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={handleCheckOutNow}
                        disabled={savingAction === 'check-out-now'}
                      >
                        {savingAction === 'check-out-now' ? 'Saving...' : 'Check out now'}
                        <Icon name="check" size={18} />
                      </button>
                    </div>
                  </>
                ) : isCleaningStaff ? (
                  <>
                    <span>Today</span>
                    <h2>{selectedTodayAppointment ? "Check in for today's assignment" : 'No assignment today'}</h2>
                    <p>
                      {selectedTodayAppointment
                        ? "Check in when you arrive for one of today's assigned cleaning appointments."
                        : 'Create a new assignment for today before checking in.'}
                    </p>

                    {cleaningAppointmentsLoading && (
                      <div className="profile-empty">Loading today's assignments...</div>
                    )}

                    {!cleaningAppointmentsLoading && todayCleaningAppointments.length > 0 && (
                      <>
                        {todayCleaningAppointments.length > 1 && (
                          <div className="field-row">
                            <div className="field">
                              <label>Assignment</label>
                              <select
                                value={selectedTodayAppointment?.id || ''}
                                onChange={(event) => setSelectedTodayAppointmentId(event.target.value)}
                              >
                                {todayCleaningAppointments.map((appointment) => (
                                  <option key={appointment.id} value={appointment.id}>
                                    {getAppointmentCustomerName(appointment)} - {formatTimeOnly(appointment.appointmentTime)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {selectedTodayAppointment && (
                          <dl className="employee-history-grid">
                            <div>
                              <dt>Customer</dt>
                              <dd>{getAppointmentCustomerName(selectedTodayAppointment)}</dd>
                            </div>
                            <div>
                              <dt>Time</dt>
                              <dd>{formatTimeOnly(selectedTodayAppointment.appointmentTime)}</dd>
                            </div>
                            <div>
                              <dt>Duration</dt>
                              <dd>{formatDuration(selectedTodayAppointment.durationMinutes)}</dd>
                            </div>
                          </dl>
                        )}
                      </>
                    )}

                    {!cleaningAppointmentsLoading && !todayCleaningAppointments.length && (
                      <div className="profile-empty">No cleaning assignment is assigned to you today.</div>
                    )}

                    <div className="employee-actions">
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={handleCheckInNow}
                        disabled={savingAction === 'check-in-now' || !selectedTodayAppointment}
                      >
                        {savingAction === 'check-in-now' ? 'Saving...' : 'Check in now'}
                        <Icon name="check" size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>New worklog</span>
                    <h2>Start a shift</h2>
                    <p>Use check-in now to start your shift. You can correct the check-in time before checking out.</p>

                    <div className="field-row">
                      <div className="field">
                        <label>Check-in time</label>
                        <input
                          type="datetime-local"
                          value={shiftStartInput}
                          onChange={(event) => setShiftStartInput(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="employee-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleCheckInNow}
                      disabled={savingAction === 'check-in-now'}
                    >
                      {savingAction === 'check-in-now' ? 'Saving...' : 'Check in now'}
                      <Icon name="check" size={18} />
                    </button>
                    </div>
                  </>
                )}
              </div>

              {isCleaningStaff && (
                <form className="profile-panel employee-editor-panel employee-assignment-panel" onSubmit={handleCreateCleaningAssignment}>
                  <span>Cleaning assignment</span>
                  <h2>Create a new assignment</h2>

                  <div className="field-row">
                    <div className="field">
                      <label>Customer</label>
                      <select
                        value={assignmentCustomerNumber}
                        onChange={(event) => setAssignmentCustomerNumber(event.target.value)}
                        disabled={!assignmentCustomers.length}
                      >
                        {!assignmentCustomers.length && <option value="">No cleaning customers available</option>}
                        {assignmentCustomers.map((customer) => (
                          <option key={customer.customerNumber} value={customer.customerNumber}>
                            {getCleaningCustomerName(customer)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>Date</label>
                      <input
                        type="date"
                        value={assignmentDate}
                        onChange={(event) => setAssignmentDate(event.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label>Duration</label>
                      <select
                        value={assignmentDurationMinutes}
                        onChange={(event) => setAssignmentDurationMinutes(event.target.value)}
                      >
                        {DURATION_OPTIONS.map((minutes) => (
                          <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="employee-actions">
                    <button
                      className="btn btn-blue"
                      type="submit"
                      disabled={savingAction === 'create-assignment' || !assignmentCustomers.length}
                    >
                      {savingAction === 'create-assignment' ? 'Creating...' : 'Create assignment'}
                      <Icon name="plus" size={18} />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      )}

      {activeTab === 'history' && (
        <section className="profile-requests employee-worklogs">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">History</div>
              <h2>Older worklogs</h2>
            </div>
          </div>

          {workLogsLoading && completedWorkLogs.length === 0 && (
            <div className="profile-empty">Loading worklog history...</div>
          )}

          {!workLogsLoading && completedWorkLogs.length === 0 && (
            <div className="profile-empty">No older worklogs yet. Completed shifts will show up here.</div>
          )}

          {completedWorkLogs.length > 0 && (
            <div className="employee-history-layout">
              <aside className="employee-history-list" aria-label="Worklog history">
                {completedWorkLogs.map((workLog) => {
                  const isSelected = selectedHistoryLog?.id === workLog.id;

                  return (
                    <button
                      className={`employee-history-row ${isSelected ? 'selected' : ''}`}
                      type="button"
                      key={workLog.id}
                      onClick={() => setSelectedHistoryLogId(workLog.id)}
                    >
                      <span>Worklog #{workLog.id}</span>
                      <strong>{formatDateTime(workLog.startTime)}</strong>
                      <small>
                        {workLog.endTime
                          ? `Ended ${formatDateTime(workLog.endTime)}`
                          : 'Still open'}
                      </small>
                    </button>
                  );
                })}
              </aside>

              <article className="employee-history-detail">
                {selectedHistoryLog && (
                  <>
                    <div className="employee-history-head">
                      <div>
                        <span>Selected worklog</span>
                        <h3>#{selectedHistoryLog.id}</h3>
                      </div>
                      <div className="employee-status-pill">
                        {selectedHistoryLog.endTime ? 'Completed' : 'Open'}
                      </div>
                    </div>

                    <dl className="employee-history-grid">
                      <div>
                        <dt>Start</dt>
                        <dd>{formatDateTime(selectedHistoryLog.startTime)}</dd>
                      </div>
                      <div>
                        <dt>End</dt>
                        <dd>{formatDateTime(selectedHistoryLog.endTime)}</dd>
                      </div>
                      <div>
                        <dt>User ID</dt>
                        <dd>{selectedHistoryLog.userId || userId || 'Not available'}</dd>
                      </div>
                    </dl>

                    <div className="employee-editor-panel profile-panel">
                      <span>Edit times</span>
                      <h2>Correct this worklog</h2>
                      <p>Update the stored check-in and check-out time if the original shift was missed.</p>

                      <div className="field-row">
                        <div className="field">
                          <label>Check-in time</label>
                          <input
                            type="datetime-local"
                            value={historyStartInput}
                            onChange={(event) => setHistoryStartInput(event.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label>Check-out time</label>
                          <input
                            type="datetime-local"
                            value={historyEndInput}
                            onChange={(event) => setHistoryEndInput(event.target.value)}
                          />
                        </div>
                      </div>

                      <div className="employee-actions">
                        <button
                          className="btn btn-blue"
                          type="button"
                          onClick={handleSaveHistoryLog}
                          disabled={savingAction === 'save-history-log'}
                        >
                          {savingAction === 'save-history-log' ? 'Saving...' : 'Save changes'}
                          <Icon name="arrow" size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            </div>
          )}
        </section>
      )}

      {activeTab === 'cleaning' && isCleaningStaff && (
        <CleaningSchedulePanel user={user} />
      )}

      {workLogsError && <div className="form-error employee-feedback">{workLogsError}</div>}
      {workLogsSuccess && <div className="form-success employee-feedback">{workLogsSuccess}</div>}

      {activeTab === 'account' && (
        <section className="profile-requests employee-worklogs">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Account</div>
              <h2>Security settings</h2>
            </div>
          </div>

          <section className="profile-grid profile-account-grid">
            <AccountDetailsPanel user={user} onUserUpdated={onUserUpdated} />
            <ChangePasswordPanel />
          </section>
        </section>
      )}

      <section className="profile-grid">
        <div className="profile-panel">
          <span>Current status</span>
          <h2>{activeWorkLog ? 'Currently checked in' : 'Checked out'}</h2>
          <p>
            {activeWorkLog
              ? `Checked in at ${formatDateTime(activeWorkLog.startTime)}`
              : 'No active shift is running right now.'}
          </p>
        </div>

        <div className="profile-panel accent">
          <span>Worklogs</span>
          <h2>{sortedWorkLogs.length}</h2>
          <p>{userId ? `Tracking worklogs for user #${userId}.` : 'Your user id is missing from the session.'}</p>
        </div>
      </section>
    </main>
  );
}

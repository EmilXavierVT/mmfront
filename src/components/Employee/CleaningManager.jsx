import { useEffect, useMemo, useState } from 'react';
import { cleaningAppointmentApi } from '../../api/cleaningAppointments.js';
import { userApi } from '../../api/users.js';
import {
  getDateKey,
  getUserEmail,
  getUserFirstName,
  getUserId,
  getUserLastName,
} from '../Admin/adminUtils.js';
import { AccountDetailsPanel } from '../Profile/AccountDetailsPanel.jsx';
import { ChangePasswordPanel } from '../Auth/ChangePasswordPanel.jsx';
import { Icon } from '../Shared/Icon.jsx';
import { CleaningSchedulePanel } from './CleaningSchedulePanel.jsx';

const DEFAULT_TASKS = ['Kitchen surfaces', 'Bathroom reset', 'Floors', 'Final walkthrough'];
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30);
const REPEAT_INTERVAL_OPTIONS = [1, 2, 3, 4];

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

function normalizeRoleValue(role) {
  if (!role) return [];
  if (typeof role === 'object') {
    return normalizeRoleValue(role.name || role.role || role.authority);
  }

  return String(role)
    .split(',')
    .map((item) => item.trim().replace(/^ROLE_/i, '').toUpperCase())
    .filter(Boolean);
}

function userHasRole(user, expectedRole) {
  return [
    user?.role,
    user?.roleDTO?.name,
    user?.userRole,
    user?.authority,
    user?.roles,
    user?.userDTO?.role,
    user?.userDTO?.roles,
  ]
    .flat()
    .flatMap(normalizeRoleValue)
    .includes(expectedRole);
}

function getStaffName(staff) {
  const name = [staff?.firstName, staff?.lastName].filter(Boolean).join(' ');
  return name || staff?.email || 'Unassigned';
}

function buildCleaningStaffSummaries(users) {
  return users
    .filter((nextUser) => userHasRole(nextUser, 'CLEANING_STAFF'))
    .map((nextUser) => ({
      id: getUserId(nextUser),
      email: getUserEmail(nextUser),
      firstName: getUserFirstName(nextUser),
      lastName: getUserLastName(nextUser),
    }))
    .filter((nextUser) => nextUser.id)
    .sort((a, b) => getStaffName(a).localeCompare(getStaffName(b), 'da'));
}

function parseOptionalId(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
  const existingByTitle = Object.fromEntries(
    existingTasks.map((task) => [task.title.toLowerCase(), task]),
  );

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

function buildTasksForNewAssignment(taskText) {
  const tasks = buildTasksFromText(taskText);
  const sourceTasks = tasks.length ? tasks : buildTasksFromText(DEFAULT_TASKS.join('\n'));

  return sourceTasks.map((task, index) => ({
    id: null,
    title: task.title,
    completed: false,
    sortOrder: index + 1,
  }));
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
    vacation: Boolean(appointment?.vacation),
    tasks: normalizeTasks(appointment?.tasks),
  };
}

function getProjectKey(appointment) {
  if (appointment?.projectId) return `project:${appointment.projectId}`;
  if (appointment?.economicCustomerNumber != null) return `economic:${appointment.economicCustomerNumber}`;
  if (appointment?.projectName) return `name:${appointment.projectName}`;
  return '';
}

function getProjectLabel(project) {
  return project?.projectName || project?.economicCustomerName || 'Cleaning project';
}

function buildProjectSummaries(appointments) {
  const projectsByKey = new Map();

  appointments.forEach((appointment) => {
    const key = getProjectKey(appointment);
    if (!key || projectsByKey.has(key)) return;

    const projectName = appointment.projectName
      || (appointment.economicCustomerName ? `${appointment.economicCustomerName} cleaning project` : '');

    projectsByKey.set(key, {
      key,
      projectId: appointment.projectId || null,
      projectName,
      economicCustomerNumber: appointment.economicCustomerNumber ?? null,
      economicCustomerName: appointment.economicCustomerName || projectName || 'Cleaning customer',
    });
  });

  return [...projectsByKey.values()]
    .sort((a, b) => getProjectLabel(a).localeCompare(getProjectLabel(b), 'da'));
}

function appointmentMatchesProject(appointment, project) {
  if (!appointment || !project) return false;
  if (project.projectId && appointment.projectId === project.projectId) return true;
  if (
    project.economicCustomerNumber != null
    && appointment.economicCustomerNumber != null
    && String(appointment.economicCustomerNumber) === String(project.economicCustomerNumber)
  ) {
    return true;
  }
  return getProjectKey(appointment) === project.key;
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

function getDefaultAssignmentStart() {
  const date = new Date();
  date.setMinutes(date.getMinutes() >= 30 ? 30 : 0, 0, 0);
  return toInputDateTime(date);
}

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return 'Not set';

  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  const hourLabel = remainder ? (totalMinutes / 60).toFixed(1) : String(hours);

  return `${hourLabel} h`;
}

export function CleaningManager({ user, onLogout, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('schedule');
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState('');
  const [managerSuccess, setManagerSuccess] = useState('');
  const [selectedProjectKey, setSelectedProjectKey] = useState('');
  const [appliesFrom, setAppliesFrom] = useState(() => getDateKey(new Date()));
  const [taskText, setTaskText] = useState(() => DEFAULT_TASKS.join('\n'));
  const [assignmentStaffId, setAssignmentStaffId] = useState('');
  const [assignmentStart, setAssignmentStart] = useState(getDefaultAssignmentStart);
  const [assignmentDurationMinutes, setAssignmentDurationMinutes] = useState('120');
  const [repeatIntervalWeeks, setRepeatIntervalWeeks] = useState('1');
  const [repeatCount, setRepeatCount] = useState('1');
  const [savingAction, setSavingAction] = useState('');
  const managerTabs = useMemo(() => ([
    ['schedule', 'Schedule'],
    ['tasks', 'Add tasks'],
    ['account', 'Account'],
  ]), []);
  const projects = useMemo(() => buildProjectSummaries(appointments), [appointments]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.key === selectedProjectKey) || null,
    [projects, selectedProjectKey],
  );
  const cleaningStaff = useMemo(() => buildCleaningStaffSummaries(users), [users]);
  const projectAppointments = useMemo(() => {
    if (!selectedProject) return [];

    return appointments
      .filter((appointment) => appointmentMatchesProject(appointment, selectedProject))
      .sort((a, b) => new Date(a.appointmentTime || 0) - new Date(b.appointmentTime || 0));
  }, [appointments, selectedProject]);

  useEffect(() => {
    if (activeTab !== 'tasks') return;

    let ignore = false;

    async function loadManagerData() {
      setManagerLoading(true);
      setManagerError('');

      try {
        const [appointmentData, userData] = await Promise.all([
          cleaningAppointmentApi.getAll(),
          userApi.getAll(),
        ]);

        if (ignore) return;

        setAppointments(normalizeListResponse(appointmentData).map(normalizeAppointment));
        setUsers(normalizeListResponse(userData));
      } catch (err) {
        if (!ignore) {
          setManagerError(err.message || 'Could not load cleaning manager data.');
        }
      } finally {
        if (!ignore) {
          setManagerLoading(false);
        }
      }
    }

    loadManagerData();

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  useEffect(() => {
    if (selectedProjectKey || !projects.length) return;

    const timeout = window.setTimeout(() => {
      setSelectedProjectKey(projects[0].key);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [projects, selectedProjectKey]);

  useEffect(() => {
    if (!assignmentStaffId && cleaningStaff.length) {
      const timeout = window.setTimeout(() => {
        setAssignmentStaffId(String(cleaningStaff[0].id));
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [assignmentStaffId, cleaningStaff]);

  useEffect(() => {
    if (!selectedProject) return;

    const timeout = window.setTimeout(() => {
      const firstFutureAppointment = projectAppointments.find((appointment) => (
        getDateKey(appointment.appointmentTime) >= appliesFrom
      ));
      const templateAppointment = firstFutureAppointment || projectAppointments[0];
      const nextTasks = templateAppointment?.tasks?.length
        ? templateAppointment.tasks
        : buildTasksFromText(DEFAULT_TASKS.join('\n'));

      setTaskText(nextTasks.map((task) => task.title).join('\n'));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [appliesFrom, projectAppointments, selectedProject]);

  useEffect(() => {
    if (assignmentStaffId && !cleaningStaff.some((staff) => String(staff.id) === String(assignmentStaffId))) {
      const timeout = window.setTimeout(() => {
        setAssignmentStaffId('');
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [assignmentStaffId, cleaningStaff]);

  useEffect(() => {
    if (selectedProjectKey && !projects.some((project) => project.key === selectedProjectKey)) {
      const timeout = window.setTimeout(() => {
        setSelectedProjectKey('');
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [projects, selectedProjectKey]);

  async function refreshManagerData(successMessage = '') {
    setManagerLoading(true);
    setManagerError('');

    try {
      const appointmentData = await cleaningAppointmentApi.getAll();
      const nextAppointments = normalizeListResponse(appointmentData).map(normalizeAppointment);
      setAppointments(nextAppointments);
      setManagerSuccess(successMessage);
      return nextAppointments;
    } catch (err) {
      setManagerError(err.message || 'Could not refresh cleaning manager data.');
      return [];
    } finally {
      setManagerLoading(false);
    }
  }

  async function handleSaveTasks(event) {
    event.preventDefault();

    if (!selectedProject || savingAction) return;

    const tasks = buildTasksFromText(taskText);
    if (!tasks.length) {
      setManagerError('Add at least one task.');
      setManagerSuccess('');
      return;
    }

    const targetAppointment = projectAppointments.find((appointment) => (
      getDateKey(appointment.appointmentTime) >= appliesFrom
    ));

    if (!targetAppointment) {
      setManagerError('Add a future assignment for this project before saving tasks.');
      setManagerSuccess('');
      return;
    }

    setSavingAction('tasks');
    setManagerError('');
    setManagerSuccess('');

    try {
      await cleaningAppointmentApi.update(targetAppointment.id, {
        id: targetAppointment.id,
        cleaningClientId: targetAppointment.cleaningClientId || null,
        economicCustomerNumber: targetAppointment.economicCustomerNumber ?? selectedProject.economicCustomerNumber ?? null,
        economicCustomerName: targetAppointment.economicCustomerName || selectedProject.economicCustomerName || '',
        projectId: targetAppointment.projectId || selectedProject.projectId || null,
        projectName: targetAppointment.projectName || selectedProject.projectName || '',
        cleaningStaffId: targetAppointment.cleaningStaffId || null,
        appointmentTime: targetAppointment.appointmentTime,
        durationMinutes: targetAppointment.durationMinutes,
        vacation: targetAppointment.vacation,
        tasks: buildTasksFromText(taskText, targetAppointment.tasks),
        applyTaskEditsToFutureAssignments: true,
      });
      await refreshManagerData('Tasks saved for future assignments.');
    } catch (err) {
      setManagerError(err.message || 'Could not save project tasks.');
    } finally {
      setSavingAction('');
    }
  }

  async function handleCreateRepeatedAssignments(event) {
    event.preventDefault();

    if (!selectedProject || savingAction) return;

    const staffId = Number(assignmentStaffId);
    const durationMinutes = Number(assignmentDurationMinutes);
    const intervalWeeks = Number(repeatIntervalWeeks);
    const assignmentCount = Number(repeatCount);
    const tasks = buildTasksForNewAssignment(taskText);

    if (!Number.isFinite(staffId) || staffId <= 0) {
      setManagerError('Choose a cleaning employee.');
      setManagerSuccess('');
      return;
    }

    if (!assignmentStart) {
      setManagerError('Choose the first assignment date and time.');
      setManagerSuccess('');
      return;
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes % 30 !== 0) {
      setManagerError('Choose a duration in half-hour increments.');
      setManagerSuccess('');
      return;
    }

    if (!Number.isFinite(intervalWeeks) || intervalWeeks < 1 || intervalWeeks > 4) {
      setManagerError('Choose a repeat interval from 1 to 4 weeks.');
      setManagerSuccess('');
      return;
    }

    if (!Number.isFinite(assignmentCount) || assignmentCount < 1 || assignmentCount > 52) {
      setManagerError('Create between 1 and 52 assignments.');
      setManagerSuccess('');
      return;
    }

    setSavingAction('assignments');
    setManagerError('');
    setManagerSuccess('');

    try {
      for (let index = 0; index < assignmentCount; index += 1) {
        const nextStart = index === 0
          ? assignmentStart
          : addWeeksToDateTime(assignmentStart, intervalWeeks * index);

        await cleaningAppointmentApi.create({
          cleaningClientId: null,
          economicCustomerNumber: selectedProject.economicCustomerNumber ?? null,
          economicCustomerName: selectedProject.economicCustomerName || '',
          projectId: selectedProject.projectId || null,
          projectName: selectedProject.projectName || getProjectLabel(selectedProject),
          cleaningStaffId: staffId,
          appointmentTime: toApiDateTime(nextStart),
          durationMinutes,
          vacation: false,
          tasks,
        });
      }

      await refreshManagerData(`${assignmentCount} assignment${assignmentCount === 1 ? '' : 's'} created.`);
    } catch (err) {
      setManagerError(err.message || 'Could not create repeated assignments.');
    } finally {
      setSavingAction('');
    }
  }

  return (
    <main className="profile-page employee-page cleaning-manager-page">
      <section className="profile-hero">
        <div>
          <div className="section-eyebrow">Cleaning manager</div>
          <h1>Cleaning operations.</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn btn-cream" type="button" onClick={onLogout}>
          Log out <Icon name="logout" size={18} />
        </button>
      </section>

      <div className="employee-tabs" role="tablist" aria-label="Cleaning manager sections">
        {managerTabs.map(([value, label]) => (
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

      {activeTab === 'schedule' && (
        <CleaningSchedulePanel user={user} managerMode />
      )}

      {activeTab === 'tasks' && (
        <section className="profile-requests employee-worklogs">
          <div className="profile-section-head">
            <div>
              <div className="section-eyebrow">Tasks</div>
              <h2>Add tasks</h2>
            </div>
            <button className="btn btn-blue" type="button" onClick={() => refreshManagerData()} disabled={managerLoading}>
              Refresh <Icon name="arrow" size={18} />
            </button>
          </div>

          {managerError && <div className="form-error employee-feedback">{managerError}</div>}
          {managerSuccess && <div className="form-success employee-feedback">{managerSuccess}</div>}

          {managerLoading && !appointments.length && (
            <div className="profile-empty">Loading cleaning projects...</div>
          )}

          {!managerLoading && !projects.length && (
            <div className="profile-empty">No cleaning projects found yet. Create an assignment from the schedule first.</div>
          )}

          {projects.length > 0 && (
            <>
              <form className="profile-panel employee-editor-panel cleaning-manager-task-panel" onSubmit={handleSaveTasks}>
                <span>Project task templates</span>
                <h2>Project tasks</h2>
                <div className="field-row">
                  <div className="field">
                    <label>Project</label>
                    <select
                      value={selectedProjectKey}
                      onChange={(event) => setSelectedProjectKey(event.target.value)}
                    >
                      {projects.map((project) => (
                        <option key={project.key} value={project.key}>
                          {getProjectLabel(project)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Applies from</label>
                    <input
                      type="date"
                      value={appliesFrom}
                      onChange={(event) => setAppliesFrom(event.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Tasks</label>
                  <textarea
                    rows="7"
                    value={taskText}
                    onChange={(event) => setTaskText(event.target.value)}
                  />
                </div>
                <div className="employee-actions">
                  <button
                    className="btn btn-blue"
                    type="submit"
                    disabled={savingAction === 'tasks'}
                  >
                    {savingAction === 'tasks' ? 'Saving...' : 'Save tasks'}
                    <Icon name="check" size={18} />
                  </button>
                </div>
              </form>

              <form className="profile-panel employee-editor-panel employee-assignment-panel" onSubmit={handleCreateRepeatedAssignments}>
                <span>Repeated assignments</span>
                <h2>Add assignments</h2>
                <div className="field-row">
                  <div className="field">
                    <label>Cleaning employee</label>
                    <select
                      value={assignmentStaffId}
                      onChange={(event) => setAssignmentStaffId(event.target.value)}
                      disabled={!cleaningStaff.length}
                    >
                      {!cleaningStaff.length && <option value="">No cleaning employees available</option>}
                      {cleaningStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {getStaffName(staff)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>First assignment</label>
                    <input
                      type="datetime-local"
                      value={assignmentStart}
                      onChange={(event) => setAssignmentStart(event.target.value)}
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
                  <div className="field">
                    <label>Repeat every</label>
                    <select
                      value={repeatIntervalWeeks}
                      onChange={(event) => setRepeatIntervalWeeks(event.target.value)}
                    >
                      {REPEAT_INTERVAL_OPTIONS.map((weeks) => (
                        <option key={weeks} value={weeks}>
                          {weeks} week{weeks === 1 ? '' : 's'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Assignments</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      step="1"
                      value={repeatCount}
                      onChange={(event) => setRepeatCount(event.target.value)}
                    />
                  </div>
                </div>
                <div className="employee-actions">
                  <button
                    className="btn btn-blue"
                    type="submit"
                    disabled={savingAction === 'assignments' || !cleaningStaff.length}
                  >
                    {savingAction === 'assignments' ? 'Creating...' : 'Create assignments'}
                    <Icon name="plus" size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}

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
    </main>
  );
}

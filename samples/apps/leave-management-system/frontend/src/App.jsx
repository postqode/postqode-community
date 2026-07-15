import React, { useCallback, useEffect, useMemo, useState } from 'react';

const NAV_ITEMS = ['Dashboard', 'My Leave Requests', 'Team Leave Requests'];

const EMPLOYEE_NAV_ITEMS = ['Dashboard', 'My Leave Requests'];
const MANAGER_NAV_ITEMS  = ['Dashboard', 'Team Leave Requests'];

const ROLES = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager'
};

const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid'];

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function buildApiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

async function parseJsonSafe(response) {
  try { return await response.json(); } catch { return {}; }
}

function getStatusClass(status) {
  if (status === 'Approved')  return 'approved';
  if (status === 'Cancelled') return 'cancelled';
  if (status === 'Rejected')  return 'rejected';
  return 'pending';
}

// ── Balance breakdown ────────────────────────────────────────────────────────

function BalanceBreakdown({ breakdown }) {
  if (!breakdown || breakdown.length === 0) return null;
  return (
    <div className="balance-card" aria-label="Leave balance">
      <h2>Leave Balance</h2>
      <table className="balance-table" aria-label="Leave balance by type">
        <thead>
          <tr>
            <th>Type</th>
            <th>Baseline</th>
            <th>Used</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((entry) => (
            <tr key={entry.leaveType}>
              <td>{entry.leaveType}</td>
              <td>{entry.isUnlimited ? '—' : entry.baselineDays}</td>
              <td>{entry.usedDays}</td>
              <td>{entry.isUnlimited ? 'Unlimited' : entry.remainingDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Employee view ────────────────────────────────────────────────────────────

function EmployeeView({ activeNav, employeeId }) {
  const [breakdown, setBreakdown] = useState([]);
  const [requests, setRequests] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('info');

  const loadBalance = useCallback(async () => {
    const response = await fetch(buildApiUrl(`/api/employee/balance?employeeId=${employeeId}`));
    if (!response.ok) throw new Error('Unable to load leave balance.');
    setBreakdown(await parseJsonSafe(response));
  }, [employeeId]);

  const loadRequests = useCallback(async () => {
    const response = await fetch(buildApiUrl(`/api/employee/leave-requests?employeeId=${employeeId}`));
    if (!response.ok) throw new Error('Unable to load leave requests.');
    setRequests(await parseJsonSafe(response));
  }, [employeeId]);

  useEffect(() => {
    let isMounted = true;
    setBreakdown([]);
    setRequests([]);
    setFeedback('');

    async function loadAll() {
      try {
        await Promise.all([loadBalance(), loadRequests()]);
      } catch {
        if (isMounted) {
          setFeedbackType('error');
          setFeedback('Unable to load employee leave data right now.');
        }
      }
    }

    loadAll();
    return () => { isMounted = false; };
  }, [employeeId, loadBalance, loadRequests]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!startDate || !endDate) {
      setFeedbackType('error');
      setFeedback('Please select both start and end date.');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/employee/leave-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, leaveType, employeeId })
      });

      const payload = await parseJsonSafe(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(payload.message ?? 'Unable to submit leave request.');
        return;
      }

      if (payload.balanceBreakdown) setBreakdown(payload.balanceBreakdown);
      await loadRequests();
      setFeedbackType('success');
      setFeedback(payload.message ?? 'Leave request submitted successfully.');
      setStartDate('');
      setEndDate('');
      setLeaveType(LEAVE_TYPES[0]);
    } catch {
      setFeedbackType('error');
      setFeedback('Unable to submit leave request right now.');
    }
  }

  async function handleCancel(requestId) {
    try {
      const response = await fetch(
        buildApiUrl(`/api/employee/leave-requests/${requestId}/cancel?employeeId=${employeeId}`),
        { method: 'POST' }
      );

      const payload = await parseJsonSafe(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(payload.message ?? 'Unable to cancel this leave request.');
        return;
      }

      await Promise.all([loadBalance(), loadRequests()]);
      setFeedbackType('success');
      setFeedback(payload.message ?? 'Leave request cancelled successfully.');
    } catch {
      setFeedbackType('error');
      setFeedback('Unable to cancel this leave request right now.');
    }
  }

  return (
    <section className="content" aria-label="Employee View">
      <h1>Employee View</h1>
      <p className="meta">Current section: {activeNav}</p>

      <BalanceBreakdown breakdown={breakdown} />

      <form onSubmit={handleSubmit} className="leave-form" aria-label="Leave request form">
        <h2>Submit Leave Request</h2>

        <label htmlFor="leave-type">Leave Type</label>
        <select id="leave-type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
          {LEAVE_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <label htmlFor="start-date">Start Date</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          min={todayString()}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label htmlFor="end-date">End Date</label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button type="submit" className="submit-button">Submit Request</button>
      </form>

      <div className="request-panel" aria-label="My leave requests">
        <h2>My Leave Requests</h2>
        {requests.length === 0 ? (
          <p className="muted">No leave requests submitted yet.</p>
        ) : (
          <table className="requests-table" aria-label="My leave requests table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.leaveType}</td>
                  <td>{request.startDate}</td>
                  <td>{request.endDate}</td>
                  <td>{request.days}</td>
                  <td>
                    <span className={`status ${getStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="reason-cell">
                    {request.reason ?? <span className="muted">—</span>}
                  </td>
                  <td>
                    {request.status === 'Pending' ? (
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => handleCancel(request.id)}
                        aria-label={`Cancel request ${request.id}`}
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {feedback && (
        <p role="status" className={feedbackType === 'error' ? 'feedback error' : 'feedback success'}>
          {feedback}
        </p>
      )}
    </section>
  );
}

// ── Manager view ─────────────────────────────────────────────────────────────

function ManagerView({ activeNav }) {
  const [requests, setRequests] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadRequests() {
    try {
      const response = await fetch(buildApiUrl('/api/manager/leave-requests'));
      if (!response.ok) {
        setFeedbackType('error');
        setFeedback('Unable to load team leave requests.');
        return;
      }
      setRequests(await parseJsonSafe(response));
    } catch {
      setFeedbackType('error');
      setFeedback('Unable to load team leave requests.');
    }
  }

  useEffect(() => { loadRequests(); }, []);

  async function handleApprove(requestId) {
    try {
      const response = await fetch(buildApiUrl(`/api/manager/leave-requests/${requestId}/approve`), { method: 'POST' });
      const payload = await parseJsonSafe(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(payload.message ?? 'Unable to approve this request.');
        await loadRequests();
        return;
      }

      setFeedbackType('success');
      setFeedback(payload.message ?? 'Leave request approved successfully.');
      await loadRequests();
    } catch {
      setFeedbackType('error');
      setFeedback('Unable to approve this request.');
    }
  }

  function handleRejectClick(requestId) {
    setRejectingId(requestId);
    setRejectReason('');
    setFeedback('');
  }

  function handleRejectCancel() {
    setRejectingId(null);
    setRejectReason('');
  }

  async function handleRejectConfirm(requestId) {
    try {
      const response = await fetch(buildApiUrl(`/api/manager/leave-requests/${requestId}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });

      const payload = await parseJsonSafe(response);

      if (!response.ok) {
        setFeedbackType('error');
        setFeedback(payload.message ?? 'Unable to reject this request.');
        return;
      }

      setRejectingId(null);
      setRejectReason('');
      setFeedbackType('success');
      setFeedback(payload.message ?? 'Leave request rejected.');
      await loadRequests();
    } catch {
      setFeedbackType('error');
      setFeedback('Unable to reject this request.');
    }
  }

  return (
    <section className="content" aria-label="Manager View">
      <h1>Manager View</h1>
      <p className="meta">Current section: {activeNav}</p>

      <div className="request-panel">
        <h2>Team Leave Requests</h2>
        {requests.length === 0 ? (
          <p className="muted">No leave requests submitted yet.</p>
        ) : (
          <table className="requests-table" aria-label="Team leave requests table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.employeeName}</td>
                  <td>{request.leaveType}</td>
                  <td>{request.startDate}</td>
                  <td>{request.endDate}</td>
                  <td>{request.days}</td>
                  <td>
                    <span className={`status ${getStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="reason-cell">
                    {request.reason ?? <span className="muted">—</span>}
                  </td>
                  <td>
                    {request.status === 'Pending' ? (
                      rejectingId === request.id ? (
                        <div className="reject-inline">
                          <input
                            type="text"
                            className="reject-reason-input"
                            placeholder="Reason for rejection"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            aria-label={`Rejection reason for request ${request.id}`}
                          />
                          <button
                            type="button"
                            className="confirm-reject-button"
                            onClick={() => handleRejectConfirm(request.id)}
                            aria-label={`Confirm rejection of request ${request.id}`}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="cancel-reject-button"
                            onClick={handleRejectCancel}
                            aria-label="Cancel rejection"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="approve-button"
                            onClick={() => handleApprove(request.id)}
                            aria-label={`Approve request ${request.id}`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="reject-button"
                            onClick={() => handleRejectClick(request.id)}
                            aria-label={`Reject request ${request.id}`}
                          >
                            Reject
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="muted">{request.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {feedback && (
        <p role="status" className={feedbackType === 'error' ? 'feedback error' : 'feedback success'}>
          {feedback}
        </p>
      )}
    </section>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [activeNav, setActiveNav] = useState(EMPLOYEE_NAV_ITEMS[0]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(1);

  const isEmployee = useMemo(() => role === ROLES.EMPLOYEE, [role]);
  const navItems = useMemo(() => isEmployee ? EMPLOYEE_NAV_ITEMS : MANAGER_NAV_ITEMS, [isEmployee]);

  function handleRoleChange(newRole) {
    setRole(newRole);
    const items = newRole === ROLES.EMPLOYEE ? EMPLOYEE_NAV_ITEMS : MANAGER_NAV_ITEMS;
    setActiveNav(items[0]);
  }

  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await fetch(buildApiUrl('/api/employees'));
        if (response.ok) {
          setEmployees(await parseJsonSafe(response));
        }
      } catch {
        // non-fatal: employee selector will be empty
      }
    }
    loadEmployees();
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation sidebar">
        <h2 className="brand">Leave Management System</h2>

        <label htmlFor="role-switcher" className="role-label">Role</label>
        <select
          id="role-switcher"
          className="role-switcher"
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
        >
          <option value={ROLES.EMPLOYEE}>Employee</option>
          <option value={ROLES.MANAGER}>Manager</option>
        </select>

        {isEmployee && employees.length > 0 && (
          <>
            <label htmlFor="employee-selector" className="role-label">Employee</label>
            <select
              id="employee-selector"
              className="role-switcher"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              aria-label="Select employee"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </>
        )}

        <nav aria-label="Primary navigation">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={item === activeNav ? 'nav-button active' : 'nav-button'}
                  onClick={() => setActiveNav(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="main-panel">
        {isEmployee
          ? <EmployeeView activeNav={activeNav} employeeId={selectedEmployeeId} />
          : <ManagerView activeNav={activeNav} />
        }
      </main>
    </div>
  );
}

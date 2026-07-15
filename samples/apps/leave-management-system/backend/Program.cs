using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var app = builder.Build();

var employeeRegistry = new EmployeeRegistry();
var leaveState = new LeaveState(employeeRegistry);
var shellState = new ShellState(
    Navigation: ShellContract.Navigation,
    Roles: ShellContract.Roles
);

// ── Health ───────────────────────────────────────────────────────────────────
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

// ── Shell ────────────────────────────────────────────────────────────────────
app.MapGet("/api/shell", () => Results.Ok(shellState));

// ── Employees ────────────────────────────────────────────────────────────────
app.MapGet("/api/employees", () => Results.Ok(employeeRegistry.GetAll()));

// ── Employee: balance ────────────────────────────────────────────────────────
app.MapGet("/api/employee/balance", (int employeeId = 1) =>
{
    if (!employeeRegistry.Exists(employeeId))
        return Results.NotFound(new { message = $"Employee {employeeId} was not found." });

    return Results.Ok(leaveState.GetBalanceBreakdown(employeeId));
});

// ── Employee: list requests ──────────────────────────────────────────────────
app.MapGet("/api/employee/leave-requests", (int employeeId = 1) =>
{
    if (!employeeRegistry.Exists(employeeId))
        return Results.NotFound(new { message = $"Employee {employeeId} was not found." });

    return Results.Ok(leaveState.GetRequestsForEmployee(employeeId));
});

// ── Employee: submit request ─────────────────────────────────────────────────
app.MapPost("/api/employee/leave-requests", (LeaveRequestInput input) =>
{
    var employeeId = input.EmployeeId ?? 1;

    if (!employeeRegistry.Exists(employeeId))
        return Results.NotFound(new { message = $"Employee {employeeId} was not found." });

    if (input.LeaveType == null)
        return Results.BadRequest(new { message = "leaveType is required." });

    if (!Enum.IsDefined(typeof(LeaveType), input.LeaveType.Value))
        return Results.BadRequest(new { message = $"'{input.LeaveType}' is not a recognized leave type. Valid types are: {string.Join(", ", Enum.GetNames<LeaveType>())}." });

    var submission = leaveState.TrySubmitLeaveRequest(
        input.StartDate, input.EndDate, employeeId, input.LeaveType.Value,
        DateOnly.FromDateTime(DateTime.UtcNow));

    if (!submission.Success)
        return Results.BadRequest(new { message = submission.Message });

    return Results.Ok(new
    {
        message = submission.Message,
        request = submission.Request,
        balanceBreakdown = leaveState.GetBalanceBreakdown(employeeId)
    });
});

// ── Employee: cancel request ─────────────────────────────────────────────────
app.MapPost("/api/employee/leave-requests/{id:int}/cancel", (int id, int employeeId = 1) =>
{
    if (!employeeRegistry.Exists(employeeId))
        return Results.NotFound(new { message = $"Employee {employeeId} was not found." });

    var cancellation = leaveState.TryCancelLeaveRequest(id, employeeId);

    if (!cancellation.Success && cancellation.Error == CancellationError.NotFound)
        return Results.NotFound(new { message = cancellation.Message });

    if (!cancellation.Success && cancellation.Error == CancellationError.Unauthorized)
        return Results.Forbid();

    if (!cancellation.Success && cancellation.Error == CancellationError.NotPending)
        return Results.Conflict(new { message = cancellation.Message });

    return Results.Ok(new { message = cancellation.Message, request = cancellation.Request });
});

// ── Manager: list all requests ───────────────────────────────────────────────
app.MapGet("/api/manager/leave-requests", () => Results.Ok(leaveState.GetRequests()));

// ── Manager: approve request ─────────────────────────────────────────────────
app.MapPost("/api/manager/leave-requests/{id:int}/approve", (int id) =>
{
    var approval = leaveState.TryApproveLeaveRequest(id);

    if (!approval.Success && approval.Error == ApprovalError.NotFound)
        return Results.NotFound(new { message = approval.Message });

    if (!approval.Success)
        return Results.Conflict(new { message = approval.Message });

    return Results.Ok(new { message = approval.Message, request = approval.Request });
});

// ── Manager: reject request ──────────────────────────────────────────────────
app.MapPost("/api/manager/leave-requests/{id:int}/reject", (int id, RejectionInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Reason))
        return Results.BadRequest(new { message = "A rejection reason is required and cannot be empty or whitespace." });

    var rejection = leaveState.TryRejectLeaveRequest(id, input.Reason.Trim());

    if (!rejection.Success && rejection.Error == RejectionError.NotFound)
        return Results.NotFound(new { message = rejection.Message });

    if (!rejection.Success)
        return Results.Conflict(new { message = rejection.Message });

    return Results.Ok(new { message = rejection.Message, request = rejection.Request });
});

app.Run();

// ── Enums ────────────────────────────────────────────────────────────────────

public enum UserRole { Employee, Manager }

public enum LeaveType { Annual, Sick, Casual, Unpaid }

public enum LeaveRequestStatus { Pending, Approved, Cancelled, Rejected }

public enum ApprovalError { None, NotFound, AlreadyApproved, NotPending, InsufficientBalance }

public enum CancellationError { None, NotFound, NotPending, Unauthorized }

public enum RejectionError { None, NotFound, NotPending, MissingReason }

// ── Records ──────────────────────────────────────────────────────────────────

public record ShellState(string[] Navigation, UserRole[] Roles);

public record EmployeeRecord(int Id, string Name);

public record LeaveRequestInput(DateOnly StartDate, DateOnly EndDate, LeaveType? LeaveType = null, int? EmployeeId = null);

public record RejectionInput(string? Reason);

public record LeaveRequestRecord(
    int Id,
    int EmployeeId,
    string EmployeeName,
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    int Days,
    LeaveRequestStatus Status,
    string? Reason = null);

public record LeaveBalance(int UsedDays, int RemainingDays);

public record LeaveTypeBalance(string LeaveType, bool IsUnlimited, int BaselineDays, int UsedDays, int? RemainingDays);

public record LeaveSubmissionResult(bool Success, string Message, LeaveRequestRecord? Request, int RemainingDays);

public record LeaveApprovalResult(bool Success, string Message, LeaveRequestRecord? Request, ApprovalError Error);

public record LeaveCancellationResult(bool Success, string Message, LeaveRequestRecord? Request, CancellationError Error);

public record LeaveRejectionResult(bool Success, string Message, LeaveRequestRecord? Request, RejectionError Error);

// ── Shell contract ───────────────────────────────────────────────────────────

public static class ShellContract
{
    public static readonly string[] Navigation = ["Dashboard", "My Leave Requests", "Team Leave Requests"];
    public static readonly UserRole[] Roles = [UserRole.Employee, UserRole.Manager];
}

// ── Employee registry ────────────────────────────────────────────────────────

public class EmployeeRegistry
{
    private static readonly List<EmployeeRecord> _employees =
    [
        new(1, "Alice Johnson"),
        new(2, "Bob Smith"),
        new(3, "Carol White"),
        new(4, "David Brown"),
        new(5, "Eve Davis"),
    ];

    public IReadOnlyList<EmployeeRecord> GetAll() => _employees;

    public bool Exists(int employeeId) =>
        _employees.Any(e => e.Id == employeeId);

    public string GetName(int employeeId) =>
        _employees.First(e => e.Id == employeeId).Name;
}

// ── Leave policy ─────────────────────────────────────────────────────────────

public static class LeavePolicy
{
    public const int BaselineAnnualLeaveDays = 15;
    public const int BaselineSickLeaveDays   = 10;
    public const int BaselineCasualLeaveDays =  5;

    public static int? GetBaseline(LeaveType leaveType) => leaveType switch
    {
        LeaveType.Annual  => BaselineAnnualLeaveDays,
        LeaveType.Sick    => BaselineSickLeaveDays,
        LeaveType.Casual  => BaselineCasualLeaveDays,
        LeaveType.Unpaid  => null,
        _ => throw new ArgumentOutOfRangeException(nameof(leaveType))
    };

    public static bool IsUnlimited(LeaveType leaveType) => leaveType == LeaveType.Unpaid;

    public static int CountWeekdays(DateOnly startDate, DateOnly endDate)
    {
        int count = 0;
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
            if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
                count++;
        return count;
    }
}

// ── Leave state ──────────────────────────────────────────────────────────────

public class LeaveState(EmployeeRegistry employeeRegistry)
{
    private readonly List<LeaveRequestRecord> _requests = [];
    private int _nextRequestId = 1;

    public List<LeaveTypeBalance> GetBalanceBreakdown(int employeeId)
    {
        return Enum.GetValues<LeaveType>().Select(leaveType =>
        {
            if (LeavePolicy.IsUnlimited(leaveType))
            {
                var usedUnpaid = _requests
                    .Where(x => x.EmployeeId == employeeId && x.LeaveType == leaveType && x.Status == LeaveRequestStatus.Approved)
                    .Sum(x => x.Days);
                return new LeaveTypeBalance(leaveType.ToString(), true, 0, usedUnpaid, null);
            }

            var baseline = LeavePolicy.GetBaseline(leaveType)!.Value;
            var used = _requests
                .Where(x => x.EmployeeId == employeeId && x.LeaveType == leaveType && x.Status == LeaveRequestStatus.Approved)
                .Sum(x => x.Days);
            return new LeaveTypeBalance(leaveType.ToString(), false, baseline, used, baseline - used);
        }).ToList();
    }

    public LeaveBalance GetBalance(int employeeId, LeaveType leaveType)
    {
        var used = _requests
            .Where(x => x.EmployeeId == employeeId && x.LeaveType == leaveType && x.Status == LeaveRequestStatus.Approved)
            .Sum(x => x.Days);
        var baseline = LeavePolicy.GetBaseline(leaveType) ?? int.MaxValue;
        return new LeaveBalance(used, baseline - used);
    }

    public IReadOnlyList<LeaveRequestRecord> GetRequests() =>
        _requests.OrderBy(x => x.Id).ToList();

    public IReadOnlyList<LeaveRequestRecord> GetRequestsForEmployee(int employeeId) =>
        _requests.Where(x => x.EmployeeId == employeeId).OrderBy(x => x.Id).ToList();

    public LeaveSubmissionResult TrySubmitLeaveRequest(
        DateOnly startDate, DateOnly endDate, int employeeId, LeaveType leaveType, DateOnly today)
    {
        if (endDate < startDate)
            return new LeaveSubmissionResult(false, "End date cannot be before start date.", null, 0);

        if (startDate < today)
            return new LeaveSubmissionResult(false, "Start date cannot be in the past.", null, 0);

        var requestedDays = LeavePolicy.CountWeekdays(startDate, endDate);
        if (requestedDays == 0)
            return new LeaveSubmissionResult(false, "The selected dates contain no working days. Leave requests must include at least one weekday.", null, 0);

        var request = new LeaveRequestRecord(
            Id: _nextRequestId++,
            EmployeeId: employeeId,
            EmployeeName: employeeRegistry.GetName(employeeId),
            LeaveType: leaveType,
            StartDate: startDate,
            EndDate: endDate,
            Days: requestedDays,
            Status: LeaveRequestStatus.Pending);

        _requests.Add(request);

        var balance = GetBalance(employeeId, leaveType);
        return new LeaveSubmissionResult(true, "Leave request submitted successfully.", request, balance.RemainingDays);
    }

    public LeaveApprovalResult TryApproveLeaveRequest(int requestId)
    {
        var index = _requests.FindIndex(x => x.Id == requestId);
        if (index < 0)
            return new LeaveApprovalResult(false, $"Leave request {requestId} was not found.", null, ApprovalError.NotFound);

        var current = _requests[index];

        if (current.Status == LeaveRequestStatus.Approved)
            return new LeaveApprovalResult(false, $"Leave request {requestId} is already approved.", current, ApprovalError.AlreadyApproved);

        if (current.Status != LeaveRequestStatus.Pending)
            return new LeaveApprovalResult(false, $"Leave request {requestId} is not pending and cannot be approved.", current, ApprovalError.NotPending);

        if (!LeavePolicy.IsUnlimited(current.LeaveType))
        {
            var balance = GetBalance(current.EmployeeId, current.LeaveType);
            if (current.Days > balance.RemainingDays)
                return new LeaveApprovalResult(
                    false,
                    $"Cannot approve request {requestId}: {current.LeaveType} leave requested {current.Days} day(s), but only {balance.RemainingDays} day(s) remain.",
                    current,
                    ApprovalError.InsufficientBalance);
        }

        var updated = current with { Status = LeaveRequestStatus.Approved };
        _requests[index] = updated;
        return new LeaveApprovalResult(true, "Leave request approved successfully.", updated, ApprovalError.None);
    }

    public LeaveCancellationResult TryCancelLeaveRequest(int requestId, int employeeId)
    {
        var index = _requests.FindIndex(x => x.Id == requestId);
        if (index < 0)
            return new LeaveCancellationResult(false, $"Leave request {requestId} was not found.", null, CancellationError.NotFound);

        var current = _requests[index];

        if (current.EmployeeId != employeeId)
            return new LeaveCancellationResult(false, "You can cancel only your own leave requests.", current, CancellationError.Unauthorized);

        if (current.Status != LeaveRequestStatus.Pending)
            return new LeaveCancellationResult(false, $"Leave request {requestId} is not pending and cannot be cancelled.", current, CancellationError.NotPending);

        var updated = current with { Status = LeaveRequestStatus.Cancelled };
        _requests[index] = updated;
        return new LeaveCancellationResult(true, "Leave request cancelled successfully.", updated, CancellationError.None);
    }

    public LeaveRejectionResult TryRejectLeaveRequest(int requestId, string reason)
    {
        var index = _requests.FindIndex(x => x.Id == requestId);
        if (index < 0)
            return new LeaveRejectionResult(false, $"Leave request {requestId} was not found.", null, RejectionError.NotFound);

        var current = _requests[index];

        if (current.Status != LeaveRequestStatus.Pending)
            return new LeaveRejectionResult(false, $"Leave request {requestId} is not pending and cannot be rejected. Current status: {current.Status}.", current, RejectionError.NotPending);

        var updated = current with { Status = LeaveRequestStatus.Rejected, Reason = reason };
        _requests[index] = updated;
        return new LeaveRejectionResult(true, "Leave request rejected.", updated, RejectionError.None);
    }
}

public partial class Program { }

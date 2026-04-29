using SportCenter.Api.DTOs;
using SportCenter.Api.Models;

namespace SportCenter.Api.Services;

public static class EmployeeHoursCalculator
{
    public static EmployeeHoursOverviewDto BuildOverview(
        IEnumerable<Employee> employees,
        IEnumerable<Shift> shifts,
        EmployeeHoursQueryDto? query)
    {
        var normalizedQuery = NormalizeQuery(query);
        var employeeList = employees?.ToList() ?? new List<Employee>();
        var shiftList = shifts?.ToList() ?? new List<Shift>();

        var selectedEmployees = employeeList
            .Where(employee => EmployeeMatchesQuery(employee, normalizedQuery))
            .ToList();

        var relevantShifts = shiftList
            .Where(shift => shift.EmployeeId.HasValue)
            .Where(shift => normalizedQuery.EmployeeId == null || shift.EmployeeId == normalizedQuery.EmployeeId)
            .Where(shift => IsShiftInRange(shift, normalizedQuery.StartDate!.Value, normalizedQuery.EndDate!.Value))
            .Where(shift => normalizedQuery.ShiftCategoryId == null || shift.ShiftCategoryId == normalizedQuery.ShiftCategoryId)
            .ToList();

        var rows = selectedEmployees
            .Select(employee => BuildRow(employee, relevantShifts, normalizedQuery))
            .OrderByDescending(row => row.TotalMinutes)
            .ThenBy(row => row.FullName)
            .ToList();

        var summary = new EmployeeHoursSummaryDto
        {
            TotalEmployees = rows.Count,
            ActiveEmployees = rows.Count(row => row.TotalMinutes > 0),
            EmployeesWithoutHours = rows.Count(row => row.TotalMinutes == 0),
            TotalShiftCount = rows.Sum(row => row.ShiftCount),
            TotalMinutes = rows.Sum(row => row.TotalMinutes)
        };

        return new EmployeeHoursOverviewDto
        {
            StartDate = normalizedQuery.StartDate!.Value,
            EndDate = normalizedQuery.EndDate!.Value,
            Summary = summary,
            Rows = rows
        };
    }

    public static int CalculateTotalMinutesForEmployee(
        IEnumerable<Shift> shifts,
        DateTime startDate,
        DateTime endDate,
        long? shiftCategoryId = null)
    {
        var normalizedStart = startDate.Date;
        var normalizedEnd = endDate.Date.AddDays(1).AddTicks(-1);

        return shifts
            .Where(shift => shift.EmployeeId.HasValue)
            .Where(shift => IsShiftInRange(shift, normalizedStart, normalizedEnd))
            .Where(shift => shiftCategoryId == null || shift.ShiftCategoryId == shiftCategoryId)
            .Sum(shift => CalculateClippedMinutes(shift, normalizedStart, normalizedEnd));
    }

    private static EmployeeHoursRowDto BuildRow(
        Employee employee,
        IReadOnlyCollection<Shift> relevantShifts,
        EmployeeHoursQueryDto query)
    {
        var employeeShifts = relevantShifts
            .Where(shift => shift.EmployeeId == employee.EmployeeId)
            .OrderBy(shift => shift.StartTime)
            .ToList();

        var totalMinutes = employeeShifts.Sum(shift => CalculateClippedMinutes(shift, query.StartDate, query.EndDate));
        var primaryRole = employee.EmployeeRoles?
            .Select(er => er.Role)
            .FirstOrDefault(role => role != null);

        return new EmployeeHoursRowDto
        {
            EmployeeId = employee.EmployeeId,
            FullName = $"{employee.FirstName} {employee.LastName}".Trim(),
            RoleId = primaryRole?.RoleId,
            RoleName = primaryRole?.Name ?? "Ingen rolle",
            RoleColor = string.IsNullOrWhiteSpace(primaryRole?.Color) ? "--color-andet" : primaryRole!.Color,
            ShiftCount = employeeShifts.Count,
            TotalMinutes = totalMinutes,
            FirstShiftStart = employeeShifts.FirstOrDefault()?.StartTime,
            LastShiftEnd = employeeShifts.LastOrDefault()?.EndTime
        };
    }

    private static EmployeeHoursQueryDto NormalizeQuery(EmployeeHoursQueryDto? query)
    {
        var normalized = query ?? new EmployeeHoursQueryDto();

        var today = DateTime.Today;
        var start = normalized.StartDate?.Date;
        var end = normalized.EndDate?.Date;

        if (start == null && end == null)
        {
            start = new DateTime(today.Year, today.Month, 1);
            end = start.Value.AddMonths(1).AddDays(-1);
        }
        else if (start == null)
        {
            start = end;
        }
        else if (end == null)
        {
            end = start;
        }

        if (start > end)
        {
            throw new ArgumentException("Startdato kan ikke være efter slutdato.");
        }

        normalized.StartDate = start!.Value;
        normalized.EndDate = end!.Value;

        if (!string.IsNullOrWhiteSpace(normalized.RoleName))
        {
            normalized.RoleName = normalized.RoleName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(normalized.Search))
        {
            normalized.Search = normalized.Search.Trim();
        }

        return normalized;
    }

    private static bool EmployeeMatchesQuery(Employee employee, EmployeeHoursQueryDto query)
    {
        if (query.EmployeeId.HasValue && employee.EmployeeId != query.EmployeeId.Value)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLowerInvariant();
            var fullName = $"{employee.FirstName} {employee.LastName}".ToLowerInvariant();

            if (!fullName.Contains(search))
            {
                var roleMatchesSearch = employee.EmployeeRoles?
                    .Any(er => er.Role?.Name != null && er.Role.Name.ToLowerInvariant().Contains(search)) ?? false;

                if (!roleMatchesSearch)
                {
                    return false;
                }
            }
        }

        if (query.RoleId.HasValue)
        {
            var hasRole = employee.EmployeeRoles?.Any(er => er.RoleId == query.RoleId.Value) ?? false;
            if (!hasRole)
            {
                return false;
            }
        }

        if (!string.IsNullOrWhiteSpace(query.RoleName))
        {
            var normalizedRoleName = query.RoleName.ToLowerInvariant();
            var hasRoleName = employee.EmployeeRoles?
                .Any(er => er.Role?.Name != null && er.Role.Name.ToLowerInvariant() == normalizedRoleName) ?? false;

            if (!hasRoleName)
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsShiftInRange(Shift shift, DateTime startDate, DateTime endDate)
    {
        var normalizedEnd = endDate.Date.AddDays(1).AddTicks(-1);
        return shift.StartTime <= normalizedEnd && shift.EndTime >= startDate.Date;
    }

    private static int CalculateClippedMinutes(Shift shift, DateTime? startDate, DateTime? endDate)
    {
        if (!startDate.HasValue || !endDate.HasValue)
        {
            return 0;
        }

        var rangeStart = startDate.Value.Date;
        var rangeEnd = endDate.Value.Date.AddDays(1).AddTicks(-1);
        var effectiveStart = shift.StartTime > rangeStart ? shift.StartTime : rangeStart;
        var effectiveEnd = shift.EndTime < rangeEnd ? shift.EndTime : rangeEnd;

        if (effectiveEnd <= effectiveStart)
        {
            return 0;
        }

        return (int)Math.Round((effectiveEnd - effectiveStart).TotalMinutes, MidpointRounding.AwayFromZero);
    }
}

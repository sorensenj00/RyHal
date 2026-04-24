namespace SportCenter.Api.DTOs;

public class EmployeeHoursSummaryDto
{
    public int TotalEmployees { get; set; }
    public int ActiveEmployees { get; set; }
    public int EmployeesWithoutHours { get; set; }
    public int TotalShiftCount { get; set; }
    public int TotalMinutes { get; set; }
    public double TotalHours => Math.Round(TotalMinutes / 60.0, 2);
}

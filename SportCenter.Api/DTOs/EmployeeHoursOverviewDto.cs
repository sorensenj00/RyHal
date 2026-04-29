namespace SportCenter.Api.DTOs;

public class EmployeeHoursOverviewDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public EmployeeHoursSummaryDto Summary { get; set; } = new();
    public List<EmployeeHoursRowDto> Rows { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

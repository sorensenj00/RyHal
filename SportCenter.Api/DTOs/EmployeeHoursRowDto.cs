namespace SportCenter.Api.DTOs;

public class EmployeeHoursRowDto
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public int? RoleId { get; set; }
    public string RoleName { get; set; } = "Ingen rolle";
    public int ShiftCount { get; set; }
    public int TotalMinutes { get; set; }
    public double TotalHours => Math.Round(TotalMinutes / 60.0, 2);
    public double AverageHoursPerShift => ShiftCount == 0 ? 0 : Math.Round(TotalHours / ShiftCount, 2);
    public DateTime? FirstShiftStart { get; set; }
    public DateTime? LastShiftEnd { get; set; }
}

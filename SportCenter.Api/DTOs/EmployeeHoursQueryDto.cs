namespace SportCenter.Api.DTOs;

public class EmployeeHoursQueryDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? EmployeeId { get; set; }
    public int? RoleId { get; set; }
    public string? RoleName { get; set; }
    public long? ShiftCategoryId { get; set; }
    public string? Search { get; set; }
}

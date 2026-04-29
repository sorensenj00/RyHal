namespace SportCenter.Api.DTOs;

public class ShiftCreateDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public long CategoryId { get; set; }
    public long? EmployeeId { get; set; }
    public bool IsRecurring { get; set; } = false;
    public DateTime? EndDate { get; set; }
}
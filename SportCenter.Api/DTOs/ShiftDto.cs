namespace SportCenter.Api.DTOs;

public class ShiftDto
{
    public long ShiftId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public long CategoryId { get; set; } 
    public string? CategoryName { get; set; }
    public string? CategoryColor { get; set; }
    public long? EmployeeId { get; set; }
}

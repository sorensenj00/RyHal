namespace SportCenter.Api.Models;
public class Shift
{
	public int ShiftId { get; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public ShiftCategory Category { get; set; }

    public Employee? Employee { get; set; } 

    public Shift(DateTime startTime, DateTime endTime, ShiftCategory category, int id)
    {
        ShiftId = id;
        StartTime = startTime;
        EndTime = endTime;
        Category = category;
    }
}
namespace SportCenter.Api.Models;
public class Shift
{
    public Shift(DateTime startTime, DateTime endTime, ShiftCategory category)
    {
        ShiftId = _id++;
        StartTime = startTime;
        EndTime = endTime;
        Category = category;
    }

	private static int _id = 0;

	public int ShiftId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public ShiftCategory Category { get; set; }

    public Employee? Employee { get; set; }
}
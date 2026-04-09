namespace SportCenter.Api.Models;
public class Shift
{
    public Shift(DateOnly date, DateTime startTime, DateTime endTime, ShiftCategory category)
    {
        ShiftId = _id++;
        Date = date;
        StartTime = startTime;
        EndTime = endTime;
        Category = category;
    }

	private static int _id = 0;

	public int ShiftId { get; set; }

	public DateOnly Date {  get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public ShiftCategory Category { get; set; }

    public Employee? Employee { get; set; }
}
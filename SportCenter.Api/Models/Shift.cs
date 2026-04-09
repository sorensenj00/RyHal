namespace SportCenter.Api.Models;
public class Shift
{
    public Shift(DateOnly date, DateTime startTime, DateTime endTime, ShiftCategory category)
    {
        Date = date;
        StartTime = startTime;
        EndTime = endTime;
        Category = category;
    }

    // link til employee her

    public DateOnly Date {  get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public ShiftCategory Category { get; set; }

    enum ShiftCategory
    {
        HALL_BOY,
        CLEANER,
        ADMIN,
        CAFE_WORKER,
        DISHWASHER,
        OTHER
    }
}
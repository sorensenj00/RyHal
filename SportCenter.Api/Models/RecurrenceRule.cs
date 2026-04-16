namespace SportCenter.Api.Models;

public enum RecurrenceFrequency
{
    DAILY,
    WEEKLY,
    MONTHLY
}

public class RecurrenceRule
{
    public RecurrenceFrequency Frequency { get; set; }
    public DateTime EndDate { get; set; }

    public RecurrenceRule() {}

    public RecurrenceRule(RecurrenceFrequency frequency, DateTime endDate)
    {
        Frequency = frequency;
        EndDate = endDate;
    }

    // Returnerer en liste af startdatoer baseret på reglen
    public List<DateTime> GenerateOccurrences(DateTime baseStartTime)
    {
        var occurrences = new List<DateTime>();
        var current = baseStartTime;

        while (current <= EndDate)
        {
            occurrences.Add(current);
            
            current = Frequency switch
            {
                RecurrenceFrequency.DAILY => current.AddDays(1),
                RecurrenceFrequency.WEEKLY => current.AddDays(7),
                RecurrenceFrequency.MONTHLY => current.AddMonths(1),
                _ => current.AddDays(1)
            };
        }

        return occurrences;
    }
}

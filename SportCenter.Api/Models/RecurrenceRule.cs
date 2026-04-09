namespace SportCenter.Api.Models;

public enum RecurrenceFrequency
{
    Daily,
    Weekly,
    Monthly
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
                RecurrenceFrequency.Daily => current.AddDays(1),
                RecurrenceFrequency.Weekly => current.AddDays(7),
                RecurrenceFrequency.Monthly => current.AddMonths(1),
                _ => current.AddDays(1)
            };
        }

        return occurrences;
    }
}

namespace SportCenter.Api.Models;

public enum RecurrenceFrequency
{
    DAGLIG,
    UGENTLIG,
    MAANEDLIG
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
                RecurrenceFrequency.DAGLIG => current.AddDays(1),
                RecurrenceFrequency.UGENTLIG => current.AddDays(7),
                RecurrenceFrequency.MAANEDLIG => current.AddMonths(1),
                _ => current.AddDays(1)
            };
        }

        return occurrences;
    }
}

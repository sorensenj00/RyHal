namespace SportCenter.Api.Models;

public class Event
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    
    public EventCategory Category { get; set; }

    // Fremmednøgle til EventSeries. Den er 'nullable' (int?), 
    // fordi et event sagtens kan være et engangsevent uden en serie.
    public int? SeriesId { get; set; }
    public EventSeries? Series { get; set; }

    // Enterprise-flag til håndtering af undtagelser
    public bool IsModifiedFromSeries { get; set; } = false;
    public bool IsCancelled { get; set; } = false;
    public bool IsDraft { get; set; } = false;

    public List<EventLocation> EventLocations { get; set; } = new();

    public int? TemplateId { get; set; }

    // Tom constructor kræves af Entity Framework Core
    private Event() { }

    // Constructor til at oprette et nyt event i koden
    public Event(string name, string? description, DateTime? startTime, DateTime? endTime, EventCategory category, int? templateId, int? seriesId = null, int id = 0)
    {
        Id = id;
        Name = name;
        Description = description;
        StartTime = startTime;
        EndTime = endTime;
        Category = category;
        TemplateId = templateId;
        SeriesId = seriesId;
    }
}

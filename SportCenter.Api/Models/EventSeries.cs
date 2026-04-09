namespace SportCenter.Api.Models;

public class EventSeries
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EventCategory Category { get; set; }
    
    // Logik for gentagelse
    public RecurrenceRule Rule { get; set; } = new();

    // Standard lokation for hele serien
    public int LocationId { get; set; }
    public Location? Location { get; set; }
    
    public int? TemplateId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;

    // Entity Framework Navigation Property - indeholder alle genererede events
    public ICollection<Event> Events { get; set; } = new List<Event>();

    // Tom constructor kræves af Entity Framework Core
    private EventSeries() { }

    // Constructor til at oprette en ny serie i koden
    public EventSeries(string name, string? description, EventCategory category, RecurrenceRule rule, int locationId, int? templateId, string createdBy)
    {
        Name = name;
        Description = description;
        Category = category;
        Rule = rule;
        LocationId = locationId;
        TemplateId = templateId;
        CreatedBy = createdBy;
        CreatedAt = DateTime.UtcNow;
    }
}
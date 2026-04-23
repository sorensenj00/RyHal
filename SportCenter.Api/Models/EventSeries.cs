namespace SportCenter.Api.Models;
using Postgrest.Attributes;
using Postgrest.Models;

[Table("event_series")]
public class EventSeries : BaseModel
{
    [PrimaryKey("eventseries_id", false)]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("category")]
    public EventCategory Category { get; set; }
    
    // Logik for gentagelse
    public RecurrenceRule Rule { get; set; } = new();

    // Standard lokation for hele serien
    [Column("location_id")]
    public int LocationId { get; set; }

    [Column("association_id")]
    public int? AssociationId { get; set; }

    [Reference(typeof(Location))]
    public Location? Location { get; set; }
    
    [Column("template_id")]
    public int? TemplateId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public string CreatedBy { get; set; } = string.Empty;

    // Entity Framework Navigation Property - indeholder alle genererede events
    public ICollection<Event> Events { get; set; } = new List<Event>();

    // Tom constructor kræves af Entity Framework Core
    public EventSeries() { }

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
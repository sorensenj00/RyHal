namespace SportCenter.Api.Models;
public class Event
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public EventCategory Category { get; set; }
    public bool IsRecurring { get; set; }
    
    public int LocationId { get; set; }
    public Location? Location { get; set; }
    
    public int? TemplateId { get; set; }
    // public EventTemplate? Template { get; set; } 

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;

    private Event() { }

    public Event(int id, string name, string? description, DateTime startTime, DateTime endTime, EventCategory category, bool isRecurring, int locationId, Location? location, int? templateId)
    {
        Id = id;
        Name = name;
        Description = description;
        StartTime = startTime;
        EndTime = endTime;
        Category = category;
        IsRecurring = isRecurring;
        LocationId = locationId;
        Location = location;
        TemplateId = templateId;
    }
    
    
}
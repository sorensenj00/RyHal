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
}
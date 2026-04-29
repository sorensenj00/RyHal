namespace SportCenter.Api.Models;
using Postgrest.Attributes;
using Postgrest.Models;
using Newtonsoft.Json;
using SportCenter.Api.Models.Converters;
using EfColumn = System.ComponentModel.DataAnnotations.Schema.ColumnAttribute;

[Table("events")]
public class Event : BaseModel
{
    [PrimaryKey("event_id", true)]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }
    
    [Column("start_time")]
    [EfColumn("start_time", TypeName = "timestamp without time zone")]
    [JsonConverter(typeof(LocalDateTimeJsonConverter))]
    public DateTime? StartTime { get; set; }

    [Column("end_time")]
    [EfColumn("end_time", TypeName = "timestamp without time zone")]
    [JsonConverter(typeof(LocalDateTimeJsonConverter))]
    public DateTime? EndTime { get; set; }

    [Column("date")]
    [EfColumn("date", TypeName = "date")]
    [JsonConverter(typeof(LocalDateOnlyJsonConverter))]
    public DateTime? Date { get; set; }
    
    [Column("category")]
    public EventCategory Category { get; set; }

    // Fremmednøgle til EventSeries. Den er 'nullable' (int?), 
    // fordi et event sagtens kan være et engangsevent uden en serie.
    [Column("eventseries_id")]
    public int? SeriesId { get; set; }

    [Column("location_id")]
    public int? LocationId { get; set; }

    [Column("association_id")]
    public int? AssociationId { get; set; }

    [JsonIgnore]
    public EventSeries? Series { get; set; }

    // Enterprise-flag til håndtering af undtagelser
    [Column("is_modified_from_series")]
    public bool? IsModifiedFromSeries { get; set; } = false;

    [Column("is_cancelled")]
    public bool? IsCancelled { get; set; } = false;

    [Column("is_draft")]
    public bool? IsDraft { get; set; } = false;

    [JsonIgnore]
    public List<EventLocation> EventLocations { get; set; } = new();

    public int? TemplateId { get; set; }

    public bool ShouldSerializeTemplateId() => false;

    // Tom constructor kræves af Entity Framework Core
    public Event() { }

    // Constructor til at oprette et nyt event i koden
    public Event(string name, string? description, DateTime? startTime, DateTime? endTime, EventCategory category, int? templateId, int? seriesId = null, int id = 0)
    {
        Id = id;
        Name = name;
        Description = description;
        StartTime = startTime;
        EndTime = endTime;
        Date = startTime?.Date;
        Category = category;
        TemplateId = templateId;
        SeriesId = seriesId;
    }
}

namespace SportCenter.Api.Models;
using Postgrest.Attributes;
using Postgrest.Models;
using Newtonsoft.Json;
using SportCenter.Api.Models.Converters;
using EfColumn = System.ComponentModel.DataAnnotations.Schema.ColumnAttribute;

[Table("event_locations")]
public class EventLocation : BaseModel
{
    [PrimaryKey("eventlocations_id", true)]
    public int Id { get; set; }

    [Column("event_id")]
    public int EventId { get; set; }

    [JsonIgnore]
    public Event? Event { get; set; }

    [Column("location_id")]
    public int? LocationId { get; set; }

    [JsonIgnore]
    public Location? Location { get; set; }

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

}

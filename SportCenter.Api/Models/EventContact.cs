using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("event_contact")]
public class EventContact : BaseModel
{
    [PrimaryKey("event_id", false)]
    [Postgrest.Attributes.Column("event_id")]
    public int EventId { get; set; }

    [Postgrest.Attributes.Column("contact_id")]
    public int ContactId { get; set; }
}

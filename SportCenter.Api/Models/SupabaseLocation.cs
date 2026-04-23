using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Table("locations")]
public class SupabaseLocation : BaseModel
{
    [PrimaryKey("location_id", false)]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;
}

using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("qualifications")]
public class Qualification : BaseModel
{
    [PrimaryKey("qualification_id", false)]
    public int QualificationID { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;
}

using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("association")]
public class Association : BaseModel
{
    [PrimaryKey("association_id", true)]
    public int AssociationId { get; set; }

    public bool ShouldSerializeAssociationId() => false;

    [Postgrest.Attributes.Column("name")]
    public string Name { get; set; } = string.Empty;

    [Postgrest.Attributes.Column("website_url")]
    public string? WebsiteUrl { get; set; }

    [Postgrest.Attributes.Column("color")]
    public string? Color { get; set; }

    [Postgrest.Attributes.Column("logo")]
    public string? Logo { get; set; }
}

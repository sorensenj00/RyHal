using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("contact")]
public class Contact : BaseModel
{
    [PrimaryKey("contact_id", true)]
    public int ContactId { get; set; }

    public bool ShouldSerializeContactId() => false;

    [Postgrest.Attributes.Column("name")]
    public string Name { get; set; } = string.Empty;

    [Postgrest.Attributes.Column("title")]
    public string? Title { get; set; }

    [Postgrest.Attributes.Column("profile_image_url")]
    public string? ProfileImageUrl { get; set; }

    [Postgrest.Attributes.Column("phone")]
    public string? Phone { get; set; }

    [Postgrest.Attributes.Column("email")]
    public string? Email { get; set; }
}

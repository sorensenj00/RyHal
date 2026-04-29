using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("roles")]
public class Role : BaseModel
{
    [PrimaryKey("role_id", false)] 
    public int RoleId { get; set; }

    [Postgrest.Attributes.Column("name")]
    public string Name { get; set; } = string.Empty;

    [Postgrest.Attributes.Column("color")]
    public string Color { get; set; } = "--color-andet";
}
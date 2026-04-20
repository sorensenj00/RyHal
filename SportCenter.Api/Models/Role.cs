using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Table("Roles")]
public class Role : BaseModel
{
    [PrimaryKey("role_id", false)] 
    public int RoleId { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;
}
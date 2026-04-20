using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("employee_roles")]
public class EmployeeRole : BaseModel
{
    [PrimaryKey("employee_id", false)]
    public int EmployeeId { get; set; }

    [Postgrest.Attributes.Column("role_id")]
    public int RoleId { get; set; }

    [Reference(typeof(Role), ReferenceAttribute.JoinType.Left, true, "role_id")]
    public Role? Role { get; set; }
}
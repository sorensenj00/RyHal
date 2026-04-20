using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Table("EmployeeRoles")]
public class EmployeeRole : BaseModel
{
    [PrimaryKey("employee_id", false)]
    public int EmployeeId { get; set; }

    [Column("role_id")]
    public int RoleId { get; set; }

    [Reference(typeof(Role), ReferenceAttribute.JoinType.Left, true, "role_id")]
    public Role? Role { get; set; }
}
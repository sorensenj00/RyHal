using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("employees")]
public class Employee : BaseModel
{
    [PrimaryKey("employee_id", false)]
    public int EmployeeId { get; set; }

    [Postgrest.Attributes.Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Postgrest.Attributes.Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Postgrest.Attributes.Column("email")]
    public string? Email { get; set; }

    [Postgrest.Attributes.Column("phone")]
    public string? Phone { get; set; }

    [Postgrest.Attributes.Column("birthday")]
    public DateOnly? Birthday { get; set; }

    [Reference(typeof(EmployeeRole), ReferenceAttribute.JoinType.Left, true, "employee_id")]
    public List<EmployeeRole> EmployeeRoles { get; set; } = new List<EmployeeRole>();
}
using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Table("Employees")]
public class Employee : BaseModel
{
    [PrimaryKey("employee_id", false)]
    public int EmployeeId { get; set; }

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("birthday")]
    public DateOnly? Birthday { get; set; }

    [Reference(typeof(EmployeeRole), ReferenceAttribute.JoinType.Left, true, "employee_id")]
    public List<EmployeeRole> EmployeeRoles { get; set; } = new List<EmployeeRole>();

    [Reference(typeof(EmployeeRole), ReferenceAttribute.JoinType.Left, true, "employee_id")]
    public List<Qualification> Qualifications { get; set; } = new List<Qualification>();
}
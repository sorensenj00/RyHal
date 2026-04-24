using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("employee_qualifications")]
public class EmployeeQualification : BaseModel
{
    [PrimaryKey("employee_id", true)]
    public int EmployeeId { get; set; }

    [Postgrest.Attributes.Column("qualification_id")]
    public int QualificationId { get; set; }

    [Reference(typeof(Qualification), ReferenceAttribute.JoinType.Left, true, "qualification_id")]
    public Qualification? Qualification { get; set; }
}

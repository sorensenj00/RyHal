using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("shifts")]
public class Shift : BaseModel
{
    [PrimaryKey("shift_id", false)]
    public long ShiftId { get; set; }

    [Postgrest.Attributes.Column("start_time")]
    public DateTime StartTime { get; set; }

    [Postgrest.Attributes.Column("end_time")]
    public DateTime EndTime { get; set; }

    [Postgrest.Attributes.Column("employee_id")]
    public long? EmployeeId { get; set; }

    [Postgrest.Attributes.Column("shiftcategory_id")]
    public long ShiftCategoryId { get; set; }

    [Reference(typeof(ShiftCategory))]
    public ShiftCategory? Category { get; set; }

    public Shift() { }
}

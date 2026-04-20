using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Table("shifts")]
public class Shift : BaseModel
{
    [PrimaryKey("shift_id", false)]
    public long ShiftId { get; set; }

    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Column("end_time")]
    public DateTime EndTime { get; set; }

    [Column("employee_id")]
    public long? EmployeeId { get; set; }

    [Column("shiftcategory_id")]
    public long ShiftCategoryId { get; set; }

    [Reference(typeof(ShiftCategory))]
    public ShiftCategory? Category { get; set; }

    public Shift() { }
}

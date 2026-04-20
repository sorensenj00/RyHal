using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Table("shift_categories")] // Matcher dit nye RENAME
public class ShiftCategory : BaseModel
{
    [PrimaryKey("shiftcategory_id", false)]
    public long ShiftCategoryId { get; set; }

    [Column("name")]
    public string Name { get; set; }

    [Column("color")]
    public string Color { get; set; }
}

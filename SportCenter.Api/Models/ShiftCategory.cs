using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("shift_categories")] // Matcher dit nye RENAME
public class ShiftCategory : BaseModel
{
    [PrimaryKey("shiftcategory_id", false)]
    public long ShiftCategoryId { get; set; }

    [Postgrest.Attributes.Column("name")]
    public string Name { get; set; } = string.Empty;

    [Postgrest.Attributes.Column("color")]
    public string Color { get; set; } = string.Empty;
}

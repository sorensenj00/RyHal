using Postgrest.Attributes;
using Postgrest.Models;

public class Qualification : BaseModel
{
    [Column("name")]
	public string Name { get; set; }
    [Column("description")]
	public string Description { get; set; }
    [PrimaryKey("qualification_id", false)]
    public int QualificationID { get; set; }

}

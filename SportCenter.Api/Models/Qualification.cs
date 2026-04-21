using Postgrest.Attributes;
using Postgrest.Models;

public class Qualification : BaseModel
{
    [Column("name")]
	public string Name { get; set; }
    [Column("description")]
	public string Description { get; set; }
    [PrimaryKey("employee_id", false)]
    public int QualificationID { get; set; }

}

namespace SportCenter.Api.Models;
using Postgrest.Attributes;
using Postgrest.Models;

[Table("locations")]
public class Location : BaseModel
{
    [Column("name")]
    public string Name { get; set; }

    [PrimaryKey("location_id", false)]
    public int Id { get; set; }

    public Location() { }

    public Location(string name, int id) {
        Name = name;
        Id = id;
    }
}
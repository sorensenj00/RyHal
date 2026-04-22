using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("swap_status")]
public class SwapStatus : BaseModel
{
    [PrimaryKey("swap_status_id", false)]
    public long SwapStatusId { get; set; }

    [Postgrest.Attributes.Column("name")]
    public string Name { get; set; }

}


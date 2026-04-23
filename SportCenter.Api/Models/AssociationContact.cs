using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("association_contact")]
public class AssociationContact : BaseModel
{
    [PrimaryKey("association_id", false)]
    [Postgrest.Attributes.Column("association_id")]
    public int AssociationId { get; set; }

    [Postgrest.Attributes.Column("contact_id")]
    public int ContactId { get; set; }
}

using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Models;

[Postgrest.Attributes.Table("swap_requests")]
public class SwapRequest : BaseModel
{
    [PrimaryKey("swap_request_id", false)]
    public long SwapRequestId { get; set; }

    [Postgrest.Attributes.Column("requester_id")]
    public long RequesterId { get; set; }

    [Postgrest.Attributes.Column("target_employee_id")]
    public long TargetEmployeeId { get; set; }

    [Postgrest.Attributes.Column("offered_shift_id")]
    public long OfferedShiftId { get; set; }

    [Postgrest.Attributes.Column("requested_shift_id")]
    public long RequestedShiftId { get; set; }

    [Postgrest.Attributes.Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Reference(typeof(SwapStatus))]
    public SwapStatus? Status { get; set; }


}

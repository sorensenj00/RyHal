namespace SportCenter.Api.DTOs
{
    public class CreateSwapRequestDto
    {
        public long RequesterId { get; set; }
        public long OfferedShiftId { get; set; }
        public long RequestedShiftId { get; set; }
    }
}

using Supabase;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Services
{
    public class SwapRequestService
    {
        private readonly Supabase.Client _supabase;

        public SwapRequestService(Supabase.Client supabase)
        {
            _supabase = supabase;
        }

        public async Task<List<SwapRequest>> GetAllSwapRequestsAsync(string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var result = await _supabase.From<SwapRequest>().Get();
            return result.Models;
        }

        public async Task<SwapRequest?> CreateSwapRequestAsync(long requesterId, long offeredShiftId, long requestedShiftId, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }
            if (requesterId <= 0) throw new ArgumentException("Ugyldigt requesterId");
            if (offeredShiftId <= 0) throw new ArgumentException("Ugyldigt offeredShiftId");
            if (requestedShiftId <= 0) throw new ArgumentException("Ugyldigt requestedShiftId");
            if (offeredShiftId == requestedShiftId) throw new InvalidOperationException("Man kan ikke bytte en vagt med sig selv.");

            var requester = await _supabase
                .From<Employee>()
                .Where(e => e.EmployeeId == requesterId)
                .Single();

            if (requester == null) throw new InvalidOperationException("Requester findes ikke.");

            var offeredShift = await _supabase
                .From<Shift>()
                .Where(s => s.ShiftId == offeredShiftId)
                .Single();

            var requestedShift = await _supabase
                .From<Shift>()
                .Where(s => s.ShiftId == requestedShiftId)
                .Single();

            if (offeredShift == null || requestedShift == null)
                throw new InvalidOperationException("En eller begge vagter findes ikke.");

            if (offeredShift.EmployeeId != requesterId)
                throw new InvalidOperationException("Requester ejer ikke den tilbudte vagt.");

            if (requestedShift.EmployeeId == requesterId)
                throw new InvalidOperationException("Man kan ikke oprette et bytte med sin egen vagt.");

            if (offeredShift.StartTime <= DateTime.UtcNow || requestedShift.StartTime <= DateTime.UtcNow)
                throw new InvalidOperationException("Man kan ikke bytte vagter, der er startet eller afsluttet.");

            var existingActiveSwap = await _supabase
                .From<SwapRequest>()
                .Where(sr =>
                    (sr.OfferedShiftId == offeredShiftId || sr.RequestedShiftId == offeredShiftId ||
                     sr.OfferedShiftId == requestedShiftId || sr.RequestedShiftId == requestedShiftId) &&
                     sr.Status.Name == "Pending")
                .Get();

            if (existingActiveSwap.Models.Any()) throw new InvalidOperationException("En af vagterne indgår allerede i en aktiv bytteanmodning.");

            var newSwapRequest = new SwapRequest
            {
                RequesterId = requesterId,
                TargetEmployeeId = (long)requestedShift.EmployeeId,
                OfferedShiftId = offeredShiftId,
                RequestedShiftId = requestedShiftId,
                Status = new SwapStatus { Name = "Pending" },
                CreatedAt = DateTime.UtcNow
            };
            var result = await _supabase.From<SwapRequest>().Insert(newSwapRequest);
            return result.Models.FirstOrDefault();
        }
    }
}

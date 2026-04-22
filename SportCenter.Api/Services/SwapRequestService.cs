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

            ValidateIds(requesterId, offeredShiftId, requestedShiftId);

            var requester = await GetRequesterAsync(requesterId);
            var offeredShift = await GetShiftAsync(offeredShiftId);
            var requestedShift = await GetShiftAsync(requestedShiftId);

            ValidateEntitiesExist(requester, offeredShift, requestedShift);
            ValidateOwnership(requesterId, offeredShift, requestedShift);
            ValidateShiftTimes(offeredShift, requestedShift);

            await ValidateNoOverlapAsync(requesterId, offeredShift, requestedShift);
            await ValidateNoExistingActiveSwapAsync(offeredShiftId, requestedShiftId);

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


        private bool Overlaps(DateTime start1, DateTime end1, DateTime start2, DateTime end2)
        {
            return start1 < end2 && start2 < end1;
        }

        private async Task<bool> HasOverlappingShiftAsync(long employeeId, Shift incomingShift, long shiftToIgnoreId)
        {
            var employeeShifts = await _supabase
                .From<Shift>()
                .Where(s => s.EmployeeId == employeeId)
                .Get();

            return employeeShifts.Models.Any(s =>
                s.ShiftId != shiftToIgnoreId &&
                Overlaps(s.StartTime, s.EndTime, incomingShift.StartTime, incomingShift.EndTime));
        }

        private void ValidateIds(long requesterId, long offeredShiftId, long requestedShiftId)
        {
            if (requesterId <= 0)
                throw new ArgumentException("Ugyldigt requesterId");

            if (offeredShiftId <= 0)
                throw new ArgumentException("Ugyldigt offeredShiftId");

            if (requestedShiftId <= 0)
                throw new ArgumentException("Ugyldigt requestedShiftId");

            if (offeredShiftId == requestedShiftId)
                throw new InvalidOperationException("Man kan ikke bytte en vagt med sig selv.");
        }

        private async Task<Employee?> GetRequesterAsync(long requesterId)
        {
            return await _supabase
                .From<Employee>()
                .Where(e => e.EmployeeId == requesterId)
                .Single();
        }

        private async Task<Shift?> GetShiftAsync(long shiftId)
        {
            return await _supabase
                .From<Shift>()
                .Where(s => s.ShiftId == shiftId)
                .Single();
        }

        private void ValidateEntitiesExist(Employee? requester, Shift? offeredShift, Shift? requestedShift)
        {
            if (requester == null)
                throw new InvalidOperationException("Requester findes ikke.");

            if (offeredShift == null || requestedShift == null)
                throw new InvalidOperationException("En eller begge vagter findes ikke.");
        }

        private void ValidateOwnership(long requesterId, Shift offeredShift, Shift requestedShift)
        {
            if (offeredShift.EmployeeId != requesterId)
                throw new InvalidOperationException("Requester ejer ikke den tilbudte vagt.");

            if (requestedShift.EmployeeId == requesterId)
                throw new InvalidOperationException("Man kan ikke oprette et bytte med sin egen vagt.");
        }

        private void ValidateShiftTimes(Shift offeredShift, Shift requestedShift)
        {
            if (offeredShift.StartTime <= DateTime.UtcNow || requestedShift.StartTime <= DateTime.UtcNow)
                throw new InvalidOperationException("Man kan ikke bytte vagter, der er startet eller afsluttet.");
        }

        private async Task ValidateNoOverlapAsync(long requesterId, Shift offeredShift, Shift requestedShift)
        {
            var requesterWouldOverlap = await HasOverlappingShiftAsync(
                requesterId,
                requestedShift,
                offeredShift.ShiftId);

            if (requesterWouldOverlap)
                throw new InvalidOperationException("Byttet giver overlap i requesterens kalender.");

            var targetEmployeeId = requestedShift.EmployeeId;

            var targetWouldOverlap = await HasOverlappingShiftAsync(
                (long)targetEmployeeId,
                offeredShift,
                requestedShift.ShiftId);

            if (targetWouldOverlap)
                throw new InvalidOperationException("Byttet giver overlap i den anden medarbejders kalender.");
        }

        private async Task ValidateNoExistingActiveSwapAsync(long offeredShiftId, long requestedShiftId)
        {
            var existingActiveSwap = await _supabase
                .From<SwapRequest>()
                .Where(sr =>
                    (sr.OfferedShiftId == offeredShiftId || sr.RequestedShiftId == offeredShiftId ||
                     sr.OfferedShiftId == requestedShiftId || sr.RequestedShiftId == requestedShiftId) &&
                     sr.Status.Name == "Pending")
                .Get();

            if (existingActiveSwap.Models.Any())
                throw new InvalidOperationException("En af vagterne indgår allerede i en aktiv bytteanmodning.");
        }

    }
}

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
            await SetSessionIfNeededAsync(accessToken);

            var result = await _supabase.From<SwapRequest>().Get();
            return result.Models;
        }

        public async Task<SwapRequest?> CreateSwapRequestAsync(long requesterId, long offeredShiftId, long requestedShiftId, string? accessToken = null)
        {
            await SetSessionIfNeededAsync(accessToken);

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

        public async Task<SwapRequest?> AcceptSwapRequestAsync(long swapRequestId, long employeeId, string? accessToken = null)
        {
            await SetSessionIfNeededAsync(accessToken);
            ValidateSwapRequestActionIds(swapRequestId, employeeId);

            var swapRequest = await GetSwapRequestAsync(swapRequestId);
            ValidateSwapRequestExists(swapRequest);
            ValidateCanBeAcceptedByEmployee(swapRequest!, employeeId);

            var offeredShift = await GetShiftAsync(swapRequest!.OfferedShiftId);
            var requestedShift = await GetShiftAsync(swapRequest.RequestedShiftId);

            try
            {
                ValidateShiftsExist(offeredShift, requestedShift);
                ValidateShiftOwnershipForSwapRequest(swapRequest, offeredShift!, requestedShift!);
                ValidateShiftTimes(offeredShift!, requestedShift!);
                await ValidateNoOverlapAsync(swapRequest.RequesterId, offeredShift!, requestedShift!);

            }
            catch (InvalidOperationException)
            {
                swapRequest.Status = new SwapStatus { Name = "Invalid" };
                await _supabase.From<SwapRequest>().Update(swapRequest);
                throw;
            }

            swapRequest.Status = new SwapStatus { Name = "AwaitingApproval" };

            var result = await _supabase
                .From<SwapRequest>()
                .Update(swapRequest);

            return result.Models.FirstOrDefault();
        }

        public async Task<SwapRequest?> RejectSwapRequestAsync(long swapRequestId, long employeeId, string? accessToken = null)
        {
            await SetSessionIfNeededAsync(accessToken);
            ValidateSwapRequestActionIds(swapRequestId, employeeId);

            var swapRequest = await GetSwapRequestAsync(swapRequestId);
            ValidateSwapRequestExists(swapRequest);
            ValidateCanBeRejectedByEmployee(swapRequest!, employeeId);

            swapRequest.Status = new SwapStatus { Name = "Rejected" };

            var result = await _supabase
                .From<SwapRequest>()
                .Update(swapRequest);

            return result.Models.FirstOrDefault();
        }

        public async Task<SwapRequest?> ApproveSwapRequestAsync(long swapRequestId, long approverEmployeeId, string? accessToken = null)
        {
            await SetSessionIfNeededAsync(accessToken);
            ValidateApproveSwapRequestIds(swapRequestId, approverEmployeeId);

            var approver = await GetRequesterAsync(approverEmployeeId);
            ValidateApproverExists(approver);

            var swapRequest = await GetSwapRequestAsync(swapRequestId);
            ValidateSwapRequestExists(swapRequest);
            ValidateCanBeApproved(swapRequest!);

            var offeredShift = await GetShiftAsync(swapRequest!.OfferedShiftId);
            var requestedShift = await GetShiftAsync(swapRequest.RequestedShiftId);

            try
            {
                ValidateShiftsExist(offeredShift, requestedShift);
                ValidateShiftOwnershipForSwapRequest(swapRequest, offeredShift!, requestedShift!);
                ValidateShiftTimes(offeredShift!, requestedShift!);
                await ValidateNoOverlapAsync(swapRequest.RequesterId, offeredShift!, requestedShift!);

                await ExecuteShiftSwapAsync(
                    swapRequest.RequesterId,
                    swapRequest.TargetEmployeeId,
                    offeredShift!,
                    requestedShift!);
            }
            catch (InvalidOperationException)
            {
                swapRequest.Status = new SwapStatus { Name = "Invalid" };
                await _supabase.From<SwapRequest>().Update(swapRequest);
                throw;
            }

            swapRequest.Status = new SwapStatus { Name = "Completed" };

            var result = await _supabase
                .From<SwapRequest>()
                .Update(swapRequest);

            return result.Models.FirstOrDefault();
        }


        // Hjælpemetoder til validering og hentning af data

        private async Task SetSessionIfNeededAsync(string? accessToken)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }
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

        private async Task<SwapRequest?> GetSwapRequestAsync(long swapRequestId)
        {
            return await _supabase
                .From<SwapRequest>()
                .Where(sr => sr.SwapRequestId == swapRequestId)
                .Single();
        }

        private void ValidateSwapRequestActionIds(long swapRequestId, long employeeId)
        {
            if (swapRequestId <= 0)
                throw new ArgumentException("Ugyldigt swapRequestId");

            if (employeeId <= 0)
                throw new ArgumentException("Ugyldigt employeeId");
        }

        private void ValidateSwapRequestExists(SwapRequest? swapRequest)
        {
            if (swapRequest == null)
                throw new InvalidOperationException("Swap request findes ikke.");
        }

        private void ValidateCanBeAcceptedByEmployee(SwapRequest swapRequest, long employeeId)
        {
            if (swapRequest.TargetEmployeeId != employeeId)
                throw new InvalidOperationException("Kun den anmodede medarbejder kan acceptere byttet.");

            if (swapRequest.Status?.Name != "Pending")
                throw new InvalidOperationException("Kun swap requests med status 'Pending' kan accepteres.");
        }

        private void ValidateShiftsExist(Shift? offeredShift, Shift? requestedShift)
        {
            if (offeredShift == null || requestedShift == null)
                throw new InvalidOperationException("En eller begge vagter findes ikke.");
        }

        private void ValidateShiftOwnershipForSwapRequest(SwapRequest swapRequest, Shift offeredShift, Shift requestedShift)
        {
            if (offeredShift.EmployeeId != swapRequest.RequesterId)
                throw new InvalidOperationException("Den tilbudte vagt ejes ikke længere af requester.");

            if (requestedShift.EmployeeId != swapRequest.TargetEmployeeId)
                throw new InvalidOperationException("Den ønskede vagt ejes ikke længere af target-medarbejderen.");
        }

        private void ValidateCanBeRejectedByEmployee(SwapRequest swapRequest, long employeeId)
        {
            if (swapRequest.TargetEmployeeId != employeeId)
                throw new InvalidOperationException("Kun den anmodede medarbejder kan afvise byttet.");

            if (swapRequest.Status?.Name != "Pending")
                throw new InvalidOperationException("Kun swap requests med status 'Pending' kan afvises.");
        }

        private void ValidateApproveSwapRequestIds(long swapRequestId, long adminEmployeeId)
        {
            if (swapRequestId <= 0)
                throw new ArgumentException("Ugyldigt swapRequestId");

            if (adminEmployeeId <= 0)
                throw new ArgumentException("Ugyldigt adminEmployeeId");
        }

        private async Task ExecuteShiftSwapAsync(long requesterId, long targetEmployeeId, Shift offeredShift, Shift requestedShift)
        {
            offeredShift.EmployeeId = targetEmployeeId;
            requestedShift.EmployeeId = requesterId;

            await _supabase
                .From<Shift>()
                .Update(offeredShift);

            await _supabase
                .From<Shift>()
                .Update(requestedShift);
        }

        private void ValidateCanBeApproved(SwapRequest swapRequest)
        {
            if (swapRequest.Status?.Name != "AwaitingApproval")
                throw new InvalidOperationException("Kun swap requests med status 'AwaitingApproval' kan godkendes.");
        }

        private void ValidateApproverExists(Employee? approver)
        {
            if (approver == null)
                throw new InvalidOperationException("Godkenderen findes ikke.");
        }

    }
}

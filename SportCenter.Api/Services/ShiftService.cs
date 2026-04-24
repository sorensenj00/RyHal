using Supabase;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Services
{
    public class ShiftService
    {
        private readonly Supabase.Client _supabase;

        public ShiftService(Supabase.Client supabase)
        {
            _supabase = supabase;
        }


        public async Task<List<Shift>> GetAllShiftsAsync(string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var result = await _supabase.From<Shift>().Get();
            return result.Models;
        }



        public async Task<Shift?> CreateShiftAsync(DateTime startTime, DateTime endTime, long categoryId, long? employeeId = null, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var start = DateTime.SpecifyKind(startTime, DateTimeKind.Unspecified);
            var end = DateTime.SpecifyKind(endTime, DateTimeKind.Unspecified);

            var newShift = new Shift
            {
                StartTime = startTime,
                EndTime = endTime,
                ShiftCategoryId = categoryId,
                EmployeeId = (employeeId == 0) ? null : employeeId
            };

            var result = await _supabase.From<Shift>().Insert(newShift);
            return result.Models.FirstOrDefault();
        }


        // Opdatering af en vagt baseret på ShiftDto
        public async Task<bool> UpdateShiftAsync(ShiftDto dto, string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var shiftUpdate = new Shift
            {
                ShiftId = dto.ShiftId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                ShiftCategoryId = dto.CategoryId,
                EmployeeId = (dto.EmployeeId == 0) ? null : dto.EmployeeId
            };

            var result = await _supabase.From<Shift>()
                .Where(x => x.ShiftId == dto.ShiftId)
                .Update(shiftUpdate);

            return result.Models.Any();
        }


        public async Task<List<ShiftCategory>> GetAllCategoriesAsync(string? accessToken = null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var result = await _supabase.From<ShiftCategory>().Get();
            return result.Models;
        }




        public async Task<bool> SetEmployeeAsync(long shiftId, long employeeId)
        {
            // Hvis employeeId er -1, fjerner vi medarbejderen fra vagten (null)
            long? dbEmployeeId = (employeeId == -1) ? null : employeeId;

            var update = await _supabase.From<Shift>()
                .Where(x => x.ShiftId == shiftId)
                .Set(x => (object)x.EmployeeId!, dbEmployeeId)
                .Update();

            return update.Models.Any();
        }

        public async Task<bool> RemoveShiftAsync(long shiftId, string? accessToken = null)
        {
            // Sørg for at autentificere mod Supabase inden sletning
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            try 
            {
                await _supabase.From<Shift>()
                    .Where(x => x.ShiftId == shiftId)
                    .Delete();
                
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }








    }



}

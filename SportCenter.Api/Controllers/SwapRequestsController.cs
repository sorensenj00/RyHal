using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.Services;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SwapRequestsController : ControllerBase
    {
        private readonly SwapRequestService _swapService;
        private readonly AuthContextService _authContextService;

        public SwapRequestsController(SwapRequestService swapService, AuthContextService authContextService)
        {
            _swapService = swapService;
            _authContextService = authContextService;
        }

        private string? GetToken()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            return authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : null;
        }

        // GET: api/swaprequests
        [HttpGet]
        public async Task<IActionResult> GetSwapRequests()
        {
            try
            {
                var token = GetToken();
                var authMe = await _authContextService.GetAuthMeAsync(token);
                var swaps = await _swapService.GetAllSwapRequestsAsync(token);

                if (!string.Equals(authMe.AppAccess, "admin", StringComparison.OrdinalIgnoreCase))
                {
                    swaps = swaps
                        .Where(s => s.RequesterId == authMe.EmployeeId || s.TargetEmployeeId == authMe.EmployeeId)
                        .ToList();
                }

                return Ok(swaps);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // POST: api/swaprequests
        [HttpPost]
        public async Task<IActionResult> CreateSwapRequest([FromBody] CreateSwapRequestDto dto)
        {
            try
            {
                var token = GetToken();
                var authMe = await _authContextService.GetAuthMeAsync(token);

                var result = await _swapService.CreateSwapRequestAsync(
                    authMe.EmployeeId,
                    dto.OfferedShiftId,
                    dto.RequestedShiftId,
                    token);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/swaprequests/{id}/accept
        [HttpPost("{id}/accept")]
        public async Task<IActionResult> AcceptSwap(long id, [FromBody] EmployeeActionDto dto)
        {
            try
            {
                var token = GetToken();
                var authMe = await _authContextService.GetAuthMeAsync(token);

                var result = await _swapService.AcceptSwapRequestAsync(id, authMe.EmployeeId, token);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/swaprequests/{id}/reject
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectSwap(long id, [FromBody] EmployeeActionDto dto)
        {
            try
            {
                var token = GetToken();
                var authMe = await _authContextService.GetAuthMeAsync(token);

                var result = await _swapService.RejectSwapRequestAsync(id, authMe.EmployeeId, token);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/swaprequests/{id}/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveSwap(long id, [FromBody] EmployeeActionDto dto)
        {
            try
            {
                var token = GetToken();
                var authMe = await _authContextService.RequireAdminAsync(token);

                var result = await _swapService.ApproveSwapRequestAsync(id, authMe.EmployeeId, token);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}

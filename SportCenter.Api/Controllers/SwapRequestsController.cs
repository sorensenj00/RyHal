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

        public SwapRequestsController(SwapRequestService swapService)
        {
            _swapService = swapService;
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
                var swaps = await _swapService.GetAllSwapRequestsAsync(token);

                return Ok(swaps);
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

                var result = await _swapService.CreateSwapRequestAsync(
                    dto.RequesterId,
                    dto.OfferedShiftId,
                    dto.RequestedShiftId,
                    token);

                return Ok(result);
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

                var result = await _swapService.AcceptSwapRequestAsync(id, dto.EmployeeId, token);

                return Ok(result);
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

                var result = await _swapService.RejectSwapRequestAsync(id, dto.EmployeeId, token);

                return Ok(result);
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

                var result = await _swapService.ApproveSwapRequestAsync(id, dto.EmployeeId, token);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.DTOs;
using SportCenter.Api.Services;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthContextService _authContextService;
    private readonly AuthTransferService _authTransferService;

    public AuthController(AuthContextService authContextService, AuthTransferService authTransferService)
    {
        _authContextService = authContextService;
        _authTransferService = authTransferService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader[7..]
                : null;

            var authMe = await _authContextService.GetAuthMeAsync(token);
            return Ok(authMe);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { Message = ex.Message });
        }
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> CreateTransfer([FromBody] CreateTransferRequestDto request)
    {
        try
        {
            var token = GetToken();
            await _authContextService.GetAuthMeAsync(token);

            var transfer = _authTransferService.CreateTransfer(token!, request?.RefreshToken ?? string.Empty);
            return Ok(transfer);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Kunne ikke oprette app-transfer." });
        }
    }

    [HttpPost("transfer/redeem")]
    public IActionResult RedeemTransfer([FromBody] RedeemTransferRequestDto request)
    {
        try
        {
            var session = _authTransferService.RedeemTransfer(request?.TransferCode ?? string.Empty);
            return Ok(session);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Kunne ikke indløse app-transfer." });
        }
    }

    private string? GetToken()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        return authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader[7..]
            : null;
    }
}

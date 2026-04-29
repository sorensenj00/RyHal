using Microsoft.AspNetCore.Mvc;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using SportCenter.Api.Services;
using Supabase;

namespace SportCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly AuthContextService _authContextService;
    private readonly Client _supabase;

    public RolesController(AuthContextService authContextService, Client supabase)
    {
        _authContextService = authContextService;
        _supabase = supabase;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            if (!string.IsNullOrWhiteSpace(token))
            {
                await _supabase.Auth.SetSession(token, "refresh-token-not-needed");
            }

            var response = await _supabase
                .From<Role>()
                .Select("*")
                .Get();

            var roles = response.Models
                .OrderBy(x => x.Name)
                .Select(x => new RoleAdminDto
                {
                    RoleId = x.RoleId,
                    Name = x.Name,
                    Color = NormalizeColor(x.Color)
                })
                .ToList();

            return Ok(roles);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke hente roller.", Details = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto dto)
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            if (!string.IsNullOrWhiteSpace(token))
            {
                await _supabase.Auth.SetSession(token, "refresh-token-not-needed");
            }

            var name = NormalizeName(dto?.Name);
            var color = NormalizeColor(dto?.Color);

            var existing = await _supabase
                .From<Role>()
                .Where(x => x.Name == name)
                .Get();

            if (existing.Models.Any())
            {
                return Conflict(new { Message = "Rollen findes allerede." });
            }

            var insert = await _supabase
                .From<Role>()
                .Insert(new Role
                {
                    Name = name,
                    Color = color
                });

            var created = insert.Models.FirstOrDefault();
            if (created == null)
            {
                return StatusCode(500, new { Message = "Rollen blev ikke oprettet korrekt." });
            }

            return Ok(new RoleAdminDto
            {
                RoleId = created.RoleId,
                Name = created.Name,
                Color = NormalizeColor(created.Color)
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke oprette rolle.", Details = ex.Message });
        }
    }

    [HttpPut("{id}/color")]
    public async Task<IActionResult> UpdateRoleColor(int id, [FromBody] UpdateRoleColorDto dto)
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            if (!string.IsNullOrWhiteSpace(token))
            {
                await _supabase.Auth.SetSession(token, "refresh-token-not-needed");
            }

            var color = NormalizeColor(dto?.Color);

            var existing = await _supabase
                .From<Role>()
                .Where(x => x.RoleId == id)
                .Get();

            if (!existing.Models.Any())
            {
                return NotFound(new { Message = "Rollen blev ikke fundet." });
            }

            await _supabase
                .From<Role>()
                .Where(x => x.RoleId == id)
                .Set(x => (object)x.Color!, color)
                .Update();

            return Ok(new { RoleId = id, Color = color, Message = "Rollefarve opdateret." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke opdatere rollefarven.", Details = ex.Message });
        }
    }

    [HttpPut("{id}/name")]
    public async Task<IActionResult> UpdateRoleName(int id, [FromBody] UpdateRoleNameDto dto)
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            if (!string.IsNullOrWhiteSpace(token))
            {
                await _supabase.Auth.SetSession(token, "refresh-token-not-needed");
            }

            var name = NormalizeName(dto?.Name);

            var existing = await _supabase
                .From<Role>()
                .Where(x => x.RoleId == id)
                .Get();

            var current = existing.Models.FirstOrDefault();
            if (current == null)
            {
                return NotFound(new { Message = "Rollen blev ikke fundet." });
            }

            if (string.Equals(current.Name?.Trim(), name, StringComparison.Ordinal))
            {
                return Ok(new { RoleId = id, Name = name, Message = "Rollenavn er uændret." });
            }

            var duplicate = await _supabase
                .From<Role>()
                .Where(x => x.Name == name)
                .Get();

            if (duplicate.Models.Any(x => x.RoleId != id))
            {
                return Conflict(new { Message = "Rollen findes allerede." });
            }

            await _supabase
                .From<Role>()
                .Where(x => x.RoleId == id)
                .Set(x => (object)x.Name!, name)
                .Update();

            return Ok(new { RoleId = id, Name = name, Message = "Rollenavn opdateret." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Kunne ikke opdatere rollenavnet.", Details = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        try
        {
            var token = GetToken();
            await _authContextService.RequireAdminAsync(token);

            if (!string.IsNullOrWhiteSpace(token))
            {
                await _supabase.Auth.SetSession(token, "refresh-token-not-needed");
            }

            var existing = await _supabase
                .From<Role>()
                .Where(x => x.RoleId == id)
                .Get();

            if (!existing.Models.Any())
            {
                return NotFound(new { Message = "Rollen blev ikke fundet." });
            }

            await _supabase
                .From<Role>()
                .Where(x => x.RoleId == id)
                .Delete();

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            var details = ex.Message?.ToLowerInvariant() ?? string.Empty;
            if (details.Contains("foreign key") || details.Contains("violates"))
            {
                return Conflict(new { Message = "Rollen er i brug og kan ikke slettes." });
            }

            return StatusCode(500, new { Message = "Kunne ikke slette rollen.", Details = ex.Message });
        }
    }

    private string? GetToken()
    {
        var authHeader = Request.Headers["Authorization"].ToString();
        return authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader[7..]
            : null;
    }

    private static string NormalizeName(string? value)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new InvalidOperationException("Rollenavn må ikke være tomt.");
        }

        return normalized;
    }

    private static string NormalizeColor(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? "--color-andet" : normalized;
    }
}

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using Supabase;

namespace SportCenter.Api.Services;

public sealed class AuthContextService
{
    private readonly Client _supabase;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public AuthContextService(Client supabase, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _supabase = supabase;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<AuthMeDto> GetAuthMeAsync(string? accessToken)
    {
        var token = NormalizeToken(accessToken);
        var supabaseUser = await GetSupabaseUserAsync(token);

        await _supabase.Auth.SetSession(token, "refresh-token-not-needed");

        var employeeResponse = await _supabase
            .From<Employee>()
            .Where(x => x.SupabaseUserId == supabaseUser.Id)
            .Get();

        var employee = employeeResponse.Models.FirstOrDefault();
        if (employee == null)
        {
            throw new UnauthorizedAccessException("Brugeren er ikke koblet til en medarbejder.");
        }

        var appAccess = NormalizeAppAccess(employee.AppAccess);

        return new AuthMeDto
        {
            SupabaseUserId = supabaseUser.Id,
            EmployeeId = employee.EmployeeId,
            AppAccess = appAccess,
            RedirectTarget = appAccess == "admin" ? "admin-dashboard" : "employee-app",
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Email = supabaseUser.Email ?? employee.Email
        };
    }

    public async Task<AuthMeDto> RequireAdminAsync(string? accessToken)
    {
        var authMe = await GetAuthMeAsync(accessToken);
        if (!string.Equals(authMe.AppAccess, "admin", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Denne handling kræver administratoradgang.");
        }

        return authMe;
    }

    private async Task<SupabaseAuthUserDto> GetSupabaseUserAsync(string accessToken)
    {
        var supabaseUrl = _configuration["Supabase:Url"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("Supabase URL mangler");

        var supabaseKey = _configuration["Supabase:Key"]
            ?? throw new InvalidOperationException("Supabase Key mangler");

        var client = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, $"{supabaseUrl}/auth/v1/user");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.TryAddWithoutValidation("apikey", supabaseKey);

        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new UnauthorizedAccessException("Supabase-sessionen er ugyldig eller udløbet.");
        }

        var user = await response.Content.ReadFromJsonAsync<SupabaseAuthUserDto>(_jsonOptions);
        if (user == null || string.IsNullOrWhiteSpace(user.Id))
        {
            throw new UnauthorizedAccessException("Kunne ikke læse den aktuelle bruger.");
        }

        return user;
    }

    private static string NormalizeToken(string? accessToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedAccessException("Manglende adgangstoken.");
        }

        return accessToken.Trim();
    }

    private static string NormalizeAppAccess(string? appAccess)
    {
        var normalized = appAccess?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new UnauthorizedAccessException("Medarbejderen mangler app-adgang.");
        }

        if (normalized is not ("admin" or "employee"))
        {
            throw new UnauthorizedAccessException($"Ukendt app-adgang: {appAccess}");
        }

        return normalized;
    }

    private sealed class SupabaseAuthUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Email { get; set; }
    }
}

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace SportCenter.Api.Services;

public sealed class SupabaseAuthProvisioningService : IEmployeeAuthProvisioningService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public SupabaseAuthProvisioningService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(GetServiceRoleKey());

    public async Task<ProvisionedSupabaseUser> ProvisionEmployeeAsync(
        string email,
        string firstName,
        string lastName,
        string phone,
        string appAccess)
    {
        if (!IsConfigured)
        {
            return new ProvisionedSupabaseUser(string.Empty, NormalizeEmail(email), false, true);
        }

        var supabaseUrl = GetSupabaseUrl();
        var serviceRoleKey = GetValidatedServiceRoleKey();
        var normalizedEmail = NormalizeEmail(email);
        var recoveryRedirectUrl = GetRecoveryRedirectUrl();
        var userId = Guid.NewGuid().ToString();
        var temporaryPassword = GenerateTemporaryPassword();

        var client = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, $"{supabaseUrl}/auth/v1/admin/users");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.TryAddWithoutValidation("apikey", serviceRoleKey);
        request.Content = JsonContent.Create(new
        {
            id = userId,
            email = normalizedEmail,
            password = temporaryPassword,
            email_confirm = true,
            user_metadata = new
            {
                first_name = firstName?.Trim(),
                last_name = lastName?.Trim(),
                phone = phone?.Trim(),
                app_access = appAccess?.Trim().ToLowerInvariant()
            }
        }, options: _jsonOptions);

        var response = await client.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw CreateFriendlyException(response.StatusCode, responseBody, normalizedEmail);
        }

        var provisionedUser = ParseProvisionedUser(responseBody, normalizedEmail);
        var createdUserId = string.IsNullOrWhiteSpace(provisionedUser.UserId) ? userId : provisionedUser.UserId;

        try
        {
            await SendRecoveryEmailAsync(normalizedEmail, recoveryRedirectUrl);
        }
        catch
        {
            await DeleteUserAsync(createdUserId);
            throw;
        }

        return new ProvisionedSupabaseUser(createdUserId, normalizedEmail, true);
    }

    public async Task DeleteUserAsync(string supabaseUserId)
    {
        var normalizedUserId = supabaseUserId?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedUserId))
        {
            return;
        }

        var supabaseUrl = GetSupabaseUrl();
        var serviceRoleKey = GetValidatedServiceRoleKey();

        var client = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Delete, $"{supabaseUrl}/auth/v1/admin/users/{normalizedUserId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.TryAddWithoutValidation("apikey", serviceRoleKey);

        var response = await client.SendAsync(request);
        if (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.NotFound)
        {
            return;
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException(
            $"Kunne ikke rydde op i Supabase-login for bruger {normalizedUserId}: {ExtractFriendlyMessage(responseBody)}");
    }

    private async Task SendRecoveryEmailAsync(string email, string redirectUrl)
    {
        var supabaseUrl = GetSupabaseUrl();
        var serviceRoleKey = GetValidatedServiceRoleKey();

        var recoverUrl = $"{supabaseUrl}/auth/v1/recover?redirect_to={Uri.EscapeDataString(redirectUrl)}";
        var client = _httpClientFactory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, recoverUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.TryAddWithoutValidation("apikey", serviceRoleKey);
        request.Content = JsonContent.Create(new
        {
            email = email.Trim().ToLowerInvariant()
        }, options: _jsonOptions);

        var response = await client.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Kunne ikke sende password reset mail til {email}: {ExtractFriendlyMessage(responseBody)}");
        }
    }

    private static string GenerateTemporaryPassword()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return $"{Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')}Aa1!";
    }

    private ProvisionedSupabaseUser ParseProvisionedUser(string responseBody, string fallbackEmail)
    {
        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;

        var userId =
            TryGetString(root, "id") ??
            TryGetString(root, "user_id") ??
            TryGetNestedString(root, "user", "id") ??
            TryGetNestedString(root, "user", "user_id") ??
            TryGetNestedString(root, "data", "id") ??
            TryGetNestedString(root, "data", "user_id");

        var email =
            TryGetString(root, "email") ??
            TryGetNestedString(root, "user", "email") ??
            fallbackEmail;

        return new ProvisionedSupabaseUser(userId ?? string.Empty, email, true);
    }

    private InvalidOperationException CreateFriendlyException(HttpStatusCode statusCode, string responseBody, string email)
    {
        var friendlyMessage = ExtractFriendlyMessage(responseBody);

        if (friendlyMessage.Contains("invalid api key", StringComparison.OrdinalIgnoreCase))
        {
            return new InvalidOperationException(
                $"Kunne ikke oprette Supabase-login for {email}: Ugyldig Supabase admin-nøgle. " +
                "Sæt en gyldig `Supabase:ServiceRoleKey` (legacy JWT med role=service_role) eller `Supabase:SecretKey` (sb_secret_...) i backend-konfigurationen.");
        }

        if (statusCode is HttpStatusCode.Conflict ||
            statusCode is HttpStatusCode.UnprocessableEntity ||
            friendlyMessage.Contains("already", StringComparison.OrdinalIgnoreCase) ||
            friendlyMessage.Contains("registered", StringComparison.OrdinalIgnoreCase))
        {
            return new InvalidOperationException($"Der findes allerede et Supabase-login for {email}.");
        }

        return new InvalidOperationException($"Kunne ikke oprette Supabase-login for {email}: {friendlyMessage}");
    }

    private string GetSupabaseUrl()
    {
        var supabaseUrl = _configuration["Supabase:Url"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(supabaseUrl))
        {
            throw new InvalidOperationException("Supabase URL mangler.");
        }

        return supabaseUrl;
    }

    private string? GetServiceRoleKey()
    {
        var serviceRoleKey =
            NormalizeSecret(_configuration["Supabase:ServiceRoleKey"])
            ?? NormalizeSecret(_configuration["Supabase:SecretKey"])
            ?? NormalizeSecret(Environment.GetEnvironmentVariable("Supabase__ServiceRoleKey"))
            ?? NormalizeSecret(Environment.GetEnvironmentVariable("Supabase__SecretKey"))
            ?? NormalizeSecret(Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"))
            ?? NormalizeSecret(Environment.GetEnvironmentVariable("SUPABASE_SECRET_KEY"));

        if (IsPlaceholderSecret(serviceRoleKey))
        {
            return null;
        }

        return serviceRoleKey;
    }

    private string GetValidatedServiceRoleKey()
    {
        var key = GetServiceRoleKey();
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "Supabase admin-nøgle mangler. Sæt `Supabase:ServiceRoleKey` eller `Supabase:SecretKey` i backend-konfigurationen.");
        }

        // Supabase secret keys are prefixed and valid for admin APIs.
        if (key.StartsWith("sb_secret_", StringComparison.Ordinal))
        {
            return key;
        }

        // Legacy keys are JWTs. If role claim is present and not service_role, it's the wrong key.
        var jwtRole = TryReadJwtRoleClaim(key);
        if (!string.IsNullOrWhiteSpace(jwtRole) &&
            !string.Equals(jwtRole, "service_role", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Forkert Supabase admin-nøgle: den konfigurerede JWT har ikke role=service_role. " +
                "Brug en service_role key eller en sb_secret_ key i backend.");
        }

        return key;
    }

    private string GetRecoveryRedirectUrl()
    {
        var recoveryRedirectUrl =
            _configuration["Supabase:RecoveryRedirectUrl"]?.Trim()
            ?? Environment.GetEnvironmentVariable("Supabase__RecoveryRedirectUrl")?.Trim()
            ?? Environment.GetEnvironmentVariable("SUPABASE_RECOVERY_REDIRECT_URL")?.Trim()
            ?? "http://localhost:3000/reset-password";

        return recoveryRedirectUrl;
    }

    private static bool IsPlaceholderSecret(string? value)
    {
        return string.Equals(value, "DIN_SUPABASE_SERVICE_ROLE_KEY_HER", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "DIN_SUPABASE_SECRET_KEY_HER", StringComparison.OrdinalIgnoreCase);
    }

    private static string? NormalizeSecret(string? value)
    {
        return value?.Trim().Trim('\"').Trim('\'');
    }

    private static string? TryReadJwtRoleClaim(string key)
    {
        var parts = key.Split('.');
        if (parts.Length < 2)
        {
            return null;
        }

        try
        {
            var payloadBytes = Base64UrlDecode(parts[1]);
            var payload = JsonSerializer.Deserialize<JwtPayload>(payloadBytes);
            return payload?.Role;
        }
        catch
        {
            return null;
        }
    }

    private static byte[] Base64UrlDecode(string input)
    {
        var base64 = input.Replace('-', '+').Replace('_', '/');
        switch (base64.Length % 4)
        {
            case 2:
                base64 += "==";
                break;
            case 3:
                base64 += "=";
                break;
        }

        return Convert.FromBase64String(base64);
    }

    private sealed class JwtPayload
    {
        [JsonPropertyName("role")]
        public string? Role { get; init; }
    }

    private static string NormalizeEmail(string email)
    {
        var normalized = email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new InvalidOperationException("Email mangler.");
        }

        return normalized;
    }

    private static string ExtractFriendlyMessage(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return "Ukendt fejl.";
        }

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;

            return TryGetString(root, "message")
                ?? TryGetString(root, "msg")
                ?? TryGetNestedString(root, "error", "message")
                ?? TryGetNestedString(root, "error", "msg")
                ?? responseBody;
        }
        catch
        {
            return responseBody;
        }
    }

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (element.ValueKind == JsonValueKind.Object &&
            element.TryGetProperty(propertyName, out var property) &&
            property.ValueKind == JsonValueKind.String)
        {
            return property.GetString();
        }

        return null;
    }

    private static string? TryGetNestedString(JsonElement element, string parentPropertyName, string childPropertyName)
    {
        if (element.ValueKind != JsonValueKind.Object ||
            !element.TryGetProperty(parentPropertyName, out var parent) ||
            parent.ValueKind != JsonValueKind.Object ||
            !parent.TryGetProperty(childPropertyName, out var child) ||
            child.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return child.GetString();
    }

}

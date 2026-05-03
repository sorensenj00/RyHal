using System.Collections.Concurrent;
using System.Security.Cryptography;
using SportCenter.Api.DTOs;

namespace SportCenter.Api.Services;

public sealed class AuthTransferService
{
    private static readonly TimeSpan TransferLifetime = TimeSpan.FromSeconds(60);
    private readonly ConcurrentDictionary<string, TransferRecord> _transfers = new();

    public CreateTransferResponseDto CreateTransfer(string accessToken, string refreshToken)
    {
        CleanupExpiredTransfers();

        var normalizedAccessToken = accessToken?.Trim();
        var normalizedRefreshToken = refreshToken?.Trim();

        if (string.IsNullOrWhiteSpace(normalizedAccessToken) || string.IsNullOrWhiteSpace(normalizedRefreshToken))
        {
            throw new InvalidOperationException("Sessionen mangler adgangs- eller refresh-token.");
        }

        var code = GenerateCode();
        var expiresAt = DateTime.UtcNow.Add(TransferLifetime);

        _transfers[code] = new TransferRecord(normalizedAccessToken, normalizedRefreshToken, expiresAt);

        return new CreateTransferResponseDto
        {
            TransferCode = code,
            ExpiresAt = expiresAt
        };
    }

    public RedeemTransferResponseDto RedeemTransfer(string transferCode)
    {
        CleanupExpiredTransfers();

        var normalizedCode = transferCode?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedCode) || !_transfers.TryRemove(normalizedCode, out var record))
        {
            throw new UnauthorizedAccessException("Transfer-koden er ugyldig eller udløbet.");
        }

        if (record.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Transfer-koden er udløbet.");
        }

        return new RedeemTransferResponseDto
        {
            AccessToken = record.AccessToken,
            RefreshToken = record.RefreshToken
        };
    }

    private void CleanupExpiredTransfers()
    {
        var now = DateTime.UtcNow;
        foreach (var item in _transfers)
        {
            if (item.Value.ExpiresAt <= now)
            {
                _transfers.TryRemove(item.Key, out _);
            }
        }
    }

    private static string GenerateCode()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private sealed record TransferRecord(string AccessToken, string RefreshToken, DateTime ExpiresAt);
}

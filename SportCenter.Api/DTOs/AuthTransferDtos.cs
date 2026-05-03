namespace SportCenter.Api.DTOs;

public sealed class CreateTransferRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

public sealed class CreateTransferResponseDto
{
    public string TransferCode { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public sealed class RedeemTransferRequestDto
{
    public string TransferCode { get; set; } = string.Empty;
}

public sealed class RedeemTransferResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

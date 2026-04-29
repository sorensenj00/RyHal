namespace SportCenter.Api.DTOs;

public record ContactDto(
    int ContactId,
    string Name,
    string? Title,
    string? ProfileImageUrl,
    string? Phone,
    string? Email
);

public record CreateContactDto(
    string Name,
    string? Title,
    string? ProfileImageUrl,
    string? Phone,
    string? Email
);

public record UpdateContactDto(
    string? Name,
    string? Title,
    string? ProfileImageUrl,
    string? Phone,
    string? Email
);

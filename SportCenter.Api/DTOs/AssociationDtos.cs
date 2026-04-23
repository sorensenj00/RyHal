namespace SportCenter.Api.DTOs;

public record ContactSummaryDto(
    int ContactId,
    string Name,
    string? Title,
    string? ProfileImageUrl,
    string? Phone,
    string? Email
);

public record AssociationDto(
    int AssociationId,
    string Name,
    string? WebsiteUrl,
    List<ContactSummaryDto> Contacts
);

public record CreateAssociationDto(
    string Name,
    string? WebsiteUrl
);

public record UpdateAssociationDto(
    string? Name,
    string? WebsiteUrl
);

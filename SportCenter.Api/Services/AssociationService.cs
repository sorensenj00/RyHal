using Supabase;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using Postgrest.Exceptions;
using Postgrest.Attributes;
using Postgrest.Models;

namespace SportCenter.Api.Services;

public class AssociationService
{
    [Table("association")]
    private class AssociationInsertWithId : BaseModel
    {
        [PrimaryKey("association_id", false)]
        [Column("association_id")]
        public int AssociationId { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("website_url")]
        public string? WebsiteUrl { get; set; }
    }

    private readonly Client _supabase;

    public AssociationService(Client supabase)
    {
        _supabase = supabase;
    }

    private async Task ApplySessionAsync(string? accessToken)
    {
        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
        }
    }

    public async Task<List<AssociationDto>> GetAllAsync(string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var associations = (await _supabase.From<Association>().Get()).Models;
        var links = (await _supabase.From<AssociationContact>().Get()).Models;
        var contacts = (await _supabase.From<Contact>().Get()).Models;

        var contactsById = contacts.ToDictionary(c => c.ContactId);

        return associations
            .Select(a => new AssociationDto(
                a.AssociationId,
                a.Name,
                a.WebsiteUrl,
                links
                    .Where(l => l.AssociationId == a.AssociationId)
                    .Select(l => contactsById.TryGetValue(l.ContactId, out var contact)
                        ? new ContactSummaryDto(
                            contact.ContactId,
                            contact.Name,
                            contact.Title,
                            contact.ProfileImageUrl,
                            contact.Phone,
                            contact.Email)
                        : null)
                    .Where(c => c != null)
                    .Cast<ContactSummaryDto>()
                    .ToList()))
            .ToList();
    }

    public async Task<AssociationDto?> GetByIdAsync(int associationId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var association = (await _supabase.From<Association>()
                .Where(a => a.AssociationId == associationId)
                .Get())
            .Models
            .FirstOrDefault();

        if (association == null)
        {
            return null;
        }

        var links = (await _supabase.From<AssociationContact>()
                .Where(l => l.AssociationId == associationId)
                .Get())
            .Models;

        var contacts = (await _supabase.From<Contact>().Get()).Models;
        var contactsById = contacts.ToDictionary(c => c.ContactId);

        var dtoContacts = links
            .Select(l => contactsById.TryGetValue(l.ContactId, out var contact)
                ? new ContactSummaryDto(
                    contact.ContactId,
                    contact.Name,
                    contact.Title,
                    contact.ProfileImageUrl,
                    contact.Phone,
                    contact.Email)
                : null)
            .Where(c => c != null)
            .Cast<ContactSummaryDto>()
            .ToList();

        return new AssociationDto(
            association.AssociationId,
            association.Name,
            association.WebsiteUrl,
            dtoContacts);
    }

    public async Task<AssociationDto> CreateAsync(CreateAssociationDto dto, string? accessToken = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("Navn er påkrævet.");
        }

        await ApplySessionAsync(accessToken);

        var newAssociation = new Association
        {
            Name = dto.Name.Trim(),
            WebsiteUrl = string.IsNullOrWhiteSpace(dto.WebsiteUrl) ? null : dto.WebsiteUrl.Trim()
        };

        var normalizedName = newAssociation.Name;
        var normalizedWebsiteUrl = newAssociation.WebsiteUrl;

        Association created;

        try
        {
            created = (await _supabase.From<Association>().Insert(newAssociation)).Models.First();

            if (created.AssociationId <= 0)
            {
                // Defensive self-heal: if DB returns an invalid ID, remove it and recreate with an explicit valid ID.
                await _supabase.From<Association>()
                    .Where(a => a.AssociationId == created.AssociationId)
                    .Delete();

                var recreated = await CreateAssociationWithExplicitPositiveIdAsync(normalizedName, normalizedWebsiteUrl);

                return new AssociationDto(
                    recreated.AssociationId,
                    recreated.Name,
                    recreated.WebsiteUrl,
                    new List<ContactSummaryDto>());
            }
        }
        catch (PostgrestException ex) when (IsAssociationPrimaryKeyConflict(ex))
        {
            try
            {
                var fallbackCreated = await CreateAssociationWithExplicitPositiveIdAsync(normalizedName, normalizedWebsiteUrl);

                return new AssociationDto(
                    fallbackCreated.AssociationId,
                    fallbackCreated.Name,
                    fallbackCreated.WebsiteUrl,
                    new List<ContactSummaryDto>());
            }
            catch (PostgrestException fallbackEx) when (IsAssociationPrimaryKeyConflict(fallbackEx))
            {
                throw new InvalidOperationException(
                    "Foreningen kunne ikke oprettes pga. vedvarende ID-konflikt i databasen. Verificér at association_id default bruger nextval(...) og at sekvensen er synkroniseret.",
                    fallbackEx);
            }
        }

        return new AssociationDto(created.AssociationId, created.Name, created.WebsiteUrl, new List<ContactSummaryDto>());
    }

    private static bool IsAssociationPrimaryKeyConflict(PostgrestException exception)
        => exception.Message.Contains("association_pkey") || exception.Message.Contains("\"code\":\"23505\"");

    private async Task<AssociationInsertWithId> CreateAssociationWithExplicitPositiveIdAsync(string name, string? websiteUrl)
    {
        var existingAssociations = (await _supabase
            .From<Association>()
            .Select("association_id")
            .Get()).Models;

        var currentMax = existingAssociations.Count == 0
            ? 0
            : existingAssociations.Max(a => a.AssociationId);

        var nextAssociationId = Math.Max(1, currentMax + 1);

        var fallbackAssociation = new AssociationInsertWithId
        {
            AssociationId = nextAssociationId,
            Name = name,
            WebsiteUrl = websiteUrl
        };

        return (await _supabase
            .From<AssociationInsertWithId>()
            .Insert(fallbackAssociation)).Models.First();
    }

    public async Task<AssociationDto?> UpdateAsync(int associationId, UpdateAssociationDto dto, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var existing = (await _supabase.From<Association>()
                .Where(a => a.AssociationId == associationId)
                .Get())
            .Models
            .FirstOrDefault();

        if (existing == null)
        {
            return null;
        }

        var query = _supabase.From<Association>()
            .Where(a => a.AssociationId == associationId);

        var hasChanges = false;

        if (dto.Name != null)
        {
            var trimmed = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                throw new ArgumentException("Navn må ikke være tomt.");
            }

            query = query.Set(a => a.Name, trimmed);
            hasChanges = true;
        }

        if (dto.WebsiteUrl != null)
        {
            query = query.Set(a => a.WebsiteUrl, string.IsNullOrWhiteSpace(dto.WebsiteUrl) ? null : dto.WebsiteUrl.Trim());
            hasChanges = true;
        }

        if (hasChanges)
        {
            await query.Update();
        }

        return await GetByIdAsync(associationId, accessToken);
    }

    public async Task<bool> DeleteAsync(int associationId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var existing = (await _supabase.From<Association>()
                .Where(a => a.AssociationId == associationId)
                .Get())
            .Models
            .FirstOrDefault();

        if (existing == null)
        {
            return false;
        }

        await _supabase.From<AssociationContact>()
            .Where(ac => ac.AssociationId == associationId)
            .Delete();

        await _supabase.From<Event>()
            .Where(e => e.AssociationId == associationId)
            .Set(e => e.AssociationId, (int?)null)
            .Update();

        await _supabase.From<EventSeries>()
            .Where(es => es.AssociationId == associationId)
            .Set(es => es.AssociationId, (int?)null)
            .Update();

        await _supabase.From<Association>()
            .Where(a => a.AssociationId == associationId)
            .Delete();

        return true;
    }

    public async Task LinkContactAsync(int associationId, int contactId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var associationExists = (await _supabase.From<Association>()
                .Where(a => a.AssociationId == associationId)
                .Get())
            .Models
            .Any();

        if (!associationExists)
        {
            throw new KeyNotFoundException($"Forening med id {associationId} blev ikke fundet.");
        }

        var contactExists = (await _supabase.From<Contact>()
                .Where(c => c.ContactId == contactId)
                .Get())
            .Models
            .Any();

        if (!contactExists)
        {
            throw new KeyNotFoundException($"Kontakt med id {contactId} blev ikke fundet.");
        }

        var existingLink = (await _supabase.From<AssociationContact>()
                .Where(ac => ac.AssociationId == associationId)
                .Where(ac => ac.ContactId == contactId)
                .Get())
            .Models
            .FirstOrDefault();

        if (existingLink != null)
        {
            return;
        }

        await _supabase.From<AssociationContact>().Insert(new AssociationContact
        {
            AssociationId = associationId,
            ContactId = contactId
        });
    }

    public async Task UnlinkContactAsync(int associationId, int contactId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        await _supabase.From<AssociationContact>()
            .Where(ac => ac.AssociationId == associationId)
            .Where(ac => ac.ContactId == contactId)
            .Delete();
    }

    public async Task AssignToEventAsync(int associationId, int eventId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var associationExists = (await _supabase.From<Association>()
                .Where(a => a.AssociationId == associationId)
                .Get())
            .Models
            .Any();

        if (!associationExists)
        {
            throw new KeyNotFoundException($"Forening med id {associationId} blev ikke fundet.");
        }

        var eventModel = (await _supabase.From<Event>()
                .Where(e => e.Id == eventId)
                .Get())
            .Models
            .FirstOrDefault();

        if (eventModel == null)
        {
            throw new KeyNotFoundException($"Event med id {eventId} blev ikke fundet.");
        }

        await _supabase.From<Event>()
            .Where(e => e.Id == eventId)
            .Set(e => e.AssociationId, associationId)
            .Update();
    }

    public async Task UnassignFromEventAsync(int eventId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        await _supabase.From<Event>()
            .Where(e => e.Id == eventId)
            .Set(e => e.AssociationId, (int?)null)
            .Update();
    }

    public async Task AssignToSeriesAsync(int associationId, int seriesId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        var associationExists = (await _supabase.From<Association>()
                .Where(a => a.AssociationId == associationId)
                .Get())
            .Models
            .Any();

        if (!associationExists)
        {
            throw new KeyNotFoundException($"Forening med id {associationId} blev ikke fundet.");
        }

        var seriesExists = (await _supabase.From<EventSeries>()
                .Where(es => es.Id == seriesId)
                .Get())
            .Models
            .Any();

        if (!seriesExists)
        {
            throw new KeyNotFoundException($"Eventserie med id {seriesId} blev ikke fundet.");
        }

        await _supabase.From<EventSeries>()
            .Where(es => es.Id == seriesId)
            .Set(es => es.AssociationId, associationId)
            .Update();
    }

    public async Task UnassignFromSeriesAsync(int seriesId, string? accessToken = null)
    {
        await ApplySessionAsync(accessToken);

        await _supabase.From<EventSeries>()
            .Where(es => es.Id == seriesId)
            .Set(es => es.AssociationId, (int?)null)
            .Update();
    }
}

using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SportCenter.Api.Models.Converters;

/// <summary>
/// System.Text.Json converter der altid serialiserer DateTime? som "yyyy-MM-ddTHH:mm:ss"
/// uden tidszone-suffiks (ingen Z, ingen +02:00).
/// Forhindrer at browser-siden forskyder datoer via UTC-konvertering.
/// </summary>
public sealed class SystemTextJsonDateTimeConverter : JsonConverter<DateTime?>
{
    private const string Format = "yyyy-MM-dd'T'HH:mm:ss";

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        var raw = reader.GetString();
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (DateTime.TryParseExact(raw, Format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            return DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified);

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out parsed))
            return DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified);

        return null;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        // Altid skriv uden tidszone-information, uanset DateTimeKind
        writer.WriteStringValue(value.Value.ToString(Format, CultureInfo.InvariantCulture));
    }
}

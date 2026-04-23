using System.Globalization;
using Newtonsoft.Json;

namespace SportCenter.Api.Models.Converters;

public sealed class LocalDateTimeJsonConverter : JsonConverter<DateTime?>
{
    private static readonly string[] ParseFormats =
    [
        "yyyy-MM-dd'T'HH:mm:ss.FFFFFFFK",
        "yyyy-MM-dd'T'HH:mm:ssK",
        "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd"
    ];

    public override void WriteJson(JsonWriter writer, DateTime? value, JsonSerializer serializer)
    {
        if (!value.HasValue)
        {
            writer.WriteNull();
            return;
        }

        writer.WriteValue(value.Value.ToString("yyyy-MM-dd'T'HH:mm:ss", CultureInfo.InvariantCulture));
    }

    public override DateTime? ReadJson(JsonReader reader, Type objectType, DateTime? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
        {
            return null;
        }

        var raw = reader.Value?.ToString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (DateTime.TryParseExact(raw, ParseFormats, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
        {
            return parsed.Kind == DateTimeKind.Utc
                ? DateTime.SpecifyKind(parsed.ToLocalTime(), DateTimeKind.Unspecified)
                : DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified);
        }

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out parsed))
        {
            return parsed.Kind == DateTimeKind.Utc
                ? DateTime.SpecifyKind(parsed.ToLocalTime(), DateTimeKind.Unspecified)
                : DateTime.SpecifyKind(parsed, DateTimeKind.Unspecified);
        }

        throw new JsonSerializationException($"Kunne ikke parse datetime-værdi '{raw}'.");
    }
}

public sealed class LocalDateOnlyJsonConverter : JsonConverter<DateTime?>
{
    public override void WriteJson(JsonWriter writer, DateTime? value, JsonSerializer serializer)
    {
        if (!value.HasValue)
        {
            writer.WriteNull();
            return;
        }

        writer.WriteValue(value.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
    }

    public override DateTime? ReadJson(JsonReader reader, Type objectType, DateTime? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
        {
            return null;
        }

        var raw = reader.Value?.ToString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
        {
            return DateTime.SpecifyKind(parsed.Date, DateTimeKind.Unspecified);
        }

        throw new JsonSerializationException($"Kunne ikke parse dato-værdi '{raw}'.");
    }
}
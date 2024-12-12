using System.Text.Json;
using System.Text.Json.Serialization;

namespace VideoWeb.Common.Caching
{
    public static class CachingHelper
    {
        public static JsonSerializerOptions JsonSerializerOptions => new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,                       
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
            Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)}
        };
    }
}

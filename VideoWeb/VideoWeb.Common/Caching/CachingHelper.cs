using Newtonsoft.Json;

namespace VideoWeb.Common.Caching
{
    public static class CachingHelper
    {
        public static JsonSerializerSettings SerializerSettings => new JsonSerializerSettings
        {
            TypeNameHandling = TypeNameHandling.Objects, Formatting = Formatting.None
        };
    }
}

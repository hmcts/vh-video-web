using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.Extensions;

public static class VhCollectionExtensions
{
    public static bool IsNullOrEmpty<T>(this ICollection<T> collection)
    {
        return collection == null || !collection.Any();
    }
    
    public static bool IsNullOrEmpty(this string value)
    {
        return string.IsNullOrEmpty(value);
    }
}

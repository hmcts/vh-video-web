using System.Collections.Generic;

namespace VideoWeb.Extensions;

public static class VhCollectionExtensions
{
    public static bool IsNullOrEmpty<T>(this ICollection<T> collection)
    {
        return collection == null || collection.Count == 0;
    }
    
    public static bool IsNullOrEmpty(this string value)
    {
        return string.IsNullOrEmpty(value);
    }
}

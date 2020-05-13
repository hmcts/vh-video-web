namespace VideoWeb.Common.Extensions
{
    public static class StringExtensions {
        public static string WithoutDomain(this string source)
        {
            return source.Split('@')[0];
        }
    }
}

using System.ComponentModel;
using System.Runtime.Serialization;

namespace VideoWeb.Common.Extensions
{
    public static class EnumExtensions
    {
        public static string EnumDataMemberAttr<T>(this T source)
        {
            var fi = source.GetType().GetField(source.ToString());

            var attributes = (EnumMemberAttribute[]) fi.GetCustomAttributes(
                typeof(EnumMemberAttribute), false);

            return attributes.Length > 0 ? attributes[0].Value : source.ToString();
        }
        
        public static string DescriptionAttr<T>(this T source)
        {
            var fi = source.GetType().GetField(source.ToString());

            var attributes = (DescriptionAttribute[])fi.GetCustomAttributes(
                typeof(DescriptionAttribute), false);

            return attributes.Length > 0 ? attributes[0].Description : source.ToString();
        }
    }
}

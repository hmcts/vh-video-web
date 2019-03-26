using System.ComponentModel;
using System.Reflection;
using System.Runtime.Serialization;

namespace VideoWeb.Extensions
{
    public static class EnumExtensions
    {
        public static string EnumDataMemberAttr<T>(this T source)
        {
            FieldInfo fi = source.GetType().GetField(source.ToString());

            EnumMemberAttribute[] attributes = (EnumMemberAttribute[]) fi.GetCustomAttributes(
                typeof(EnumMemberAttribute), false);

            if (attributes != null && attributes.Length > 0)
            {
                return attributes[0].Value;
            }
            else
            {
                return source.ToString();
            }
        }
        
        public static string DescriptionAttr<T>(this T source)
        {
            FieldInfo fi = source.GetType().GetField(source.ToString());

            DescriptionAttribute[] attributes = (DescriptionAttribute[])fi.GetCustomAttributes(
                typeof(DescriptionAttribute), false);

            if (attributes != null && attributes.Length > 0) return attributes[0].Description;
            else return source.ToString();
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.Common.Helpers
{
    public interface ILoggingDataExtractor
    {
        Dictionary<string, object> ConvertToDictionary(object input, string path = null, int debth = 0);
    }

    public class LoggingDataExtractor : ILoggingDataExtractor
    {
        public Dictionary<string, object> ConvertToDictionary(object input, string path = null, int debth = 0)
        {
            var result = new Dictionary<string, object>();
            if (debth > 3)
            {
                // Protection from recusrive properties
                return result;
            }

            var type = input.GetType();
            if (!IsCustomType(type))
            {
                result.Add(path, input);
                return result;
            }

            foreach (var property in type.GetProperties())
            {
                var value = property.GetValue(input);
                if (IsCustomType(property.PropertyType))
                {
                    var propertyValues = ConvertToDictionary(value, GetPath(path, property.Name), debth++);
                    foreach (var kvp in propertyValues)
                    {
                        result.Add(kvp.Key, kvp.Value);
                    }
                }
                else if (property.PropertyType != typeof(string) && property.PropertyType.GetInterfaces().Any(x => x.IsGenericType && x.GetGenericTypeDefinition() == typeof(IEnumerable<>)))
                {
                    // Could handle IEnmerables here
                }
                else
                {
                    result.Add(GetPath(path, property.Name), value);
                }
            }

            return result;
        }

        private string GetPath(string path, string property) => $"{path}{(string.IsNullOrEmpty(path) ? string.Empty : ".")}{property}";

        /// <summary>
        /// Pass in type to see if we should recuse deeper
        /// Not generic due to use case.
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        private bool IsCustomType(Type type) => !type.IsEnum && type.AssemblyQualifiedName.StartsWith(GetType().AssemblyQualifiedName.Split('.')[0]);
    }
}

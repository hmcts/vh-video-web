using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace VideoWeb.Common.Helpers
{
    public interface ILoggingDataExtractor
    {
        Dictionary<string, object> ConvertToDictionary(object input, string path = null, int depth = 0);
    }

    public class LoggingDataExtractor : ILoggingDataExtractor
    {
        public Dictionary<string, object> ConvertToDictionary(object input, string path = null, int depth = 0)
        {
            var result = new Dictionary<string, object>();
            if (depth > 3)
            {
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
                depth = ProcessProperty(input, path, depth, property, result);
            }

            return result;
        }
        
        private int ProcessProperty(object input, string path, int depth, PropertyInfo property, Dictionary<string, object> result)
        {
            var value = property.GetValue(input);
            if (IsCustomType(property.PropertyType))
            {
                var propertyValues = ConvertToDictionary(value, GetPath(path, property.Name), depth++);
                foreach (var kvp in propertyValues)
                {
                    result.Add(kvp.Key, kvp.Value);
                }
            }
            else if (property.PropertyType != typeof(string) && property.PropertyType
                         .GetInterfaces()
                         .AsEnumerable()
                         .Any(x => x.IsGenericType && x.GetGenericTypeDefinition() == typeof(IEnumerable<>)))
            {
                result.Add(GetPath(path, property.Name), $"IEnumerable: {property.PropertyType.Name}");
            }
            else
            {
                result.Add(GetPath(path, property.Name), value);
            }
            
            return depth;
        }
        
        private static string GetPath(string path, string property) => $"{path}{(string.IsNullOrEmpty(path) ? string.Empty : ".")}{property}";

        /// <summary>
        /// Pass in type to see if we should recuse deeper
        /// Not generic due to use case.
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        private bool IsCustomType(Type type) => !type.IsEnum && type.AssemblyQualifiedName.StartsWith(GetType().AssemblyQualifiedName.Split('.')[0]);
    }
}

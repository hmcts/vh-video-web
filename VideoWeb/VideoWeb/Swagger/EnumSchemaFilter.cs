using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;
using VideoWeb.Extensions;

namespace VideoWeb.Swagger
{
    public class EnumSchemaFilter : ISchemaFilter
    {
        public void Apply(Schema schema, SchemaFilterContext context)
        {
            if (schema.Properties == null)
                return;

            var enumProperties = schema.Properties.Where(p => p.Value.Enum != null)
                .Union(schema.Properties.Where(p => p.Value.Items?.Enum != null)).ToList();
            var enums = context.SystemType.GetProperties()
                .Select(p => Nullable.GetUnderlyingType(p.PropertyType) ?? p.PropertyType.GetElementType() ??
                             p.PropertyType.GetGenericArguments().FirstOrDefault() ?? p.PropertyType)
                .Where(p => p.GetTypeInfo().IsEnum)
                .Distinct()
                .ToList();

            foreach (var enumProperty in enumProperties)
            {
                var enumPropertyValue = enumProperty.Value.Enum != null ? enumProperty.Value : enumProperty.Value.Items;

                var enumValuesExpected = enumPropertyValue.Enum.Select(e => $"{e}").ToList();
                
                var enumType = enums.SingleOrDefault(p =>
                {
                    var enumValues = new List<string>();
                    foreach (var enumValue in p.GetEnumValues())
                    {
                        enumValues.Add(enumValue.EnumDataMemberAttr());
                    }
                    
                    return !enumValuesExpected.Except(enumValues, StringComparer.InvariantCultureIgnoreCase).Any();
                });

                if (enumType == null)
                    throw new ArgumentException($"Property {enumProperty} not found in {context.SystemType.Name} Type.");

                if (!context.SchemaRegistry.Definitions.ContainsKey(enumType.Name))
                    context.SchemaRegistry.Definitions.Add(enumType.Name, enumPropertyValue);

                var enumSchema = new Schema
                {
                    Ref = $"#/definitions/{enumType.Name}"
                };
                if (enumProperty.Value.Enum != null)
                {
                    schema.Properties[enumProperty.Key] = enumSchema;
                }
                else if (enumProperty.Value.Items?.Enum != null)
                {
                    enumProperty.Value.Items = enumSchema;
                }
            }
        }
    }
}
using System.Linq;
using System.Text;
using System.Text.Json;

namespace VideoWeb.Extensions.SerialisationConfig;

public class SnakeCaseJsonNamingPolicy : JsonNamingPolicy
{
    public override string ConvertName(string name)
    {
        if (string.IsNullOrEmpty(name))
            return name;

        var result = new StringBuilder();
        var previousWasUpper = false;
        for (var i = 0; i < name.Length; i++)
        {
            var currentChar = name[i];
            if (char.IsUpper(currentChar))
            {
                EvaluateUpperCaseChar(name, result, currentChar, i, previousWasUpper);
                previousWasUpper = true;
            }
            else
            {
                EvaluateLowerCaseChar(name, previousWasUpper, i, result, currentChar);
                previousWasUpper = false;
            }
        }
        return result.ToString();
    }
    
    private static void EvaluateLowerCaseChar(string name, bool previousWasUpper, int index, StringBuilder result,
        char currentChar)
    {
        // if two consecutive upper case letters this is an acronym
        // once followed by a lower case letter, this is the end, insert an underscore behind
        if(previousWasUpper && index > 2 && char.IsUpper(name[index - 2]))
            result.Insert(result.Length - 1, '_');
        
        result.Append(currentChar);
    }
    
    private static void EvaluateUpperCaseChar(string name, StringBuilder result, char currentChar, int index,
        bool previousWasUpper)
    {
        result.Append(char.ToLowerInvariant(currentChar));
        
        // if the previous character was not an upper case letter this is a new word so insert an underscore behind
        if (index > 0 && !previousWasUpper && char.IsLetterOrDigit(name[index - 1]))
            result.Insert(result.Length - 1, '_');
    }
}

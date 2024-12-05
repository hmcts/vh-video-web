using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
namespace VideoWeb.Common.Caching
{
    public static class InterpreterLanguageMapper
    {
        public static InterpreterLanguage Map(this InterpreterLanguagesResponse response)
        {
            return new InterpreterLanguage
            {
                Code = response.Code,
                Description = response.Value,
                Type = (InterpreterType)response.Type
            };
        }
    }
}

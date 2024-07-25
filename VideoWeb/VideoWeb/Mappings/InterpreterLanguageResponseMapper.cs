using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using InterpreterType = VideoWeb.Contract.Responses.InterpreterType;

namespace VideoWeb.Mappings
{
    public static class InterpreterLanguageResponseMapper
    {
        public static InterpreterLanguageResponse Map(this InterpreterLanguage model)
        {
            return new InterpreterLanguageResponse
            {
                Code = model.Code,
                Description = model.Description,
                Type = (InterpreterType)model.Type
            };
        }
    }
}

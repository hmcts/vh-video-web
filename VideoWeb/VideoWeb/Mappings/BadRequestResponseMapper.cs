using System.Collections.Generic;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings
{
    public static class BadRequestResponseMapper
    {
        public static BadRequestModelResponse MapToResponse(Dictionary<string, string[]> errors)
        {
            var response = new BadRequestModelResponse();

            foreach (var (key, value) in errors)
            {
                response.Errors.Add(new BadModel
                {
                    Title = key,
                    Errors = value
                });
            }
            return response;
        }
    }
}

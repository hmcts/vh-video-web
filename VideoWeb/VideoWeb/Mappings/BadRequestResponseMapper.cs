using System.Collections.Generic;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class BadRequestResponseMapper : IMapTo<Dictionary<string, string[]>, BadRequestModelResponse>
    {
        public BadRequestModelResponse Map(Dictionary<string, string[]> errors)
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

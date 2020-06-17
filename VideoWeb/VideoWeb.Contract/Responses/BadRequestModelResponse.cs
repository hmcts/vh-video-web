using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class BadRequestModelResponse
    {
        public BadRequestModelResponse()
        {
            Errors = new List<BadModel>();
        }

        public List<BadModel> Errors { get; }
    }

    public class BadModel
    {
        public string Title { get; set; }
        public string[] Errors { get; set; }
    }
}

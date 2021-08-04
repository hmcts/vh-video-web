using AcceptanceTests.Common.Api.Hearings;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class Apis
    {
        public TestApiManager TestApi { get; set; }
        public BookingsApiManager BookingsApi { get; set; }
        public VideoWebApiManager VideoWebApi { get; set; }
    }
}

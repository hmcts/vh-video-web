using AcceptanceTests.Common.Api.Hearings;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public class Apis
    {
        public BookingsApiManager BookingsApi { get; set; }
        public VideoApiManager VideoApi { get; set; }
        public VideoWebApiManager VideoWebApi { get; set; }
    }
}

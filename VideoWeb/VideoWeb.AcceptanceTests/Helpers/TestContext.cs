using AcceptanceTests.Common.Configuration;
using AcceptanceTests.Common.Data.Time;
using AcceptanceTests.Common.Driver.Drivers;
using VideoWeb.AcceptanceTests.Configuration;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using Test = VideoWeb.AcceptanceTests.Data.Test;
using TestApi.Contract.Dtos;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public Apis Apis { get; set; }
        public UserDto CurrentUser { get; set; }
        public DriverSetup Driver { get; set; }
        public Test Test { get; set; }
        public TimeZone TimeZone { get; set; }
        public VideoWebTokens Tokens { get; set; }
        public VideoWebConfig VideoWebConfig { get; set; }
        public ZapConfiguration ZapConfiguration { get; set; }
    }
}

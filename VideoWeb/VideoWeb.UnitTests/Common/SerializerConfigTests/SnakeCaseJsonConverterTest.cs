using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Extensions.SerialisationConfig;

namespace VideoWeb.UnitTests.Common.SerializerConfigTests;

[TestFixture]
public class SnakeCaseJsonConverterTest
{
    
    [TestCase("AppInsightsConnectionString", "app_insights_connection_string")]
    [TestCase("EnableIOSMobileSupport", "enable_ios_mobile_support")]
    [TestCase("HTTPRequestHandler", "http_request_handler")]
    [TestCase("EJudIdpSettings", "ejud_idp_settings")]
    [TestCase("VHIdpSettings", "vh_idp_settings")]
    public void Should_convert_camel_case_to_snake_case(string input, string expected)
    {
        var snakeJsonNamingPolicy = new SnakeCaseJsonNamingPolicy();
        var result = snakeJsonNamingPolicy.ConvertName(input);
        result.Should().Be(expected);
    }
}

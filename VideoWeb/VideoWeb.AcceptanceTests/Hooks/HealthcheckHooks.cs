using System.Net;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class HealthcheckHooks
    {
        [BeforeScenario(Order = (int) HooksSequence.HealthcheckHooks)]
        public void CheckApiHealth(TestContext context)
        {
            var response = context.Apis.TestApi.HealthCheck();
            response.StatusCode.Should().Be(HttpStatusCode.OK,
                $"Healthcheck failed with '{response.StatusCode}' and error message '{response.ErrorMessage}'");
        }
    }
}

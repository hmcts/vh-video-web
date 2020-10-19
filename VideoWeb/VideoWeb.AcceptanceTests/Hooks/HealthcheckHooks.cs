using System;
using System.Net;
using FluentAssertions;
using Polly;
using RestSharp;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class HealthcheckHooks
    {
        private const int RETRIES = 4;

        [BeforeScenario(Order = (int) HooksSequence.HealthcheckHooks)]
        public void CheckApiHealth(TestContext context)
        {
            var retryOnForbiddenFirewallExceptions = Policy
                .HandleResult<IRestResponse>(r => r.StatusCode == HttpStatusCode.Forbidden)
                .WaitAndRetry(RETRIES, retryAttempt =>
                        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    (exception, timeSpan) =>
                    {
                        NUnit.Framework.TestContext.WriteLine($"Encountered error '{exception.Result.StatusCode}' after {timeSpan.Seconds} seconds. Retrying...");
                    });

            var response = retryOnForbiddenFirewallExceptions.Execute(() => context.Apis.TestApi.HealthCheck());
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"Healthcheck failed with '{response.StatusCode}' and error message '{response.ErrorMessage}'");
        }
    }
}

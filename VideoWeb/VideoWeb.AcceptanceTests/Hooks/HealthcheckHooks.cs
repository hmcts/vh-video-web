using AcceptanceTests.Common.Api.Healthchecks;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class HealthcheckHooks
    {
        [BeforeScenario(Order = (int)HooksSequence.HealthcheckHooks)]
        public void CheckApiHealth(TestContext context)
        {
            CheckBookingsApiHealth(context.VideoWebConfig.VhServices.BookingsApiUrl, context.Tokens.BookingsApiBearerToken);
            CheckUserApiHealth(context.VideoWebConfig.VhServices.UserApiUrl, context.Tokens.UserApiBearerToken);
            CheckVideoApiHealth(context.VideoWebConfig.VhServices.VideoApiUrl, context.Tokens.VideoApiBearerToken);
        }

        private static void CheckBookingsApiHealth(string apiUrl, string bearerToken)
        {
            HealthcheckManager.CheckHealthOfBookingsApi(apiUrl, bearerToken);
        }
        private static void CheckUserApiHealth(string apiUrl, string bearerToken)
        {
            HealthcheckManager.CheckHealthOfUserApi(apiUrl, bearerToken);
        }
        private static void CheckVideoApiHealth(string apiUrl, string bearerToken)
        {
            HealthcheckManager.CheckHealthOfVideoApi(apiUrl, bearerToken);
        }
    }
}

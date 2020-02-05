using AcceptanceTests.Common.Api.Hearings;
using AcceptanceTests.Common.Configuration;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class RegisterApisHooks
    {
        [BeforeScenario(Order = (int)HooksSequence.RegisterApisHooks)]
        public void RegisterApis(TestContext context)
        {
            context.Apis = new Apis
            {
                BookingsApi = new BookingsApiManager(context.VideoWebConfig.VhServices.BookingsApiUrl, context.Tokens.BookingsApiBearerToken),
                VideoApi = new VideoApiManager(context.VideoWebConfig.VhServices.VideoApiUrl, context.Tokens.VideoApiBearerToken),
                VideoWebApi = new VideoWebApiManager(context.VideoWebConfig.VhServices.VideoWebApiUrl, context.Tokens.CallbackBearerToken)
            };
            ConfigurationManager.VerifyConfigValuesSet(context.Apis);
        }
    }
}

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
                TestApi = new TestApiManager(context.VideoWebConfig.VhServices.TestApiUrl, context.Tokens.TestApiBearerToken),
                VideoWebApi = new VideoWebApiManager(context.VideoWebConfig.VhServices.VideoWebApiUrl, context.Tokens.CallbackBearerToken)
            };
            ConfigurationManager.VerifyConfigValuesSet(context.Apis);
        }
    }
}

using AcceptanceTests.Common.Test.Hooks;
using TechTalk.SpecFlow;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class ScenarioHooks
    {
        [BeforeScenario(Order = (int) HooksSequence.ScenarioHooks)]
        public void SkipScenario(TestContext context, ScenarioContext scenario)
        {
            new ShouldTestBeIgnored()
                .ForTest(scenario.ScenarioInfo)
                .WithBrowser(context.VideoWebConfig.TestConfig.TargetBrowser)
                .WithDevice(context.VideoWebConfig.TestConfig.TargetDevice)
                .WithOS(context.VideoWebConfig.TestConfig.TargetOS)
                .Check();
        }
    }
}

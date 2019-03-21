using TechTalk.SpecFlow;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class LogoutSteps
    {
        private readonly ScenarioContext context;

        public LogoutSteps(ScenarioContext injectedContext)
        {
            context = injectedContext;
        }       
    }
}

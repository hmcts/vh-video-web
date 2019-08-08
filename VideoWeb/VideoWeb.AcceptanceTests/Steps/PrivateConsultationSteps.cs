using System.Collections.Generic;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class PrivateConsultationSteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _tc;
        private readonly CommonSteps _commonSteps;

        public PrivateConsultationSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _tc = testContext;
            _commonSteps = commonSteps;
        }

        [When(@"the user starts a private consultation with (.*)")]
        public void WhenTheUserStartsAPrivateConsultationWithIndividual(string user)
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"(.*) accepts the private consultation")]
        public void WhenTheUserAcceptsThePrivateConsultation(string user)
        {
            _commonSteps.GivenInTheUsersBrowser(user);
            ScenarioContext.Current.Pending();
        }

        [Then(@"the participants can talk to each other")]
        public void ThenTheParticipantsCanTalkToEachOther()
        {
            ScenarioContext.Current.Pending();
        }
    }
}

using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class QueueSubscriberSteps
    {
        private readonly TestContext _context;

        public QueueSubscriberSteps(TestContext context)
        {
            _context = context;
        }

        [When(@"I attempt to update the hearing details")]
        public void WhenIAttemptToUpdateTheHearingDetails()
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"I attempt to (.*) the hearing")]
        public void WhenIAttemptToCancelTheHearing(string action)
        {
            ScenarioContext.Current.Pending();
        }

        [When(@"I (.*) a participant from the hearing")]
        public void WhenIAttemptToAddAParticipantToTheHearing(string action)
        {
            ScenarioContext.Current.Pending();
        }

        [Then(@"the conference has been created from the booking")]
        public void ThenTheConferenceHasBeenCreatedFromTheBooking()
        {
            ScenarioContext.Current.Pending();
        }      

        [Then(@"the conference details have been updated")]
        public void ThenTheConferenceDetailsHaveBeenUpdated()
        {
            ScenarioContext.Current.Pending();
        }

        [Then(@"the conference has been cancelled")]
        public void ThenTheConferenceHasBeenCancelled()
        {
            ScenarioContext.Current.Pending();
        }

        [Then(@"the conference has been deleted")]
        public void ThenTheConferenceHasBeenDeleted()
        {
            ScenarioContext.Current.Pending();
        }

        [Then(@"the participant details have been updated")]
        public void ThenTheParticipantDetailsHaveBeenUpdated()
        {
            ScenarioContext.Current.Pending();
        }
    }
}

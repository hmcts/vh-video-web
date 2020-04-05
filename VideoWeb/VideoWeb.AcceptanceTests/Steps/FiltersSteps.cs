using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;
using RoomType = VideoWeb.EventHub.Enums.RoomType;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class FiltersSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly HearingAlertsSteps _alertsSteps;
        public FiltersSteps(TestContext c, HearingAlertsSteps alertsSteps, Dictionary<string, UserBrowser> browsers)
        {
            _c = c;
            _alertsSteps = alertsSteps;
            _browsers = browsers;
        }

        [Given(@"the hearing has every type of alert")]
        public void GivenTheHearingHasEveryTypeOfAlert()
        {
            var participant = GetUserFromConferenceDetails("Individual");
            _alertsSteps.WhenTheJudgeHasSuspendedTheHearing();
            _alertsSteps.WhenAParticipantHasDisconnectedFromTheHearing(participant.Id.ToString(), RoomType.WaitingRoom);
            _alertsSteps.WhenAParticipantHasChosenToBlockUserMedia();
            _alertsSteps.WhenAParticipantHasFailedTheSelfTestWithReason("Failed self-test (Camera)");
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            var participantUser = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("clerk")
                ? _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Judge.ToString()))
                : _c.Test.ConferenceParticipants.Find(x => x.User_role.ToString().Equals(Role.Individual.ToString()));
            return participantUser;
        }
    }
}

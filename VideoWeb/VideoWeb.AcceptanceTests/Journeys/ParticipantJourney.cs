using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Journeys
{
    public class ParticipantJourney : IJourney
    {
        public List<Page> Journey()
        {
            return new List<Page>()
            {
                Page.Login,
                Page.HearingList,
                Page.Introduction,
                Page.EquipmentCheck,
                Page.SwitchOnCamAndMic,
                Page.PracticeVideoHearing,
                Page.CameraWorking,
                Page.MicrophoneWorking,
                Page.SeeAndHearVideo,
                Page.Rules,
                Page.Declaration,
                Page.WaitingRoom,
                Page.Countdown,
                Page.HearingRoom
            };
        }

        public void VerifyUserIsApplicableToJourney(string currentUserRole)
        {
            currentUserRole.ToLower().Should().BeOneOf("participant", "individual", "representative");
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}

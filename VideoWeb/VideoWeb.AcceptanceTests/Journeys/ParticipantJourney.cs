using System.Collections.Generic;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

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

        public void VerifyUserIsApplicableToJourney(UserType userType)
        {
            userType.ToString().ToLower().Should().BeOneOf("participant", "individual", "observer", "representative");
        }

        public void VerifyDestinationIsInThatJourney(Page destinationPage)
        {
            Journey().Should().Contain(destinationPage);
        }
    }
}

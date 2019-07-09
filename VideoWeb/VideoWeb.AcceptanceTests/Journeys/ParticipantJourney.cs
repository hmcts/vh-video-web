namespace VideoWeb.AcceptanceTests.Journeys
{
    public enum ParticipantJourney
    {
        Login = 0,
        HearingList = 1,
        Introduction = 2,
        EquipmentCheck = 3,
        SwitchOnYourCameraAndMicrophone = 4,
        PracticeVideoHearing = 5,
        CameraWorking = 6,
        MicrophoneWorking = 7,
        SeeAndHearVideo = 8,
        Rules = 9,
        Declaration = 10,
        WaitingRoom = 11,
        Countdown = 12,
        HearingRoom = 13,
        NotInParticipantJourney = -99,
        NotFound = -1,
        Unauthorised = -2,
        Help = -3
    }
}

namespace VideoWeb.AcceptanceTests.Journeys
{
    public enum ParticipantJourney
    {
        Login = 0,
        HearingList = 1,
        EquipmentCheck = 2,
        SwitchOnYourCameraAndMicrophone = 3,
        PracticeVideoHearing = 4,
        CameraWorking = 5,
        MicrophoneWorking = 6,
        SeeAndHearVideo = 7,
        Rules = 8,
        Declaration = 9,
        WaitingRoom = 10,
        Countdown = 11,
        HearingRoom = 12,
        NotInParticipantJourney = -99,
        NotFound = -1,
        Unauthorised = -2,
        Help = -3
    }
}

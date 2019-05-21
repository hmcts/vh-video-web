namespace VideoWeb.AcceptanceTests.Journeys
{
    public enum ParticipantJourney
    {
        Login = 0,
        HearingList = 1,
        EquipmentCheck = 2,
        SwitchOnYourCameraAndMicrophone = 3,
        CameraWorking = 4,
        MicrophoneWorking = 5,
        SeeAndHearVideo = 6,
        Rules = 7,
        Declaration = 8,
        WaitingRoom = 9,
        Countdown = 10,
        HearingRoom = 11,
        NotInParticipantJourney = -99,
        NotFound = -1,
        Unauthorised = -2
    }
}

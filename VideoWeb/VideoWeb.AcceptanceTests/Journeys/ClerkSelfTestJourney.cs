namespace VideoWeb.AcceptanceTests.Journeys
{
    public enum ClerkSelfTestJourney
    {
        Login = 0,
        HearingList = 1,
        EquipmentCheck = 2,
        SwitchOnYourCameraAndMicrophone = 3,
        PracticeVideoHearing = 4,        
        NotInClerkSelfTestJourney = -99,
        NotFound = -1,
        Unauthorised = -2,
        Help = -3
    }
}

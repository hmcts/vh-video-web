namespace VideoWeb.AcceptanceTests.Journeys
{
    public enum JudgeJourney
    {
        Login = 0,
        HearingList = 1,
        WaitingRoom = 2,
        Countdown = 3,
        NotInJudgeJourney = -99,
        NotFound = -1,
        Unauthorised = -2
    }
}

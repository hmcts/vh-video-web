namespace VideoWeb.AcceptanceTests.Steps
{
    public class IntroductionSteps : ISteps
    {
        private readonly CommonSteps _commonSteps;

        public IntroductionSteps(CommonSteps commonSteps)
        {
            _commonSteps = commonSteps;
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhentheUserClicksTheButtonWithInnertext("Next");
        }
    }
}

namespace VideoWeb.AcceptanceTests.Steps
{
    public class EquipmentCheckSteps : ISteps
    {
        private readonly CommonSteps _commonSteps;

        public EquipmentCheckSteps(CommonSteps commonSteps)
        {
            _commonSteps = commonSteps;
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserClicksTheButton("Continue");
        }
    }
}

namespace VideoWeb.AcceptanceTests.Steps
{
    public class EquipmentWorkingSteps : ISteps
    {
        private readonly CommonSteps _commonSteps;

        public EquipmentWorkingSteps(CommonSteps commonSteps)
        {
            _commonSteps = commonSteps;
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserSelectsTheRadiobutton("Yes");
            _commonSteps.WhentheUserClicksTheButton("Continue");
        }
    }
}

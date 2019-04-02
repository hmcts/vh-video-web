using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Steps
{
    public sealed class DataSetupSteps
    {
        private readonly TestContext _context;

        public DataSetupSteps(TestContext context)
        {
            _context = context;
        }

        [Given(@"I have a hearing")]
        public void GivenIHaveAHearing()
        {
            
        }
    }
}

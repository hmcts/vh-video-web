using AcceptanceTests.Common.Driver.Support;
using NUnit.Framework;
using TechTalk.SpecFlow;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class ScenarioHooks
    {
        [BeforeScenario(Order = (int) HooksSequence.ScenarioHooks)]
        public void SkipScenario(TestContext test, ScenarioContext scenario)
        {
            var browser = test.VideoWebConfig.TestConfig.TargetBrowser;
            foreach (var tag in scenario.ScenarioInfo.Tags)
            {
                if (tag.Equals("NotChrome") && browser == TargetBrowser.Chrome ||
                    tag.Equals("NotEdge") && browser == TargetBrowser.Edge ||
                    tag.Equals("NotEdgeChromium") && browser == TargetBrowser.EdgeChromium ||
                    tag.Equals("NotFirefox") && browser == TargetBrowser.Firefox ||
                    tag.Equals("NotIE") && browser == TargetBrowser.Ie11 ||
                    tag.Equals("NotSafari") && browser == TargetBrowser.Safari)
                {
                    Assert.Ignore($"Ignoring the test '{scenario.ScenarioInfo.Title}' on {browser}, as this functionality is not supported in this browser.");
                }
            }
        }
    }
}
